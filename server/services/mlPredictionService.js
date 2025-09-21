const { Matrix } = require('ml-matrix');
const { SimpleLinearRegression } = require('ml-regression');
const simpleStats = require('simple-statistics');

/**
 * Predict groundwater level using ensemble ML approach
 */
async function predictGroundwaterLevel({ latitude, longitude, stationData, environmentalData, trendAnalysis }) {
  try {
    // Extract features for ML model
    const features = extractFeatures({
      latitude,
      longitude,
      stationData,
      environmentalData,
      trendAnalysis
    });

    // Calculate availability score using multiple models
    const linearScore = calculateLinearAvailability(features);
    const weightedScore = calculateWeightedAvailability(features);
    const trendScore = calculateTrendBasedAvailability(features);

    // Ensemble prediction (weighted average)
    const ensembleScore = (
      linearScore * 0.4 +
      weightedScore * 0.4 +
      trendScore * 0.2
    );

    // Determine status based on score
    let status;
    if (ensembleScore >= 80) status = 'excellent';
    else if (ensembleScore >= 60) status = 'good';
    else if (ensembleScore >= 40) status = 'moderate';
    else if (ensembleScore >= 20) status = 'low';
    else status = 'critical';

    // Calculate confidence based on data quality
    const confidence = calculatePredictionConfidence(features, stationData);

    return {
      availability: {
        score: Math.round(ensembleScore),
        status
      },
      confidence,
      features: Object.keys(features),
      featureImportance: calculateFeatureImportance(features),
      modelDetails: {
        linearScore,
        weightedScore,
        trendScore,
        ensembleScore
      }
    };
  } catch (error) {
    console.error('ML prediction error:', error);
    // Fallback to simple heuristic
    return {
      availability: {
        score: 50,
        status: 'moderate'
      },
      confidence: 30,
      features: ['fallback'],
      featureImportance: { fallback: 1.0 }
    };
  }
}

/**
 * Extract features for ML model
 */
function extractFeatures({ latitude, longitude, stationData, environmentalData, trendAnalysis }) {
  const features = {};

  // Location features
  features.latitude = latitude;
  features.longitude = longitude;
  features.distance_to_station = stationData.distance;

  // Water level features
  if (stationData.latestReading) {
    features.current_water_level = stationData.latestReading.waterLevel;
    features.water_level_status = getStatusValue(stationData.latestReading.waterLevelStatus);
  } else {
    features.current_water_level = 15; // Default
    features.water_level_status = 2; // Moderate
  }

  // Trend features
  features.trend_direction = getTrendValue(trendAnalysis.direction);
  features.trend_significance = getSignificanceValue(trendAnalysis.significance);
  features.trend_magnitude = Math.abs(trendAnalysis.trend || 0);

  // Rainfall features
  if (environmentalData.rainfall) {
    features.annual_rainfall = environmentalData.rainfall.annual || 0;
    features.monsoon_rainfall = environmentalData.rainfall.seasonal?.monsoon || 0;
    features.rainfall_trend = getTrendValue(environmentalData.rainfall.trend);
  } else {
    features.annual_rainfall = 800; // Default
    features.monsoon_rainfall = 600;
    features.rainfall_trend = 0;
  }

  // Proximity features
  if (environmentalData.proximity) {
    features.nearest_river_distance = environmentalData.proximity.rivers?.[0]?.distance || 50;
    features.nearest_waterbody_distance = environmentalData.proximity.waterBodies?.[0]?.distance || 50;
    features.river_influence = getInfluenceValue(environmentalData.proximity.rivers?.[0]?.influence);
  } else {
    features.nearest_river_distance = 50;
    features.nearest_waterbody_distance = 50;
    features.river_influence = 1;
  }

  // Geological features
  if (environmentalData.geology) {
    features.soil_permeability = getPermeabilityValue(environmentalData.geology.permeability);
    features.aquifer_depth = environmentalData.geology.depth || 20;
  } else {
    features.soil_permeability = 2; // Medium
    features.aquifer_depth = 20;
  }

  // Station technical features
  if (stationData.station.technicalDetails) {
    features.well_depth = stationData.station.technicalDetails.wellDepth || 30;
    features.aquifer_type = getAquiferTypeValue(stationData.station.technicalDetails.aquiferType);
  } else {
    features.well_depth = 30;
    features.aquifer_type = 1; // Unconfined
  }

  return features;
}

/**
 * Calculate availability using linear regression approach
 */
function calculateLinearAvailability(features) {
  // Simple linear model weights (trained on hypothetical data)
  const weights = {
    current_water_level: -2.5, // Lower water level = higher availability
    annual_rainfall: 0.05,
    monsoon_rainfall: 0.08,
    nearest_river_distance: -0.3,
    soil_permeability: 15,
    trend_direction: 10,
    trend_significance: 5
  };

  let score = 50; // Base score

  Object.keys(weights).forEach(feature => {
    if (features[feature] !== undefined) {
      score += weights[feature] * features[feature];
    }
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate availability using weighted scoring approach
 */
function calculateWeightedAvailability(features) {
  const scores = [];

  // Water level score (40% weight)
  const waterLevelScore = Math.max(0, 100 - features.current_water_level * 3);
  scores.push({ score: waterLevelScore, weight: 0.4 });

  // Rainfall score (25% weight)
  const rainfallScore = Math.min(100, (features.annual_rainfall / 10) + (features.monsoon_rainfall / 8));
  scores.push({ score: rainfallScore, weight: 0.25 });

  // Proximity score (20% weight)
  const proximityScore = Math.max(0, 100 - features.nearest_river_distance * 2);
  scores.push({ score: proximityScore, weight: 0.2 });

  // Soil permeability score (15% weight)
  const permeabilityScore = features.soil_permeability * 25;
  scores.push({ score: permeabilityScore, weight: 0.15 });

  // Calculate weighted average
  const weightedSum = scores.reduce((sum, item) => sum + (item.score * item.weight), 0);
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);

  return weightedSum / totalWeight;
}

/**
 * Calculate availability based on trend analysis
 */
function calculateTrendBasedAvailability(features) {
  let score = 50; // Base score

  // Trend direction impact
  if (features.trend_direction === 1) { // Rising
    score += 20;
  } else if (features.trend_direction === -1) { // Falling
    score -= 20;
  }

  // Trend significance impact
  score += features.trend_significance * 10;

  // Trend magnitude impact
  if (features.trend_magnitude > 0.5) {
    score += features.trend_direction * 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate prediction confidence
 */
function calculatePredictionConfidence(features, stationData) {
  let confidence = 50; // Base confidence

  // Data availability factors
  if (stationData.latestReading) confidence += 20;
  if (features.annual_rainfall > 0) confidence += 10;
  if (features.nearest_river_distance < 20) confidence += 10;
  if (features.trend_significance > 2) confidence += 10;

  // Data quality factors
  if (stationData.distance < 10) confidence += 10;
  if (stationData.latestReading?.metadata?.confidence > 80) confidence += 10;

  return Math.min(100, confidence);
}

/**
 * Calculate feature importance
 */
function calculateFeatureImportance(features) {
  const importance = {};

  // Water level is most important
  importance.current_water_level = 0.25;
  importance.annual_rainfall = 0.20;
  importance.trend_direction = 0.15;
  importance.nearest_river_distance = 0.15;
  importance.soil_permeability = 0.10;
  importance.monsoon_rainfall = 0.10;
  importance.trend_significance = 0.05;

  return importance;
}

/**
 * Helper functions for feature encoding
 */
function getStatusValue(status) {
  const statusMap = { 'critical': 0, 'low': 1, 'moderate': 2, 'good': 3, 'excellent': 4 };
  return statusMap[status] || 2;
}

function getTrendValue(trend) {
  const trendMap = { 'falling': -1, 'stable': 0, 'rising': 1 };
  return trendMap[trend] || 0;
}

function getSignificanceValue(significance) {
  const sigMap = { 
    'not_significant': 0, 
    'marginally_significant': 1, 
    'significant': 2, 
    'very_significant': 3, 
    'highly_significant': 4 
  };
  return sigMap[significance] || 0;
}

function getInfluenceValue(influence) {
  const influenceMap = { 'low': 1, 'medium': 2, 'high': 3 };
  return influenceMap[influence] || 1;
}

function getPermeabilityValue(permeability) {
  const permMap = { 'low': 1, 'medium': 2, 'high': 3 };
  return permMap[permeability] || 2;
}

function getAquiferTypeValue(aquiferType) {
  const aquiferMap = { 'unconfined': 1, 'confined': 2, 'semi-confined': 3, 'leaky': 4 };
  return aquiferMap[aquiferType] || 1;
}

/**
 * Predict future water levels using time series forecasting
 */
async function predictFutureLevels(stationId, days = 30) {
  try {
    // This would typically use LSTM or ARIMA models
    // For now, using simple linear trend extrapolation
    
    const Reading = require('../models/Reading');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days

    const readings = await Reading.getReadingsInRange(stationId, startDate, endDate);
    
    if (readings.length < 10) {
      return null;
    }

    // Simple linear regression for trend
    const data = readings.map((r, i) => [i, r.waterLevel]);
    const regression = new SimpleLinearRegression(data);
    
    const predictions = [];
    for (let i = 0; i < days; i++) {
      const futureIndex = readings.length + i;
      const predictedLevel = regression.predict(futureIndex);
      const date = new Date(endDate.getTime() + (i * 24 * 60 * 60 * 1000));
      
      predictions.push({
        date,
        predictedLevel: Math.max(0, predictedLevel),
        confidence: Math.max(50, 100 - i * 2) // Decreasing confidence over time
      });
    }

    return predictions;
  } catch (error) {
    console.error('Future prediction error:', error);
    return null;
  }
}

module.exports = {
  predictGroundwaterLevel,
  predictFutureLevels,
  extractFeatures,
  calculateLinearAvailability,
  calculateWeightedAvailability,
  calculateTrendBasedAvailability
};
