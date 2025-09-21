const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
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
  nearestStation: {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: true
    },
    distance: { type: Number, required: true }, // km
    waterLevel: { type: Number, required: true }, // meters
    lastUpdated: { type: Date, required: true }
  },
  groundwaterAssessment: {
    availability: {
      score: { type: Number, min: 0, max: 100, required: true },
      status: { 
        type: String, 
        enum: ['critical', 'low', 'moderate', 'good', 'excellent'],
        required: true 
      },
      confidence: { type: Number, min: 0, max: 100, default: 85 }
    },
    depth: {
      estimated: { type: Number, required: true }, // meters
      range: {
        min: { type: Number },
        max: { type: Number }
      }
    },
    sustainability: {
      yearsRemaining: { type: Number, required: true },
      extractionRate: { type: Number, default: 2000 }, // L/day
      rechargeRate: { type: Number }, // L/day
      balance: { type: String, enum: ['deficit', 'balanced', 'surplus'] }
    }
  },
  environmentalFactors: {
    rainfall: {
      annual: { type: Number }, // mm
      seasonal: {
        monsoon: { type: Number },
        postMonsoon: { type: Number },
        winter: { type: Number },
        summer: { type: Number }
      },
      trend: { type: String, enum: ['increasing', 'decreasing', 'stable'] }
    },
    proximity: {
      rivers: [{
        name: { type: String },
        distance: { type: Number }, // km
        influence: { type: String, enum: ['high', 'medium', 'low'] }
      }],
      waterBodies: [{
        name: { type: String },
        distance: { type: Number }, // km
        type: { type: String, enum: ['lake', 'pond', 'reservoir', 'canal'] }
      }]
    },
    geology: {
      soilType: { type: String },
      aquiferType: { type: String },
      permeability: { type: String, enum: ['high', 'medium', 'low'] },
      depth: { type: Number } // meters
    }
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['conservation', 'recharge', 'monitoring', 'restriction', 'infrastructure'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    impact: { type: String },
    cost: { type: String },
    timeline: { type: String }
  }],
  usageSuitability: {
    agriculture: {
      score: { type: Number, min: 0, max: 100 },
      status: { type: String, enum: ['suitable', 'moderate', 'unsuitable'] },
      recommendations: [String]
    },
    domestic: {
      score: { type: Number, min: 0, max: 100 },
      status: { type: String, enum: ['suitable', 'moderate', 'unsuitable'] },
      recommendations: [String]
    },
    industrial: {
      score: { type: Number, min: 0, max: 100 },
      status: { type: String, enum: ['suitable', 'moderate', 'unsuitable'] },
      recommendations: [String]
    }
  },
  mlPredictions: {
    model: { type: String, default: 'ensemble' },
    features: [String],
    featureImportance: mongoose.Schema.Types.Mixed,
    predictionConfidence: { type: Number, min: 0, max: 100 },
    nextUpdate: { type: Date }
  },
  metadata: {
    analysisDate: { type: Date, default: Date.now },
    dataSources: [String],
    processingTime: { type: Number }, // milliseconds
    version: { type: String, default: '1.0' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index
analysisSchema.index({ location: '2dsphere' });
analysisSchema.index({ 'groundwaterAssessment.availability.status': 1 });
analysisSchema.index({ 'metadata.analysisDate': -1 });

// Virtual for overall risk assessment
analysisSchema.virtual('riskLevel').get(function() {
  const availability = this.groundwaterAssessment.availability.score;
  const sustainability = this.groundwaterAssessment.sustainability.yearsRemaining;
  
  if (availability < 30 || sustainability < 1) return 'critical';
  if (availability < 50 || sustainability < 3) return 'high';
  if (availability < 70 || sustainability < 5) return 'medium';
  return 'low';
});

// Method to get similar analyses
analysisSchema.methods.getSimilarAnalyses = async function(radiusKm = 50) {
  const Analysis = this.constructor;
  return await Analysis.find({
    location: {
      $near: {
        $geometry: this.location,
        $maxDistance: radiusKm * 1000
      }
    },
    _id: { $ne: this._id },
    isActive: true
  }).limit(10);
};

// Static method to get analysis by location
analysisSchema.statics.getAnalysisByLocation = async function(lat, lng, radiusKm = 5) {
  return await this.findOne({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusKm * 1000
      }
    },
    isActive: true
  }).sort({ 'metadata.analysisDate': -1 });
};

module.exports = mongoose.model('Analysis', analysisSchema);
