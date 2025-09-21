const express = require('express');
const { body, validationResult } = require('express-validator');
const Station = require('../models/Station');
const Reading = require('../models/Reading');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all stations with pagination and filters
// @route   GET /api/stations
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.state) {
      filter['address.state'] = new RegExp(req.query.state, 'i');
    }
    
    if (req.query.district) {
      filter['address.district'] = new RegExp(req.query.district, 'i');
    }

    // Location-based filtering
    if (req.query.latitude && req.query.longitude && req.query.radius) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const radius = parseFloat(req.query.radius) * 1000; // Convert km to meters

      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius
        }
      };
    }

    // Execute query
    const stations = await Station.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Station.countDocuments(filter);

    // Get latest readings for each station
    const stationsWithReadings = await Promise.all(
      stations.map(async (station) => {
        const latestReading = await Reading.findOne({
          stationId: station._id,
          isActive: true
        }).sort({ timestamp: -1 });

        return {
          ...station.toObject(),
          latestReading: latestReading ? {
            waterLevel: latestReading.waterLevel,
            status: latestReading.waterLevelStatus,
            timestamp: latestReading.timestamp,
            confidence: latestReading.metadata.confidence
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        stations: stationsWithReadings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stations'
    });
  }
});

// @desc    Get single station by ID
// @route   GET /api/stations/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    
    if (!station || !station.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get latest reading
    const latestReading = await Reading.findOne({
      stationId: station._id,
      isActive: true
    }).sort({ timestamp: -1 });

    // Get nearby stations
    const nearbyStations = await station.getNearbyStations(10);

    res.json({
      success: true,
      data: {
        station: {
          ...station.toObject(),
          latestReading: latestReading ? {
            waterLevel: latestReading.waterLevel,
            status: latestReading.waterLevelStatus,
            timestamp: latestReading.timestamp,
            confidence: latestReading.metadata.confidence
          } : null,
          nearbyStations: nearbyStations.map(s => ({
            id: s._id,
            name: s.name,
            distance: station.distanceTo(s.location.coordinates[1], s.location.coordinates[0])
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching station'
    });
  }
});

// @desc    Get station readings with time range
// @route   GET /api/stations/:id/readings
// @access  Public
router.get('/:id/readings', optionalAuth, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    
    if (!station || !station.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const limit = parseInt(req.query.limit) || 100;

    const readings = await Reading.find({
      stationId: station._id,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      },
      isActive: true
    })
    .sort({ timestamp: -1 })
    .limit(limit);

    res.json({
      success: true,
      data: {
        station: {
          id: station._id,
          name: station.name,
          location: station.location
        },
        readings: readings.map(r => ({
          timestamp: r.timestamp,
          waterLevel: r.waterLevel,
          status: r.waterLevelStatus,
          rainfall: r.rainfall,
          confidence: r.metadata.confidence
        })),
        period: {
          start: startDate,
          end: endDate
        },
        count: readings.length
      }
    });
  } catch (error) {
    console.error('Get station readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching station readings'
    });
  }
});

// @desc    Get station trends and statistics
// @route   GET /api/stations/:id/trends
// @access  Public
router.get('/:id/trends', optionalAuth, async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    
    if (!station || !station.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const days = parseInt(req.query.days) || 30;
    const trend = await Reading.calculateTrend(station._id, days);

    // Get statistical summary
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const readings = await Reading.getReadingsInRange(station._id, startDate, endDate);
    
    const stats = readings.length > 0 ? {
      count: readings.length,
      mean: readings.reduce((sum, r) => sum + r.waterLevel, 0) / readings.length,
      min: Math.min(...readings.map(r => r.waterLevel)),
      max: Math.max(...readings.map(r => r.waterLevel)),
      range: Math.max(...readings.map(r => r.waterLevel)) - Math.min(...readings.map(r => r.waterLevel))
    } : null;

    res.json({
      success: true,
      data: {
        station: {
          id: station._id,
          name: station.name
        },
        trend,
        statistics: stats,
        period: days
      }
    });
  } catch (error) {
    console.error('Get station trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching station trends'
    });
  }
});

// @desc    Create new station (Admin only)
// @route   POST /api/stations
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), [
  body('stationId').notEmpty().withMessage('Station ID is required'),
  body('name').notEmpty().withMessage('Station name is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.district').notEmpty().withMessage('District is required')
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

    const stationData = req.body;
    
    // Check if station ID already exists
    const existingStation = await Station.findOne({ stationId: stationData.stationId });
    if (existingStation) {
      return res.status(400).json({
        success: false,
        message: 'Station with this ID already exists'
      });
    }

    const station = await Station.create({
      ...stationData,
      location: {
        type: 'Point',
        coordinates: [stationData.longitude, stationData.latitude]
      }
    });

    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: { station }
    });
  } catch (error) {
    console.error('Create station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating station'
    });
  }
});

// @desc    Update station (Admin only)
// @route   PUT /api/stations/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    res.json({
      success: true,
      message: 'Station updated successfully',
      data: { station }
    });
  } catch (error) {
    console.error('Update station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating station'
    });
  }
});

// @desc    Delete station (Admin only)
// @route   DELETE /api/stations/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    res.json({
      success: true,
      message: 'Station deactivated successfully'
    });
  } catch (error) {
    console.error('Delete station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting station'
    });
  }
});

module.exports = router;
