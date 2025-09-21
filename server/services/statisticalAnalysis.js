const simpleStats = require('simple-statistics');

/**
 * Calculate Mann-Kendall trend test for time series data
 * This is a non-parametric test to detect trends in time series data
 */
function calculateMannKendallTrend(data, timestamps) {
  if (data.length < 3) {
    return {
      trend: 0,
      direction: 'stable',
      significance: 'insufficient_data',
      pValue: 1.0
    };
  }

  const n = data.length;
  let S = 0;
  let ties = 0;

  // Calculate S statistic
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = data[j] - data[i];
      if (diff > 0) S++;
      else if (diff < 0) S--;
      else ties++;
    }
  }

  // Calculate variance with ties correction
  const variance = (n * (n - 1) * (2 * n + 5) - ties) / 18;
  const stdDev = Math.sqrt(variance);

  // Calculate Z statistic
  let Z;
  if (S > 0) {
    Z = (S - 1) / stdDev;
  } else if (S < 0) {
    Z = (S + 1) / stdDev;
  } else {
    Z = 0;
  }

  // Calculate p-value (approximate)
  const pValue = 2 * (1 - normalCDF(Math.abs(Z)));

  // Determine significance and direction
  let significance = 'not_significant';
  if (pValue < 0.001) significance = 'highly_significant';
  else if (pValue < 0.01) significance = 'very_significant';
  else if (pValue < 0.05) significance = 'significant';
  else if (pValue < 0.1) significance = 'marginally_significant';

  const direction = S > 0 ? 'rising' : S < 0 ? 'falling' : 'stable';

  // Calculate trend magnitude (slope)
  const trend = calculateSenSlope(data, timestamps);

  return {
    trend,
    direction,
    significance,
    pValue,
    S,
    Z,
    variance,
    dataPoints: n
  };
}

/**
 * Calculate Sen's slope estimator for trend magnitude
 */
function calculateSenSlope(data, timestamps) {
  const slopes = [];
  
  for (let i = 0; i < data.length - 1; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const timeDiff = (timestamps[j] - timestamps[i]) / (1000 * 60 * 60 * 24); // days
      if (timeDiff > 0) {
        const slope = (data[j] - data[i]) / timeDiff;
        slopes.push(slope);
      }
    }
  }

  if (slopes.length === 0) return 0;

  // Sort slopes and get median
  slopes.sort((a, b) => a - b);
  const medianIndex = Math.floor(slopes.length / 2);
  
  if (slopes.length % 2 === 0) {
    return (slopes[medianIndex - 1] + slopes[medianIndex]) / 2;
  } else {
    return slopes[medianIndex];
  }
}

/**
 * Approximate cumulative distribution function for standard normal distribution
 */
function normalCDF(x) {
  // Approximation using error function
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation
 */
function erf(x) {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Calculate autocorrelation for time series
 */
function calculateAutocorrelation(data, lag = 1) {
  if (data.length < lag + 2) return 0;

  const mean = simpleStats.mean(data);
  const variance = simpleStats.variance(data);
  
  if (variance === 0) return 0;

  let numerator = 0;
  for (let i = 0; i < data.length - lag; i++) {
    numerator += (data[i] - mean) * (data[i + lag] - mean);
  }

  return numerator / ((data.length - lag) * variance);
}

/**
 * Detect seasonality in time series
 */
function detectSeasonality(data, timestamps) {
  if (data.length < 12) return null;

  // Group data by month
  const monthlyData = {};
  timestamps.forEach((timestamp, index) => {
    const month = new Date(timestamp).getMonth();
    if (!monthlyData[month]) monthlyData[month] = [];
    monthlyData[month].push(data[index]);
  });

  // Calculate monthly means
  const monthlyMeans = {};
  Object.keys(monthlyData).forEach(month => {
    monthlyMeans[month] = simpleStats.mean(monthlyData[month]);
  });

  // Calculate coefficient of variation
  const means = Object.values(monthlyMeans);
  const overallMean = simpleStats.mean(means);
  const overallStd = simpleStats.standardDeviation(means);
  
  const cv = overallStd / overallMean;

  return {
    coefficientOfVariation: cv,
    seasonal: cv > 0.1,
    monthlyMeans,
    peakMonth: Object.keys(monthlyMeans).reduce((a, b) => 
      monthlyMeans[a] > monthlyMeans[b] ? a : b
    ),
    lowMonth: Object.keys(monthlyMeans).reduce((a, b) => 
      monthlyMeans[a] < monthlyMeans[b] ? a : b
    )
  };
}

/**
 * Calculate water level statistics
 */
function calculateWaterLevelStats(readings) {
  if (readings.length === 0) return null;

  const waterLevels = readings.map(r => r.waterLevel);
  const timestamps = readings.map(r => r.timestamp.getTime());

  const stats = {
    count: waterLevels.length,
    mean: simpleStats.mean(waterLevels),
    median: simpleStats.median(waterLevels),
    mode: simpleStats.mode(waterLevels),
    standardDeviation: simpleStats.standardDeviation(waterLevels),
    min: Math.min(...waterLevels),
    max: Math.max(...waterLevels),
    range: Math.max(...waterLevels) - Math.min(...waterLevels),
    q1: simpleStats.quantile(waterLevels, 0.25),
    q3: simpleStats.quantile(waterLevels, 0.75),
    iqr: simpleStats.quantile(waterLevels, 0.75) - simpleStats.quantile(waterLevels, 0.25)
  };

  // Calculate trend
  const trend = calculateMannKendallTrend(waterLevels, timestamps);
  stats.trend = trend;

  // Calculate seasonality
  const seasonality = detectSeasonality(waterLevels, timestamps);
  stats.seasonality = seasonality;

  // Calculate autocorrelation
  stats.autocorrelation = calculateAutocorrelation(waterLevels, 1);

  return stats;
}

/**
 * Calculate recharge rate from rainfall and water level data
 */
function calculateRechargeRate(rainfallData, waterLevelData) {
  if (rainfallData.length === 0 || waterLevelData.length === 0) return 0;

  // Simple linear regression between rainfall and water level change
  const rainfall = rainfallData.map(d => d.amount);
  const waterLevelChange = waterLevelData.map(d => d.change);

  if (rainfall.length !== waterLevelChange.length) return 0;

  const correlation = simpleStats.sampleCorrelation(rainfall, waterLevelChange);
  const slope = simpleStats.linearRegression(
    rainfall.map((r, i) => [r, waterLevelChange[i]])
  ).m;

  return {
    correlation,
    slope,
    rechargeEfficiency: Math.max(0, Math.min(1, slope * 1000)) // Convert to efficiency ratio
  };
}

module.exports = {
  calculateMannKendallTrend,
  calculateSenSlope,
  calculateAutocorrelation,
  detectSeasonality,
  calculateWaterLevelStats,
  calculateRechargeRate
};
