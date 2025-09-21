const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Station = require('../models/Station');
const Reading = require('../models/Reading');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { sendNotification } = require('../services/notificationService');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get notifications based on user preferences
    const notifications = await getUserNotifications(user);

    res.json({
      success: true,
      data: {
        notifications,
        preferences: user.preferences.notifications,
        count: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
router.put('/preferences', protect, [
  body('email').optional().isBoolean().withMessage('Email preference must be boolean'),
  body('sms').optional().isBoolean().withMessage('SMS preference must be boolean'),
  body('push').optional().isBoolean().withMessage('Push preference must be boolean'),
  body('alertRadius').optional().isInt({ min: 1, max: 100 }).withMessage('Alert radius must be 1-100 km')
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

    const { email, sms, push, alertRadius } = req.body;
    const updateData = {};

    if (email !== undefined) updateData['preferences.notifications.email'] = email;
    if (sms !== undefined) updateData['preferences.notifications.sms'] = sms;
    if (push !== undefined) updateData['preferences.notifications.push'] = push;
    if (alertRadius !== undefined) updateData['preferences.alertRadius'] = alertRadius;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.preferences.notifications,
        alertRadius: user.preferences.alertRadius
      }
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating preferences'
    });
  }
});

// @desc    Subscribe to station alerts
// @route   POST /api/notifications/subscribe
// @access  Private
router.post('/subscribe', protect, [
  body('stationId').isMongoId().withMessage('Valid station ID required'),
  body('alertTypes').isArray().withMessage('Alert types must be an array'),
  body('alertTypes.*').isIn(['critical', 'low', 'maintenance', 'offline']).withMessage('Invalid alert type')
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

    const { stationId, alertTypes } = req.body;

    // Verify station exists
    const station = await Station.findById(stationId);
    if (!station || !station.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Add station to user's monitoring list
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { 'preferences.monitoringStations': stationId } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Successfully subscribed to station alerts',
      data: {
        station: {
          id: station._id,
          name: station.name,
          alertTypes
        },
        monitoringStations: user.preferences.monitoringStations
      }
    });
  } catch (error) {
    console.error('Subscribe to station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while subscribing to station'
    });
  }
});

// @desc    Unsubscribe from station alerts
// @route   DELETE /api/notifications/subscribe/:stationId
// @access  Private
router.delete('/subscribe/:stationId', protect, async (req, res) => {
  try {
    const { stationId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { 'preferences.monitoringStations': stationId } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Successfully unsubscribed from station alerts',
      data: {
        monitoringStations: user.preferences.monitoringStations
      }
    });
  } catch (error) {
    console.error('Unsubscribe from station error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unsubscribing from station'
    });
  }
});

// @desc    Send test notification
// @route   POST /api/notifications/test
// @access  Private
router.post('/test', protect, [
  body('type').isIn(['email', 'sms', 'push']).withMessage('Invalid notification type'),
  body('message').notEmpty().withMessage('Message is required')
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

    const { type, message } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send test notification
    const result = await sendNotification({
      user,
      type,
      title: 'Test Notification',
      message,
      data: { test: true }
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: { result }
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test notification'
    });
  }
});

// @desc    Get notification history
// @route   GET /api/notifications/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // In a real implementation, you would have a Notification model
    // For now, return mock data
    const mockHistory = [
      {
        id: '1',
        type: 'critical',
        title: 'Critical Water Level Alert',
        message: 'Water level at Delhi Ridge Station has reached critical levels',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        stationId: 'station123'
      },
      {
        id: '2',
        type: 'maintenance',
        title: 'Station Maintenance Scheduled',
        message: 'Delhi Ridge Station will undergo maintenance tomorrow',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        stationId: 'station123'
      }
    ];

    res.json({
      success: true,
      data: {
        notifications: mockHistory.slice(skip, skip + limit),
        pagination: {
          current: page,
          pages: Math.ceil(mockHistory.length / limit),
          total: mockHistory.length,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification history'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    // In a real implementation, update the notification in database
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read'
    });
  }
});

/**
 * Get notifications for a user based on their preferences and location
 */
async function getUserNotifications(user) {
  const notifications = [];

  // Check for critical water level alerts in user's area
  if (user.preferences.notifications.push || user.preferences.notifications.email) {
    const criticalStations = await getCriticalStationsInArea(user);
    
    criticalStations.forEach(station => {
      notifications.push({
        id: `critical-${station._id}`,
        type: 'critical',
        title: 'Critical Water Level Alert',
        message: `Water level at ${station.name} has reached critical levels (${station.lastReading.waterLevel}m)`,
        timestamp: station.lastReading.timestamp,
        read: false,
        stationId: station._id,
        priority: 'high'
      });
    });
  }

  // Check for maintenance alerts for monitored stations
  if (user.preferences.monitoringStations.length > 0) {
    const maintenanceStations = await getMaintenanceStations(user.preferences.monitoringStations);
    
    maintenanceStations.forEach(station => {
      notifications.push({
        id: `maintenance-${station._id}`,
        type: 'maintenance',
        title: 'Station Maintenance Alert',
        message: `${station.name} is scheduled for maintenance`,
        timestamp: new Date(),
        read: false,
        stationId: station._id,
        priority: 'medium'
      });
    });
  }

  return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Get stations with critical water levels in user's area
 */
async function getCriticalStationsInArea(user) {
  const radius = user.preferences.alertRadius * 1000; // Convert km to meters

  return await Station.find({
    location: {
      $near: {
        $geometry: user.location,
        $maxDistance: radius
      }
    },
    'lastReading.waterLevel': { $gte: 0, $lte: 5 }, // Critical level
    isActive: true
  }).limit(5);
}

/**
 * Get stations scheduled for maintenance
 */
async function getMaintenanceStations(stationIds) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return await Station.find({
    _id: { $in: stationIds },
    'metadata.nextMaintenance': {
      $gte: tomorrow,
      $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
    },
    isActive: true
  });
}

module.exports = router;
