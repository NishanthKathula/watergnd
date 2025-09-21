const nodemailer = require('nodemailer');

/**
 * Send notification to user
 */
async function sendNotification({ user, type, title, message, data = {} }) {
  try {
    const results = [];

    // Email notification
    if (type === 'email' && user.preferences.notifications.email) {
      const emailResult = await sendEmailNotification({
        user,
        title,
        message,
        data
      });
      results.push({ type: 'email', success: emailResult });
    }

    // SMS notification (mock implementation)
    if (type === 'sms' && user.preferences.notifications.sms) {
      const smsResult = await sendSMSNotification({
        user,
        message,
        data
      });
      results.push({ type: 'sms', success: smsResult });
    }

    // Push notification (mock implementation)
    if (type === 'push' && user.preferences.notifications.push) {
      const pushResult = await sendPushNotification({
        user,
        title,
        message,
        data
      });
      results.push({ type: 'push', success: pushResult });
    }

    return {
      success: results.some(r => r.success),
      results
    };
  } catch (error) {
    console.error('Send notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification({ user, title, message, data }) {
  try {
    // Configure email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Groundwater Detection System</h1>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #333; margin-top: 0;">${title}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          ${data.stationId ? `
            <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Station Details</h3>
              <p><strong>Station ID:</strong> ${data.stationId}</p>
              ${data.waterLevel ? `<p><strong>Water Level:</strong> ${data.waterLevel}m</p>` : ''}
              ${data.status ? `<p><strong>Status:</strong> ${data.status}</p>` : ''}
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        <div style="background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>This is an automated message from the Groundwater Detection System.</p>
          <p>To unsubscribe, please update your notification preferences in your account settings.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `[Groundwater Alert] ${title}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    
    return true;
  } catch (error) {
    console.error('Email notification error:', error);
    return false;
  }
}

/**
 * Send SMS notification (mock implementation)
 */
async function sendSMSNotification({ user, message, data }) {
  try {
    // In production, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS to ${user.name}: ${message}`);
    
    // Mock SMS sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error('SMS notification error:', error);
    return false;
  }
}

/**
 * Send push notification (mock implementation)
 */
async function sendPushNotification({ user, title, message, data }) {
  try {
    // In production, integrate with push notification service like Firebase, OneSignal, etc.
    console.log(`Push notification to ${user.name}: ${title} - ${message}`);
    
    // Mock push notification sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

/**
 * Send critical alert to all users in area
 */
async function sendCriticalAlert({ latitude, longitude, radius, station, waterLevel }) {
  try {
    const User = require('../models/User');
    
    // Find users in the affected area
    const users = await User.find({
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
      'preferences.notifications.email': true
    });

    const results = [];
    
    for (const user of users) {
      const result = await sendNotification({
        user,
        type: 'email',
        title: 'Critical Water Level Alert',
        message: `Critical water level detected at ${station.name}. Current level: ${waterLevel}m below ground level.`,
        data: {
          stationId: station._id,
          waterLevel,
          status: 'critical',
          alertType: 'critical'
        }
      });
      
      results.push({ userId: user._id, result });
    }

    return {
      success: true,
      usersNotified: users.length,
      results
    };
  } catch (error) {
    console.error('Critical alert error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send maintenance notification
 */
async function sendMaintenanceNotification({ station, maintenanceDate, users }) {
  try {
    const results = [];
    
    for (const user of users) {
      const result = await sendNotification({
        user,
        type: 'email',
        title: 'Station Maintenance Scheduled',
        message: `${station.name} is scheduled for maintenance on ${maintenanceDate.toDateString()}.`,
        data: {
          stationId: station._id,
          maintenanceDate,
          alertType: 'maintenance'
        }
      });
      
      results.push({ userId: user._id, result });
    }

    return {
      success: true,
      usersNotified: users.length,
      results
    };
  } catch (error) {
    console.error('Maintenance notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send trend alert
 */
async function sendTrendAlert({ user, station, trend, period }) {
  try {
    const direction = trend.direction === 'falling' ? 'declining' : 'rising';
    const significance = trend.significance === 'significant' ? 'significantly' : 'slightly';
    
    const result = await sendNotification({
      user,
      type: 'email',
      title: 'Water Level Trend Alert',
      message: `Water level at ${station.name} is ${significance} ${direction} over the past ${period} days.`,
      data: {
        stationId: station._id,
        trend,
        period,
        alertType: 'trend'
      }
    });

    return result;
  } catch (error) {
    console.error('Trend alert error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotification,
  sendEmailNotification,
  sendSMSNotification,
  sendPushNotification,
  sendCriticalAlert,
  sendMaintenanceNotification,
  sendTrendAlert
};
