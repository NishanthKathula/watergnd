const axios = require('axios');

/**
 * Get comprehensive external data for a location
 */
async function getExternalData(latitude, longitude, days = 30) {
  try {
    console.log(`Fetching external data for location: ${latitude}, ${longitude}`);

    // Fetch data from multiple sources in parallel
    const [rainfallData, weatherData, geospatialData] = await Promise.allSettled([
      getRainfallData(latitude, longitude, days),
      getWeatherData(latitude, longitude),
      getGeospatialData(latitude, longitude)
    ]);

    // Process results
    const rainfall = rainfallData.status === 'fulfilled' ? rainfallData.value : getDefaultRainfallData();
    const weather = weatherData.status === 'fulfilled' ? weatherData.value : getDefaultWeatherData();
    const geospatial = geospatialData.status === 'fulfilled' ? geospatialData.value : getDefaultGeospatialData();

    return {
      rainfall,
      weather,
      proximity: geospatial.proximity,
      geology: geospatial.geology,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching external data:', error);
    return getDefaultExternalData();
  }
}

/**
 * Get rainfall data from IMD API
 */
async function getRainfallData(latitude, longitude, days) {
  try {
    const apiKey = process.env.DATA_GOV_API_KEY;
    const apiUrl = process.env.RAINFALL_API_URL;
    
    if (!apiKey || !apiUrl) {
      console.log('Rainfall API credentials not configured');
      return getDefaultRainfallData();
    }

    // Get district from coordinates (simplified - in production, use reverse geocoding)
    const district = await getDistrictFromCoordinates(latitude, longitude);
    
    const response = await axios.get(apiUrl, {
      params: {
        'api-key': apiKey,
        format: 'json',
        limit: 1000,
        filters: `[{"column":"district","value":"${district}"}]`
      },
      timeout: 10000
    });

    if (response.data && response.data.records) {
      return processRainfallData(response.data.records, days);
    }

    return getDefaultRainfallData();
  } catch (error) {
    console.error('Error fetching rainfall data:', error.message);
    return getDefaultRainfallData();
  }
}

/**
 * Get weather data from weather API
 */
async function getWeatherData(latitude, longitude) {
  try {
    const weatherApiUrl = process.env.WEATHER_API_URL;
    
    if (!weatherApiUrl) {
      console.log('Weather API URL not configured');
      return getDefaultWeatherData();
    }

    const response = await axios.get(weatherApiUrl, {
      params: {
        lat: latitude,
        lon: longitude,
        units: 'metric'
      },
      timeout: 10000
    });

    if (response.data) {
      return processWeatherData(response.data);
    }

    return getDefaultWeatherData();
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return getDefaultWeatherData();
  }
}

/**
 * Get geospatial data (rivers, water bodies, geology)
 */
async function getGeospatialData(latitude, longitude) {
  try {
    // In a real implementation, this would use OpenStreetMap Overpass API
    // or other geospatial services to find nearby rivers, water bodies, etc.
    
    // For now, return mock data based on location
    return {
      proximity: {
        rivers: await findNearbyRivers(latitude, longitude),
        waterBodies: await findNearbyWaterBodies(latitude, longitude)
      },
      geology: await getGeologicalData(latitude, longitude)
    };
  } catch (error) {
    console.error('Error fetching geospatial data:', error.message);
    return getDefaultGeospatialData();
  }
}

/**
 * Process rainfall data from API response
 */
function processRainfallData(records, days) {
  try {
    const rainfallData = {
      annual: 0,
      seasonal: {
        monsoon: 0,
        postMonsoon: 0,
        winter: 0,
        summer: 0
      },
      monthly: {},
      trend: 'stable',
      recent: []
    };

    if (!records || records.length === 0) {
      return rainfallData;
    }

    // Process records to calculate totals
    let totalAnnual = 0;
    const monthlyTotals = {};
    const recentRainfall = [];

    records.forEach(record => {
      const date = new Date(record.date);
      const month = date.getMonth();
      const amount = parseFloat(record.rainfall) || 0;
      
      totalAnnual += amount;
      
      if (!monthlyTotals[month]) monthlyTotals[month] = 0;
      monthlyTotals[month] += amount;

      // Recent rainfall (last 30 days)
      const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24);
      if (daysDiff <= days) {
        recentRainfall.push({ date, amount });
      }
    });

    rainfallData.annual = Math.round(totalAnnual);
    rainfallData.monthly = monthlyTotals;
    rainfallData.recent = recentRainfall;

    // Calculate seasonal totals (approximate)
    rainfallData.seasonal.monsoon = (monthlyTotals[6] || 0) + (monthlyTotals[7] || 0) + (monthlyTotals[8] || 0) + (monthlyTotals[9] || 0);
    rainfallData.seasonal.postMonsoon = (monthlyTotals[10] || 0) + (monthlyTotals[11] || 0);
    rainfallData.seasonal.winter = (monthlyTotals[0] || 0) + (monthlyTotals[1] || 0);
    rainfallData.seasonal.summer = (monthlyTotals[2] || 0) + (monthlyTotals[3] || 0) + (monthlyTotals[4] || 0) + (monthlyTotals[5] || 0);

    // Calculate trend (simplified)
    rainfallData.trend = calculateRainfallTrend(monthlyTotals);

    return rainfallData;
  } catch (error) {
    console.error('Error processing rainfall data:', error);
    return getDefaultRainfallData();
  }
}

/**
 * Process weather data from API response
 */
function processWeatherData(weatherData) {
  try {
    return {
      current: {
        temperature: weatherData.main?.temp || 25,
        humidity: weatherData.main?.humidity || 60,
        pressure: weatherData.main?.pressure || 1013,
        windSpeed: weatherData.wind?.speed || 5,
        description: weatherData.weather?.[0]?.description || 'clear sky'
      },
      forecast: weatherData.forecast || [],
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error processing weather data:', error);
    return getDefaultWeatherData();
  }
}

/**
 * Find nearby rivers (mock implementation)
 */
async function findNearbyRivers(latitude, longitude) {
  // In production, this would query OpenStreetMap or other geospatial services
  // For now, return mock data based on location
  
  const mockRivers = [
    { name: 'Ganges', distance: 15, influence: 'high' },
    { name: 'Yamuna', distance: 25, influence: 'medium' },
    { name: 'Godavari', distance: 45, influence: 'low' }
  ];

  // Filter rivers within 50km and add some randomness based on location
  return mockRivers
    .map(river => ({
      ...river,
      distance: river.distance + (Math.random() - 0.5) * 10
    }))
    .filter(river => river.distance <= 50)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Find nearby water bodies (mock implementation)
 */
async function findNearbyWaterBodies(latitude, longitude) {
  const mockWaterBodies = [
    { name: 'Local Lake', distance: 8, type: 'lake' },
    { name: 'Village Pond', distance: 12, type: 'pond' },
    { name: 'Reservoir', distance: 30, type: 'reservoir' }
  ];

  return mockWaterBodies
    .map(body => ({
      ...body,
      distance: body.distance + (Math.random() - 0.5) * 5
    }))
    .filter(body => body.distance <= 40)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get geological data (mock implementation)
 */
async function getGeologicalData(latitude, longitude) {
  // In production, this would query geological databases
  return {
    soilType: 'Alluvial',
    aquiferType: 'unconfined',
    permeability: 'high',
    depth: 15 + Math.random() * 10 // 15-25 meters
  };
}

/**
 * Get district from coordinates (simplified)
 */
async function getDistrictFromCoordinates(latitude, longitude) {
  // In production, use reverse geocoding service
  // For now, return a default district
  return 'Delhi';
}

/**
 * Calculate rainfall trend
 */
function calculateRainfallTrend(monthlyTotals) {
  const months = Object.keys(monthlyTotals).map(Number).sort();
  if (months.length < 6) return 'stable';

  const firstHalf = months.slice(0, Math.floor(months.length / 2));
  const secondHalf = months.slice(Math.floor(months.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, month) => sum + (monthlyTotals[month] || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, month) => sum + (monthlyTotals[month] || 0), 0) / secondHalf.length;

  const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}

/**
 * Default data functions
 */
function getDefaultRainfallData() {
  return {
    annual: 800,
    seasonal: {
      monsoon: 600,
      postMonsoon: 100,
      winter: 50,
      summer: 50
    },
    monthly: {},
    trend: 'stable',
    recent: []
  };
}

function getDefaultWeatherData() {
  return {
    current: {
      temperature: 25,
      humidity: 60,
      pressure: 1013,
      windSpeed: 5,
      description: 'clear sky'
    },
    forecast: [],
    lastUpdated: new Date()
  };
}

function getDefaultGeospatialData() {
  return {
    proximity: {
      rivers: [],
      waterBodies: []
    },
    geology: {
      soilType: 'Unknown',
      aquiferType: 'unconfined',
      permeability: 'medium',
      depth: 20
    }
  };
}

function getDefaultExternalData() {
  return {
    rainfall: getDefaultRainfallData(),
    weather: getDefaultWeatherData(),
    proximity: getDefaultGeospatialData().proximity,
    geology: getDefaultGeospatialData().geology,
    lastUpdated: new Date()
  };
}

module.exports = {
  getExternalData,
  getRainfallData,
  getWeatherData,
  getGeospatialData,
  processRainfallData,
  processWeatherData
};
