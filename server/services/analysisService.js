const Station = require('../models/Station');
const Reading = require('../models/Reading');
const { getExternalData } = require('./externalDataService');
const { calculateMannKendallTrend } = require('./statisticalAnalysis');
const { predictGroundwaterLevel } = require('./mlPredictionService');

/**
 * Perform comprehensive groundwater analysis for a given location
 */
async function performGroundwaterAnalysis({ latitude, longitude, extractionRate, userId }) {
  try {
    console.log(`Starting groundwater analysis for location: ${latitude}, ${longitude}`);

    // 1. Find nearest station and get its data
    const nearestStationData = await findNearestStationData(latitude, longitude);
    
    // 2. Get environmental factors
    const environmentalData = await getExternalData(latitude, longitude, 365);
    
    // 3. Calculate trends using Mann-Kendall test
    const trendAnalysis = await calculateTrendAnalysis(nearestStationData.station._id);
    
    // 4. Perform ML prediction
    const mlPrediction = await predictGroundwaterLevel({
      latitude,
      longitude,
      stationData: nearestStationData,
      environmentalData,
      trendAnalysis
    });

    // 5. Calculate sustainability metrics
    const sustainability = calculateSustainability({
      currentLevel: nearestStationData.latestReading?.waterLevel,
      trend: trendAnalysis,
      extractionRate,
      rechargeRate: environmentalData.annualRainfall * 0.3 // Rough estimate
    });

    // 6. Generate recommendations
    const recommendations = generateRecommendations({
      availability: mlPrediction.availability,
      sustainability,
      environmentalData,
      trendAnalysis
    });

    // 7. Calculate usage suitability
    const usageSuitability = calculateUsageSuitability({
      waterLevel: nearestStationData.latestReading?.waterLevel,
      quality: nearestStationData.station.technicalDetails?.waterQuality,
      sustainability
    });

    return {
      nearestStation: {
        stationId: nearestStationData.station._id,
        distance: nearestStationData.distance,
        waterLevel: nearestStationData.latestReading?.waterLevel,
        lastUpdated: nearestStationData.latestReading?.timestamp
      },
      groundwaterAssessment: {
        availability: {
          score: mlPrediction.availability.score,
          status: mlPrediction.availability.status,
          confidence: mlPrediction.confidence
        },
        depth: {
          estimated: nearestStationData.latestReading?.waterLevel || 15,
          range: {
            min: Math.max(0, (nearestStationData.latestReading?.waterLevel || 15) - 5),
            max: (nearestStationData.latestReading?.waterLevel || 15) + 5
          }
        },
        sustainability
      },
      environmentalFactors: {
        rainfall: environmentalData.rainfall,
        proximity: environmentalData.proximity,
        geology: environmentalData.geology
      },
      recommendations,
      usageSuitability,
      mlPredictions: {
        model: 'ensemble',
        features: mlPrediction.features,
        featureImportance: mlPrediction.featureImportance,
        predictionConfidence: mlPrediction.confidence,
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      metadata: {
        analysisDate: new Date(),
        dataSources: ['DWLR', 'IMD', 'CGWB', 'OpenStreetMap'],
        processingTime: Date.now(),
        version: '1.0'
      }
    };
  } catch (error) {
    console.error('Error in groundwater analysis:', error);
    throw new Error('Failed to perform groundwater analysis');
  }
}

/**
 * Find nearest station and get its latest data
 */
async function findNearestStationData(latitude, longitude) {
  const station = await Station.findOne({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: 50 * 1000 // 50km radius
      }
    },
    isActive: true,
    status: 'active'
  });

  if (!station) {
    throw new Error('No monitoring station found within 50km radius');
  }

  const latestReading = await Reading.findOne({
    stationId: station._id,
    isActive: true
  }).sort({ timestamp: -1 });

  const distance = station.distanceTo(latitude, longitude);

  return {
    station,
    latestReading,
    distance: Math.round(distance * 100) / 100
  };
}

/**
 * Calculate trend analysis using Mann-Kendall test
 */
async function calculateTrendAnalysis(stationId) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year

  const readings = await Reading.getReadingsInRange(stationId, startDate, endDate);
  
  if (readings.length < 10) {
    return {
      trend: 0,
      significance: 'insufficient_data',
      direction: 'stable',
      pValue: 1.0
    };
  }

  const waterLevels = readings.map(r => r.waterLevel);
  const timestamps = readings.map(r => r.timestamp.getTime());

  const mkResult = calculateMannKendallTrend(waterLevels, timestamps);

  return {
    trend: mkResult.trend,
    significance: mkResult.significance,
    direction: mkResult.direction,
    pValue: mkResult.pValue,
    dataPoints: readings.length,
    period: '1_year'
  };
}

/**
 * Calculate sustainability metrics
 */
function calculateSustainability({ currentLevel, trend, extractionRate, rechargeRate }) {
  if (!currentLevel) {
    return {
      yearsRemaining: 0,
      extractionRate,
      rechargeRate,
      balance: 'unknown'
    };
  }

  // Simple sustainability calculation
  const netExtraction = extractionRate - rechargeRate;
  const availableWater = currentLevel * 1000; // Convert to liters (rough estimate)
  
  let yearsRemaining = 0;
  if (netExtraction > 0) {
    yearsRemaining = Math.max(0, availableWater / (netExtraction * 365));
  } else {
    yearsRemaining = 999; // Infinite if recharge > extraction
  }

  let balance = 'balanced';
  if (netExtraction > rechargeRate * 0.1) {
    balance = 'deficit';
  } else if (rechargeRate > extractionRate * 1.1) {
    balance = 'surplus';
  }

  return {
    yearsRemaining: Math.round(yearsRemaining),
    extractionRate,
    rechargeRate,
    balance
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations({ availability, sustainability, environmentalData, trendAnalysis }) {
  const recommendations = [];

  // Water level recommendations
  if (availability.score < 30) {
    recommendations.push({
      type: 'conservation',
      priority: 'critical',
      title: 'Immediate Water Conservation Required',
      description: 'Groundwater levels are critically low. Implement immediate water conservation measures.',
      impact: 'High water savings potential',
      cost: 'Low to Medium',
      timeline: 'Immediate'
    });
  } else if (availability.score < 50) {
    recommendations.push({
      type: 'conservation',
      priority: 'high',
      title: 'Water Conservation Measures',
      description: 'Groundwater levels are low. Implement water conservation practices.',
      impact: 'Moderate water savings',
      cost: 'Low',
      timeline: '1-3 months'
    });
  }

  // Recharge recommendations
  if (sustainability.balance === 'deficit' && environmentalData.rainfall.annual > 500) {
    recommendations.push({
      type: 'recharge',
      priority: 'high',
      title: 'Install Rainwater Harvesting',
      description: 'Set up rooftop rainwater collection systems to improve groundwater recharge during monsoon seasons.',
      impact: 'Can increase local water table by 15-20%',
      cost: 'Medium',
      timeline: '3-6 months'
    });
  }

  // Trend-based recommendations
  if (trendAnalysis.direction === 'falling' && trendAnalysis.significance === 'significant') {
    recommendations.push({
      type: 'monitoring',
      priority: 'medium',
      title: 'Enhanced Monitoring Required',
      description: 'Water levels are declining significantly. Increase monitoring frequency and consider extraction limits.',
      impact: 'Better decision making',
      cost: 'Low',
      timeline: '1-2 months'
    });
  }

  // Agriculture recommendations
  if (availability.score > 70 && environmentalData.rainfall.annual > 800) {
    recommendations.push({
      type: 'infrastructure',
      priority: 'low',
      title: 'Water-Efficient Irrigation',
      description: 'Switch to drip irrigation systems for agricultural activities. This reduces water usage by 40% while maintaining crop yields.',
      impact: '40% water usage reduction',
      cost: 'Medium',
      timeline: '6-12 months'
    });
  }

  return recommendations;
}

/**
 * Calculate usage suitability for different purposes
 */
function calculateUsageSuitability({ waterLevel, quality, sustainability }) {
  const baseScore = Math.max(0, 100 - (waterLevel || 20) * 2);
  
  return {
    agriculture: {
      score: Math.min(100, baseScore + (quality?.ph > 6.5 && quality?.ph < 8.5 ? 20 : 0)),
      status: baseScore > 70 ? 'suitable' : baseScore > 40 ? 'moderate' : 'unsuitable',
      recommendations: baseScore < 50 ? ['Consider water-efficient crops', 'Implement drip irrigation'] : []
    },
    domestic: {
      score: Math.min(100, baseScore + (quality?.tds < 500 ? 15 : 0)),
      status: baseScore > 60 ? 'suitable' : baseScore > 30 ? 'moderate' : 'unsuitable',
      recommendations: baseScore < 40 ? ['Install water treatment', 'Regular water testing'] : []
    },
    industrial: {
      score: Math.min(100, baseScore + (quality?.tds < 1000 ? 10 : 0)),
      status: baseScore > 50 ? 'suitable' : baseScore > 25 ? 'moderate' : 'unsuitable',
      recommendations: baseScore < 30 ? ['Water recycling systems', 'Alternative water sources'] : []
    }
  };
}

module.exports = {
  performGroundwaterAnalysis,
  findNearestStationData,
  calculateTrendAnalysis,
  calculateSustainability,
  generateRecommendations,
  calculateUsageSuitability
};
