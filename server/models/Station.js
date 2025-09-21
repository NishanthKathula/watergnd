const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    block: { type: String },
    village: { type: String },
    pincode: { type: String }
  },
  technicalDetails: {
    wellDepth: { type: Number }, // meters
    casingDepth: { type: Number }, // meters
    diameter: { type: Number }, // mm
    aquiferType: { 
      type: String,
      enum: ['unconfined', 'confined', 'semi-confined', 'leaky']
    },
    soilType: { type: String },
    permeability: { type: String },
    waterQuality: {
      ph: { type: Number },
      tds: { type: Number }, // Total Dissolved Solids
      hardness: { type: String },
      lastTested: { type: Date }
    }
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'error'],
    default: 'active'
  },
  lastReading: {
    waterLevel: { type: Number }, // meters below ground level
    timestamp: { type: Date },
    batteryLevel: { type: Number }, // percentage
    signalStrength: { type: Number } // dBm
  },
  metadata: {
    installationDate: { type: Date },
    lastMaintenance: { type: Date },
    nextMaintenance: { type: Date },
    dataFrequency: { type: String, default: 'hourly' }, // hourly, daily, weekly
    operator: { type: String },
    contactInfo: {
      phone: { type: String },
      email: { type: String }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
stationSchema.index({ location: '2dsphere' });
stationSchema.index({ stationId: 1 });
stationSchema.index({ 'address.state': 1, 'address.district': 1 });

// Virtual for current water level status
stationSchema.virtual('waterLevelStatus').get(function() {
  if (!this.lastReading || !this.lastReading.waterLevel) return 'unknown';
  
  const level = this.lastReading.waterLevel;
  if (level < 5) return 'critical';
  if (level < 10) return 'low';
  if (level < 20) return 'moderate';
  return 'good';
});

// Method to get nearby stations
stationSchema.methods.getNearbyStations = async function(radiusKm = 10) {
  const Station = this.constructor;
  return await Station.find({
    location: {
      $near: {
        $geometry: this.location,
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    },
    _id: { $ne: this._id },
    isActive: true
  }).limit(10);
};

// Method to calculate distance to another point
stationSchema.methods.distanceTo = function(lat, lng) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat - this.location.coordinates[1]) * Math.PI / 180;
  const dLng = (lng - this.location.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('Station', stationSchema);
