const express = require('express');
const { body, validationResult } = require('express-validator');
const Analysis = require('../models/Analysis');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { performGroundwaterAnalysis } = require('../services/analysisService');

const router = express.Router();

// @desc    Get analysis by location
// @route   POST /api/analysis/location
// @access  Public
router.post('/location', optionalAuth, [
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

    // Check for existing analysis
    const existingAnalysis = await Analysis.getAnalysisByLocation(latitude, longitude, 1);
    
    if (existingAnalysis && 
        (new Date() - existingAnalysis.metadata.analysisDate) < 24 * 60 * 60 * 1000) {
      return res.json({
        success: true,
        data: existingAnalysis,
        cached: true
      });
    }

    // Perform new analysis
    const analysisResult = await performGroundwaterAnalysis({
      latitude,
      longitude,
      extractionRate,
      userId: req.user?.id
    });

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
    console.error('Location analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during location analysis'
    });
  }
});

// @desc    Get analysis by ID
// @route   GET /api/analysis/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis || !analysis.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: { analysis }
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analysis'
    });
  }
});

// @desc    Get similar analyses
// @route   GET /api/analysis/:id/similar
// @access  Public
router.get('/:id/similar', optionalAuth, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    
    if (!analysis || !analysis.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    const radius = parseInt(req.query.radius) || 50;
    const similarAnalyses = await analysis.getSimilarAnalyses(radius);

    res.json({
      success: true,
      data: {
        originalAnalysis: {
          id: analysis._id,
          location: analysis.location,
          availability: analysis.groundwaterAssessment.availability
        },
        similarAnalyses: similarAnalyses.map(a => ({
          id: a._id,
          location: a.location,
          availability: a.groundwaterAssessment.availability,
          distance: a.location.coordinates[0] // Simplified distance calculation
        })),
        radius,
        count: similarAnalyses.length
      }
    });
  } catch (error) {
    console.error('Get similar analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching similar analyses'
    });
  }
});

// @desc    Get analyses by area
// @route   POST /api/analysis/area
// @access  Public
router.post('/area', optionalAuth, [
  body('centerLatitude').isFloat({ min: -90, max: 90 }).withMessage('Valid center latitude required'),
  body('centerLongitude').isFloat({ min: -180, max: 180 }).withMessage('Valid center longitude required'),
  body('radius').isInt({ min: 1, max: 100 }).withMessage('Radius must be between 1-100 km')
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

    const { centerLatitude, centerLongitude, radius } = req.body;

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

    // Calculate area statistics
    const stats = {
      totalAnalyses: analyses.length,
      averageAvailability: 0,
      statusDistribution: {
        critical: 0,
        low: 0,
        moderate: 0,
        good: 0,
        excellent: 0
      },
      averageSustainability: 0
    };

    if (analyses.length > 0) {
      let totalAvailability = 0;
      let totalSustainability = 0;

      analyses.forEach(analysis => {
        const availability = analysis.groundwaterAssessment.availability.score;
        const sustainability = analysis.groundwaterAssessment.sustainability.yearsRemaining;
        
        totalAvailability += availability;
        totalSustainability += sustainability;
        
        stats.statusDistribution[analysis.groundwaterAssessment.availability.status]++;
      });

      stats.averageAvailability = Math.round(totalAvailability / analyses.length);
      stats.averageSustainability = Math.round(totalSustainability / analyses.length);
    }

    res.json({
      success: true,
      data: {
        area: {
          center: { latitude: centerLatitude, longitude: centerLongitude },
          radius
        },
        analyses: analyses.map(a => ({
          id: a._id,
          location: a.location,
          availability: a.groundwaterAssessment.availability,
          sustainability: a.groundwaterAssessment.sustainability,
          analysisDate: a.metadata.analysisDate
        })),
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Area analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during area analysis'
    });
  }
});

// @desc    Get analysis trends over time
// @route   GET /api/analysis/trends
// @access  Public
router.get('/trends', optionalAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const analyses = await Analysis.find({
      'metadata.analysisDate': {
        $gte: startDate,
        $lte: endDate
      },
      isActive: true
    }).sort({ 'metadata.analysisDate': 1 });

    // Group by date and calculate averages
    const dailyStats = {};
    analyses.forEach(analysis => {
      const date = analysis.metadata.analysisDate.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          count: 0,
          totalAvailability: 0,
          totalSustainability: 0,
          statusCounts: { critical: 0, low: 0, moderate: 0, good: 0, excellent: 0 }
        };
      }

      const stats = dailyStats[date];
      stats.count++;
      stats.totalAvailability += analysis.groundwaterAssessment.availability.score;
      stats.totalSustainability += analysis.groundwaterAssessment.sustainability.yearsRemaining;
      stats.statusCounts[analysis.groundwaterAssessment.availability.status]++;
    });

    // Calculate averages
    const trendData = Object.values(dailyStats).map(day => ({
      date: day.date,
      count: day.count,
      averageAvailability: Math.round(day.totalAvailability / day.count),
      averageSustainability: Math.round(day.totalSustainability / day.count),
      statusDistribution: day.statusCounts
    }));

    res.json({
      success: true,
      data: {
        period: { start: startDate, end: endDate, days },
        trends: trendData,
        totalAnalyses: analyses.length
      }
    });
  } catch (error) {
    console.error('Analysis trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analysis trends'
    });
  }
});

// @desc    Get analysis statistics
// @route   GET /api/analysis/stats/overview
// @access  Public
router.get('/stats/overview', optionalAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const [
      totalAnalyses,
      criticalAnalyses,
      lowAnalyses,
      moderateAnalyses,
      goodAnalyses,
      excellentAnalyses,
      avgAvailability,
      avgSustainability
    ] = await Promise.all([
      Analysis.countDocuments({
        'metadata.analysisDate': { $gte: startDate, $lte: endDate },
        isActive: true
      }),
      Analysis.countDocuments({
        'metadata.analysisDate': { $gte: startDate, $lte: endDate },
        'groundwaterAssessment.availability.status': 'critical',
        isActive: true
      }),
      Analysis.countDocuments({
        'metadata.analysisDate': { $gte: startDate, $lte: endDate },
        'groundwaterAssessment.availability.status': 'low',
        isActive: true
      }),
      Analysis.countDocuments({
        'metadata.analysisDate': { $gte: startDate, $lte: endDate },
        'groundwaterAssessment.availability.status': 'moderate',
        isActive: true
      }),
      Analysis.countDocuments({
        'metadata.analysisDate': { $gte: startDate, $lte: endDate },
        'groundwaterAssessment.availability.status': 'good',
        isActive: true
      }),
      Analysis.countDocuments({
        'metadata.analysisDate': { $gte: startDate, $lte: endDate },
        'groundwaterAssessment.availability.status': 'excellent',
        isActive: true
      }),
      Analysis.aggregate([
        {
          $match: {
            'metadata.analysisDate': { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            avgAvailability: { $avg: '$groundwaterAssessment.availability.score' }
          }
        }
      ]),
      Analysis.aggregate([
        {
          $match: {
            'metadata.analysisDate': { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            avgSustainability: { $avg: '$groundwaterAssessment.sustainability.yearsRemaining' }
          }
        }
      ])
    ]);

    const avgAvail = avgAvailability.length > 0 ? avgAvailability[0].avgAvailability : 0;
    const avgSust = avgSustainability.length > 0 ? avgSustainability[0].avgSustainability : 0;

    res.json({
      success: true,
      data: {
        period: { start: startDate, end: endDate, days },
        totalAnalyses,
        statusDistribution: {
          critical: criticalAnalyses,
          low: lowAnalyses,
          moderate: moderateAnalyses,
          good: goodAnalyses,
          excellent: excellentAnalyses
        },
        averageAvailability: Math.round(avgAvail * 100) / 100,
        averageSustainability: Math.round(avgSust * 100) / 100,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Analysis stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analysis statistics'
    });
  }
});

module.exports = router;
