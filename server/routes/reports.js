const express = require('express');
const { body, validationResult } = require('express-validator');
const Analysis = require('../models/Analysis');
const Station = require('../models/Station');
const Reading = require('../models/Reading');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { generatePDFReport } = require('../services/reportService');

const router = express.Router();

// @desc    Generate location-based groundwater report
// @route   POST /api/reports/location
// @access  Public
router.post('/location', optionalAuth, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('format').optional().isIn(['json', 'pdf']).withMessage('Format must be json or pdf'),
  body('includeRecommendations').optional().isBoolean().withMessage('Include recommendations must be boolean')
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

    const { 
      latitude, 
      longitude, 
      format = 'json', 
      includeRecommendations = true 
    } = req.body;

    // Get or create analysis for the location
    let analysis = await Analysis.getAnalysisByLocation(latitude, longitude, 1);
    
    if (!analysis || (new Date() - analysis.metadata.analysisDate) > 24 * 60 * 60 * 1000) {
      // Perform fresh analysis if not available or outdated
      const { performGroundwaterAnalysis } = require('../services/analysisService');
      const analysisResult = await performGroundwaterAnalysis({
        latitude,
        longitude,
        extractionRate: 2000,
        userId: req.user?.id
      });

      analysis = new Analysis({
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        ...analysisResult
      });

      await analysis.save();
    }

    // Generate report data
    const reportData = await generateLocationReport(analysis, includeRecommendations);

    if (format === 'pdf') {
      // Generate PDF report
      const pdfBuffer = await generatePDFReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="groundwater-report-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } else {
      // Return JSON report
      res.json({
        success: true,
        data: {
          report: reportData,
          generatedAt: new Date(),
          location: { latitude, longitude }
        }
      });
    }
  } catch (error) {
    console.error('Generate location report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating location report'
    });
  }
});

// @desc    Generate area-based groundwater report
// @route   POST /api/reports/area
// @access  Public
router.post('/area', optionalAuth, [
  body('centerLatitude').isFloat({ min: -90, max: 90 }).withMessage('Valid center latitude required'),
  body('centerLongitude').isFloat({ min: -180, max: 180 }).withMessage('Valid center longitude required'),
  body('radius').isInt({ min: 1, max: 100 }).withMessage('Radius must be between 1-100 km'),
  body('format').optional().isIn(['json', 'pdf']).withMessage('Format must be json or pdf')
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

    const { centerLatitude, centerLongitude, radius, format = 'json' } = req.body;

    // Get analyses in the area
    const analyses = await Analysis.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [centerLongitude, centerLatitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      },
      isActive: true
    }).sort({ 'metadata.analysisDate': -1 });

    // Get stations in the area
    const stations = await Station.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [centerLongitude, centerLatitude]
          },
          $maxDistance: radius * 1000
        }
      },
      isActive: true
    });

    // Generate area report
    const reportData = await generateAreaReport({
      center: { latitude: centerLatitude, longitude: centerLongitude },
      radius,
      analyses,
      stations
    });

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="area-groundwater-report-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: {
          report: reportData,
          generatedAt: new Date(),
          area: { center: { latitude: centerLatitude, longitude: centerLongitude }, radius }
        }
      });
    }
  } catch (error) {
    console.error('Generate area report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating area report'
    });
  }
});

// @desc    Generate station-specific report
// @route   GET /api/reports/station/:id
// @access  Public
router.get('/station/:id', optionalAuth, async (req, res) => {
  try {
    const stationId = req.params.id;
    const days = parseInt(req.query.days) || 30;
    const format = req.query.format || 'json';

    // Get station data
    const station = await Station.findById(stationId);
    if (!station || !station.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Get readings for the specified period
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const readings = await Reading.getReadingsInRange(stationId, startDate, endDate);
    
    // Get trend analysis
    const trend = await Reading.calculateTrend(stationId, days);

    // Generate station report
    const reportData = await generateStationReport({
      station,
      readings,
      trend,
      period: { start: startDate, end: endDate, days }
    });

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="station-report-${station.stationId}-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: {
          report: reportData,
          generatedAt: new Date(),
          station: { id: station._id, name: station.name }
        }
      });
    }
  } catch (error) {
    console.error('Generate station report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating station report'
    });
  }
});

// @desc    Generate summary report
// @route   GET /api/reports/summary
// @access  Public
router.get('/summary', optionalAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const format = req.query.format || 'json';

    // Get summary statistics
    const summaryData = await generateSummaryReport(days);

    if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(summaryData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="summary-report-${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: {
          report: summaryData,
          generatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Generate summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating summary report'
    });
  }
});

/**
 * Generate location-based report data
 */
async function generateLocationReport(analysis, includeRecommendations) {
  return {
    type: 'location',
    title: 'Groundwater Assessment Report',
    location: {
      coordinates: analysis.location.coordinates,
      address: 'Location-based analysis' // In production, reverse geocode
    },
    executiveSummary: {
      availability: analysis.groundwaterAssessment.availability,
      sustainability: analysis.groundwaterAssessment.sustainability,
      riskLevel: analysis.riskLevel
    },
    detailedAnalysis: {
      nearestStation: analysis.nearestStation,
      environmentalFactors: analysis.environmentalFactors,
      mlPredictions: analysis.mlPredictions
    },
    recommendations: includeRecommendations ? analysis.recommendations : [],
    usageSuitability: analysis.usageSuitability,
    metadata: {
      analysisDate: analysis.metadata.analysisDate,
      dataSources: analysis.metadata.dataSources,
      confidence: analysis.groundwaterAssessment.availability.confidence
    }
  };
}

/**
 * Generate area-based report data
 */
async function generateAreaReport({ center, radius, analyses, stations }) {
  // Calculate area statistics
  const stats = {
    totalAnalyses: analyses.length,
    totalStations: stations.length,
    averageAvailability: 0,
    statusDistribution: { critical: 0, low: 0, moderate: 0, good: 0, excellent: 0 },
    averageSustainability: 0
  };

  if (analyses.length > 0) {
    let totalAvailability = 0;
    let totalSustainability = 0;

    analyses.forEach(analysis => {
      totalAvailability += analysis.groundwaterAssessment.availability.score;
      totalSustainability += analysis.groundwaterAssessment.sustainability.yearsRemaining;
      stats.statusDistribution[analysis.groundwaterAssessment.availability.status]++;
    });

    stats.averageAvailability = Math.round(totalAvailability / analyses.length);
    stats.averageSustainability = Math.round(totalSustainability / analyses.length);
  }

  return {
    type: 'area',
    title: 'Area Groundwater Assessment Report',
    area: { center, radius },
    summary: stats,
    analyses: analyses.map(a => ({
      location: a.location,
      availability: a.groundwaterAssessment.availability,
      sustainability: a.groundwaterAssessment.sustainability,
      analysisDate: a.metadata.analysisDate
    })),
    stations: stations.map(s => ({
      id: s._id,
      name: s.name,
      location: s.location,
      status: s.status,
      lastReading: s.lastReading
    })),
    recommendations: generateAreaRecommendations(stats),
    metadata: {
      generatedAt: new Date(),
      dataPoints: analyses.length + stations.length
    }
  };
}

/**
 * Generate station-specific report data
 */
async function generateStationReport({ station, readings, trend, period }) {
  const stats = readings.length > 0 ? {
    count: readings.length,
    mean: readings.reduce((sum, r) => sum + r.waterLevel, 0) / readings.length,
    min: Math.min(...readings.map(r => r.waterLevel)),
    max: Math.max(...readings.map(r => r.waterLevel)),
    range: Math.max(...readings.map(r => r.waterLevel)) - Math.min(...readings.map(r => r.waterLevel))
  } : null;

  return {
    type: 'station',
    title: `Station Report - ${station.name}`,
    station: {
      id: station._id,
      name: station.name,
      stationId: station.stationId,
      location: station.location,
      address: station.address,
      technicalDetails: station.technicalDetails
    },
    period,
    statistics: stats,
    trend,
    readings: readings.map(r => ({
      timestamp: r.timestamp,
      waterLevel: r.waterLevel,
      status: r.waterLevelStatus,
      rainfall: r.rainfall
    })),
    recommendations: generateStationRecommendations(station, trend, stats),
    metadata: {
      generatedAt: new Date(),
      dataQuality: readings.length > 10 ? 'good' : 'limited'
    }
  };
}

/**
 * Generate summary report data
 */
async function generateSummaryReport(days) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

  // Get overall statistics
  const [
    totalStations,
    activeStations,
    totalReadings,
    totalAnalyses,
    criticalCount,
    avgWaterLevel
  ] = await Promise.all([
    Station.countDocuments({ isActive: true }),
    Station.countDocuments({ isActive: true, status: 'active' }),
    Reading.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate },
      isActive: true
    }),
    Analysis.countDocuments({
      'metadata.analysisDate': { $gte: startDate, $lte: endDate },
      isActive: true
    }),
    Reading.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate },
      waterLevelStatus: 'critical',
      isActive: true
    }),
    Reading.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          avgLevel: { $avg: '$waterLevel' }
        }
      }
    ])
  ]);

  const avgLevel = avgWaterLevel.length > 0 ? avgWaterLevel[0].avgLevel : 0;

  return {
    type: 'summary',
    title: 'Groundwater Monitoring System Summary Report',
    period: { start: startDate, end: endDate, days },
    overview: {
      totalStations,
      activeStations,
      totalReadings,
      totalAnalyses,
      criticalAlerts: criticalCount,
      averageWaterLevel: Math.round(avgLevel * 100) / 100
    },
    systemHealth: {
      stationUptime: Math.round((activeStations / totalStations) * 100),
      dataQuality: totalReadings > 1000 ? 'excellent' : totalReadings > 500 ? 'good' : 'limited',
      alertLevel: criticalCount > 50 ? 'high' : criticalCount > 20 ? 'medium' : 'low'
    },
    recommendations: generateSystemRecommendations({
      totalStations,
      activeStations,
      criticalCount,
      avgLevel
    }),
    metadata: {
      generatedAt: new Date(),
      reportPeriod: days
    }
  };
}

/**
 * Generate recommendations based on data
 */
function generateAreaRecommendations(stats) {
  const recommendations = [];

  if (stats.statusDistribution.critical > stats.totalAnalyses * 0.3) {
    recommendations.push({
      type: 'conservation',
      priority: 'critical',
      title: 'Area-wide Water Conservation Required',
      description: 'High percentage of critical water levels detected in the area'
    });
  }

  if (stats.averageAvailability < 50) {
    recommendations.push({
      type: 'recharge',
      priority: 'high',
      title: 'Implement Recharge Programs',
      description: 'Average water availability is below optimal levels'
    });
  }

  return recommendations;
}

function generateStationRecommendations(station, trend, stats) {
  const recommendations = [];

  if (trend && trend.direction === 'falling' && trend.significance === 'significant') {
    recommendations.push({
      type: 'monitoring',
      priority: 'high',
      title: 'Enhanced Monitoring Required',
      description: 'Significant declining trend detected'
    });
  }

  if (stats && stats.mean > 20) {
    recommendations.push({
      type: 'conservation',
      priority: 'medium',
      title: 'Water Conservation Measures',
      description: 'Deep water levels indicate need for conservation'
    });
  }

  return recommendations;
}

function generateSystemRecommendations({ totalStations, activeStations, criticalCount, avgLevel }) {
  const recommendations = [];

  if (activeStations / totalStations < 0.8) {
    recommendations.push({
      type: 'maintenance',
      priority: 'high',
      title: 'Station Maintenance Required',
      description: 'Low station uptime detected'
    });
  }

  if (criticalCount > 50) {
    recommendations.push({
      type: 'alert',
      priority: 'critical',
      title: 'System-wide Alert',
      description: 'High number of critical water level alerts'
    });
  }

  return recommendations;
}

module.exports = router;
