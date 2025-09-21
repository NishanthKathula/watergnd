const express = require('express');
const { body, validationResult } = require('express-validator');
const Station = require('../models/Station');
const Reading = require('../models/Reading');
const Analysis = require('../models/Analysis');
const { optionalAuth } = require('../middleware/auth');
const { performGroundwaterAnalysis } = require('../services/analysisService');
const { getExternalData } = require('../services/externalDataService');

const router = express.Router();

// @desc    Find nearest DWLR station
// @route   POST /api/geolocation/nearest-station
// @access  Public
router.post('/nearest-station', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('radius').optional().isInt({ min: 1, max: 100 }).withMessage('Radius must be between 1-100 km')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { latitude, longitude, radius = 50 } = req.body;

    // Find nearest stations
    const stations = await Station.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      isActive: true,
      status: 'active'
    }).limit(10);

    if (stations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active stations found within the specified radius'
      });
    }

    // Get latest readings for each station
    const stationsWithReadings = await Promise.all(
      stations.map(async (station) => {
        const latestReading = await Reading.findOne({
          stationId: station._id,
          isActive: true
        }).sort({ timestamp: -1 });

        const distance = station.distanceTo(latitude, longitude);

        return {
          stationId: station._id,
          stationCode: station.stationId,
          name: station.name,
          location: station.location,
          address: station.address,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          lastReading: latestReading ? {
            waterLevel: latestReading.waterLevel,
            status: latestReading.waterLevelStatus,
            timestamp: latestReading.timestamp,
            confidence: latestReading.metadata.confidence
          } : null,
          technicalDetails: station.technicalDetails,
          status: station.status
        };
      })
    );

    // Sort by distance
    stationsWithReadings.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: {
        userLocation: { latitude, longitude },
        nearestStation: stationsWithReadings[0],
        nearbyStations: stationsWithReadings.slice(1, 5),
        totalStationsFound: stationsWithReadings.length
      }
    });
  } catch (error) {
    console.error('Nearest station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding nearest station'
    });
  }
});

// @desc    Get groundwater analysis for location
// @route   POST /api/geolocation/analyze
// @access  Public
router.post('/analyze', optionalAuth, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('extractionRate').optional().isInt({ min: 0 }).withMessage('Extraction rate must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { latitude, longitude, extractionRate = 2000 } = req.body;

    // Check if analysis already exists for this location (within 1km)
    const existingAnalysis = await Analysis.getAnalysisByLocation(latitude, longitude, 1);
    
    if (existingAnalysis && 
        (new Date() - existingAnalysis.metadata.analysisDate) < 24 * 60 * 60 * 1000) { // 24 hours
      return res.json({
        success: true,
        data: existingAnalysis,
        cached: true
      });
    }

    // Perform comprehensive groundwater analysis
    const analysisResult = await performGroundwaterAnalysis({
      latitude,
      longitude,
      extractionRate,
      userId: req.user?.id
    });

    // Save analysis to database
    const analysis = new Analysis({
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      ...analysisResult
    });

    await analysis.save();

    res.json({
      success: true,
      data: analysis,
      cached: false
    });
  } catch (error) {
    console.error('Groundwater analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during groundwater analysis'
    });
  }
});

// @desc    Get water level trends for location
// @route   POST /api/geolocation/trends
// @access  Public
router.post('/trends', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('days').optional().isInt({ min: 7, max: 365 }).withMessage('Days must be between 7-365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { latitude, longitude, days = 30 } = req.body;

    // Find nearest station
    const nearestStation = await Station.findOne({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 50 * 1000 // 50km radius
        }
      },
      isActive: true
    });

    if (!nearestStation) {
      return res.status(404).json({
        success: false,
        message: 'No monitoring station found near this location'
      });
    }

    // Get trend analysis
    const trend = await Reading.calculateTrend(nearestStation._id, days);

    // Get historical readings for chart
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const readings = await Reading.getReadingsInRange(
      nearestStation._id, 
      startDate, 
      endDate
    );

    // Get external data (rainfall, weather)
    const externalData = await getExternalData(latitude, longitude, days);

    res.json({
      success: true,
      data: {
        station: {
          id: nearestStation._id,
          name: nearestStation.name,
          distance: nearestStation.distanceTo(latitude, longitude)
        },
        trend,
        readings: readings.map(r => ({
          timestamp: r.timestamp,
          waterLevel: r.waterLevel,
          status: r.waterLevelStatus,
          rainfall: r.rainfall
        })),
        externalData,
        period: days
      }
    });
  } catch (error) {
    console.error('Trends analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during trends analysis'
    });
  }
});

// @desc    Get environmental data for location
// @route   POST /api/geolocation/environmental-data
// @access  Public
router.post('/environmental-data', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { latitude, longitude } = req.body;

    // Get comprehensive environmental data
    const environmentalData = await getExternalData(latitude, longitude, 30);

    res.json({
      success: true,
      data: {
        location: { latitude, longitude },
        ...environmentalData
      }
    });
  } catch (error) {
    console.error('Environmental data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching environmental data'
    });
  }
});

module.exports = router;
