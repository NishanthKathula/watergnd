const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  waterLevel: {
    type: Number,
    required: true, // meters below ground level
    min: [0, 'Water level cannot be negative']
  },
  waterLevelStatus: {
    type: String,
    enum: ['critical', 'low', 'moderate', 'good'],
    required: true
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  signalStrength: {
    type: Number // dBm
  },
  temperature: {
    type: Number // Celsius
  },
  humidity: {
    type: Number // percentage
  },
  rainfall: {
    type: Number, // mm
    default: 0
  },
  quality: {
    ph: { type: Number },
    tds: { type: Number },
    turbidity: { type: Number },
    conductivity: { type: Number }
  },
  metadata: {
    dataSource: {
      type: String,
      enum: ['dwlr', 'manual', 'interpolated', 'predicted'],
      default: 'dwlr'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    notes: { type: String }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
readingSchema.index({ stationId: 1, timestamp: -1 });
readingSchema.index({ timestamp: -1 });
readingSchema.index({ waterLevelStatus: 1, timestamp: -1 });

// TTL index to automatically delete old readings (optional - keep for 2 years)
readingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Virtual for time-based categorization
readingSchema.virtual('timeCategory').get(function() {
  const hour = this.timestamp.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
});

// Static method to get latest readings for all stations
readingSchema.statics.getLatestReadings = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    { $sort: { stationId: 1, timestamp: -1 } },
    {
      $group: {
        _id: '$stationId',
        latestReading: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$latestReading' } }
  ]);
};

// Static method to get readings within date range
readingSchema.statics.getReadingsInRange = async function(stationId, startDate, endDate) {
  return await this.find({
    stationId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    },
    isActive: true
  }).sort({ timestamp: 1 });
};

// Static method to calculate trends
readingSchema.statics.calculateTrend = async function(stationId, days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
  
  const readings = await this.getReadingsInRange(stationId, startDate, endDate);
  
  if (readings.length < 2) return null;
  
  const firstReading = readings[0];
  const lastReading = readings[readings.length - 1];
  
  const trend = lastReading.waterLevel - firstReading.waterLevel;
  const trendPercentage = (trend / firstReading.waterLevel) * 100;
  
  return {
    trend,
    trendPercentage,
    period: days,
    readingsCount: readings.length,
    firstReading: firstReading.waterLevel,
    lastReading: lastReading.waterLevel,
    direction: trend > 0 ? 'rising' : trend < 0 ? 'falling' : 'stable'
  };
};

module.exports = mongoose.model('Reading', readingSchema);
