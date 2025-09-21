const express = require('express');
const { body, validationResult } = require('express-validator');
const Reading = require('../models/Reading');
const Station = require('../models/Station');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { io } = require('../index');

const router = express.Router();

// @desc    Get readings with filters and pagination
// @route   GET /api/readings
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };
    
    if (req.query.stationId) {
      filter.stationId = req.query.stationId;
    }
    
    if (req.query.status) {
      filter.waterLevelStatus = req.query.status;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Execute query
    const readings = await Reading.find(filter)
      .populate('stationId', 'name stationId location address')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reading.countDocuments(filter);

    res.json({
      success: true,
      data: {
        readings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching readings'
    });
  }
});

// @desc    Get latest readings for all stations
// @route   GET /api/readings/latest
// @access  Public
router.get('/latest', optionalAuth, async (req, res) => {
  try {
    const latestReadings = await Reading.getLatestReadings();
    
    // Populate station data
    const readingsWithStations = await Promise.all(
      latestReadings.map(async (reading) => {
        const station = await Station.findById(reading.stationId);
        return {
          ...reading.toObject(),
          station: station ? {
            id: station._id,
            name: station.name,
            stationId: station.stationId,
            location: station.location,
            address: station.address
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        readings: readingsWithStations,
        count: readingsWithStations.length,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get latest readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching latest readings'
    });
  }
});

// @desc    Get single reading by ID
// @route   GET /api/readings/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const reading = await Reading.findById(req.params.id)
      .populate('stationId', 'name stationId location address');
    
    if (!reading || !reading.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    res.json({
      success: true,
      data: { reading }
    });
  } catch (error) {
    console.error('Get reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reading'
    });
  }
});

// @desc    Create new reading (Admin/System only)
// @route   POST /api/readings
// @access  Private (Admin/System)
router.post('/', protect, authorize('admin'), [
  body('stationId').isMongoId().withMessage('Valid station ID required'),
  body('waterLevel').isFloat({ min: 0 }).withMessage('Water level must be positive'),
  body('waterLevelStatus').isIn(['critical', 'low', 'moderate', 'good']).withMessage('Invalid status'),
  body('timestamp').optional().isISO8601().withMessage('Valid timestamp required')
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

    // Verify station exists
    const station = await Station.findById(req.body.stationId);
    if (!station || !station.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    const readingData = {
      ...req.body,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
    };

    const reading = await Reading.create(readingData);

    // Update station's last reading
    await Station.findByIdAndUpdate(station._id, {
      lastReading: {
        waterLevel: reading.waterLevel,
        timestamp: reading.timestamp,
        batteryLevel: reading.batteryLevel,
        signalStrength: reading.signalStrength
      }
    });

    // Emit real-time update via Socket.IO
    io.to(`station-${station._id}`).emit('new-reading', {
      stationId: station._id,
      reading: {
        waterLevel: reading.waterLevel,
        status: reading.waterLevelStatus,
        timestamp: reading.timestamp
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reading created successfully',
      data: { reading }
    });
  } catch (error) {
    console.error('Create reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating reading'
    });
  }
});

// @desc    Bulk create readings (System only)
// @route   POST /api/readings/bulk
// @access  Private (Admin/System)
router.post('/bulk', protect, authorize('admin'), [
  body('readings').isArray({ min: 1 }).withMessage('Readings array is required'),
  body('readings.*.stationId').isMongoId().withMessage('Valid station ID required'),
  body('readings.*.waterLevel').isFloat({ min: 0 }).withMessage('Water level must be positive'),
  body('readings.*.waterLevelStatus').isIn(['critical', 'low', 'moderate', 'good']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array()
      });
    }

    const { readings } = req.body;
    const createdReadings = [];
    const processingErrors = [];

    // Process readings in batches
    for (const readingData of readings) {
      try {
        // Verify station exists
        const station = await Station.findById(readingData.stationId);
        if (!station || !station.isActive) {
          processingErrors.push({
            stationId: readingData.stationId,
            error: 'Station not found'
          });
          continue;
        }

        const reading = await Reading.create({
          ...readingData,
          timestamp: readingData.timestamp ? new Date(readingData.timestamp) : new Date()
        });

        createdReadings.push(reading);

        // Update station's last reading
        await Station.findByIdAndUpdate(station._id, {
          lastReading: {
            waterLevel: reading.waterLevel,
            timestamp: reading.timestamp,
            batteryLevel: reading.batteryLevel,
            signalStrength: reading.signalStrength
          }
        });

        // Emit real-time update
        io.to(`station-${station._id}`).emit('new-reading', {
          stationId: station._id,
          reading: {
            waterLevel: reading.waterLevel,
            status: reading.waterLevelStatus,
            timestamp: reading.timestamp
          }
        });

      } catch (error) {
        processingErrors.push({
          stationId: readingData.stationId,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk operation completed. ${createdReadings.length} readings created.`,
      data: {
        created: createdReadings.length,
        errors: processingErrors.length,
        details: processingErrors
      }
    });
  } catch (error) {
    console.error('Bulk create readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bulk readings'
    });
  }
});

// @desc    Update reading (Admin only)
// @route   PUT /api/readings/:id
// @access  Private (Admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const reading = await Reading.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    res.json({
      success: true,
      message: 'Reading updated successfully',
      data: { reading }
    });
  } catch (error) {
    console.error('Update reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating reading'
    });
  }
});

// @desc    Delete reading (Admin only)
// @route   DELETE /api/readings/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const reading = await Reading.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found'
      });
    }

    res.json({
      success: true,
      message: 'Reading deleted successfully'
    });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reading'
    });
  }
});

// @desc    Get readings statistics
// @route   GET /api/readings/stats/overview
// @access  Public
router.get('/stats/overview', optionalAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get statistics
    const [
      totalReadings,
      criticalReadings,
      lowReadings,
      moderateReadings,
      goodReadings,
      avgWaterLevel
    ] = await Promise.all([
      Reading.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        isActive: true
      }),
      Reading.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        waterLevelStatus: 'critical',
        isActive: true
      }),
      Reading.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        waterLevelStatus: 'low',
        isActive: true
      }),
      Reading.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        waterLevelStatus: 'moderate',
        isActive: true
      }),
      Reading.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
        waterLevelStatus: 'good',
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

    res.json({
      success: true,
      data: {
        period: { start: startDate, end: endDate, days },
        totalReadings,
        statusDistribution: {
          critical: criticalReadings,
          low: lowReadings,
          moderate: moderateReadings,
          good: goodReadings
        },
        averageWaterLevel: Math.round(avgLevel * 100) / 100,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Get readings stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reading statistics'
    });
  }
});

module.exports = router;
