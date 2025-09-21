// MongoDB initialization script
db = db.getSiblingDB('groundwater');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'role', 'location'],
      properties: {
        name: { bsonType: 'string', minLength: 2, maxLength: 50 },
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        password: { bsonType: 'string', minLength: 6 },
        role: { enum: ['citizen', 'researcher', 'policy_maker', 'admin'] },
        location: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: { enum: ['Point'] },
            coordinates: {
              bsonType: 'array',
              items: { bsonType: 'double' },
              minItems: 2,
              maxItems: 2
            }
          }
        }
      }
    }
  }
});

db.createCollection('stations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['stationId', 'name', 'location', 'address'],
      properties: {
        stationId: { bsonType: 'string' },
        name: { bsonType: 'string' },
        location: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: { enum: ['Point'] },
            coordinates: {
              bsonType: 'array',
              items: { bsonType: 'double' },
              minItems: 2,
              maxItems: 2
            }
          }
        },
        address: {
          bsonType: 'object',
          required: ['state', 'district'],
          properties: {
            state: { bsonType: 'string' },
            district: { bsonType: 'string' }
          }
        }
      }
    }
  }
});

db.createCollection('readings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['stationId', 'timestamp', 'waterLevel', 'waterLevelStatus'],
      properties: {
        stationId: { bsonType: 'objectId' },
        timestamp: { bsonType: 'date' },
        waterLevel: { bsonType: 'double', minimum: 0 },
        waterLevelStatus: { enum: ['critical', 'low', 'moderate', 'good'] }
      }
    }
  }
});

db.createCollection('analyses', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['location', 'groundwaterAssessment'],
      properties: {
        location: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: { enum: ['Point'] },
            coordinates: {
              bsonType: 'array',
              items: { bsonType: 'double' },
              minItems: 2,
              maxItems: 2
            }
          }
        }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ location: '2dsphere' });

db.stations.createIndex({ stationId: 1 }, { unique: true });
db.stations.createIndex({ location: '2dsphere' });
db.stations.createIndex({ 'address.state': 1, 'address.district': 1 });

db.readings.createIndex({ stationId: 1, timestamp: -1 });
db.readings.createIndex({ timestamp: -1 });
db.readings.createIndex({ waterLevelStatus: 1, timestamp: -1 });

db.analyses.createIndex({ location: '2dsphere' });
db.analyses.createIndex({ 'groundwaterAssessment.availability.status': 1 });
db.analyses.createIndex({ 'metadata.analysisDate': -1 });

// Create sample admin user
db.users.insertOne({
  name: 'Admin User',
  email: 'admin@groundwater.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', // password: admin123
  role: 'admin',
  location: {
    type: 'Point',
    coordinates: [77.2090, 28.6139] // Delhi coordinates
  },
  preferences: {
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    alertRadius: 10,
    monitoringStations: []
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create sample stations
const sampleStations = [
  {
    stationId: 'DRMS-001',
    name: 'Delhi Ridge Monitoring Station',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139]
    },
    address: {
      state: 'Delhi',
      district: 'New Delhi',
      block: 'Central',
      village: 'Connaught Place',
      pincode: '110001'
    },
    technicalDetails: {
      wellDepth: 30,
      casingDepth: 25,
      diameter: 150,
      aquiferType: 'unconfined',
      soilType: 'Alluvial',
      permeability: 'high',
      waterQuality: {
        ph: 7.2,
        tds: 450,
        hardness: 'Moderate',
        lastTested: new Date()
      }
    },
    status: 'active',
    lastReading: {
      waterLevel: 12.5,
      timestamp: new Date(),
      batteryLevel: 85,
      signalStrength: -65
    },
    metadata: {
      installationDate: new Date('2020-01-15'),
      lastMaintenance: new Date('2024-01-01'),
      nextMaintenance: new Date('2024-07-01'),
      dataFrequency: 'hourly',
      operator: 'CGWB',
      contactInfo: {
        phone: '+91-11-23456789',
        email: 'cgwb@nic.in'
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    stationId: 'YBMS-002',
    name: 'Yamuna Bank Monitoring Station',
    location: {
      type: 'Point',
      coordinates: [77.2500, 28.6000]
    },
    address: {
      state: 'Delhi',
      district: 'East Delhi',
      block: 'Yamuna Bank',
      village: 'Yamuna Bank',
      pincode: '110092'
    },
    technicalDetails: {
      wellDepth: 25,
      casingDepth: 20,
      diameter: 150,
      aquiferType: 'unconfined',
      soilType: 'Alluvial',
      permeability: 'high',
      waterQuality: {
        ph: 7.0,
        tds: 500,
        hardness: 'Moderate',
        lastTested: new Date()
      }
    },
    status: 'active',
    lastReading: {
      waterLevel: 8.3,
      timestamp: new Date(),
      batteryLevel: 92,
      signalStrength: -60
    },
    metadata: {
      installationDate: new Date('2020-03-20'),
      lastMaintenance: new Date('2024-01-15'),
      nextMaintenance: new Date('2024-07-15'),
      dataFrequency: 'hourly',
      operator: 'CGWB',
      contactInfo: {
        phone: '+91-11-23456790',
        email: 'cgwb@nic.in'
      }
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.stations.insertMany(sampleStations);

// Create sample readings
const sampleReadings = [];
const stationIds = sampleStations.map(s => s._id);

for (let i = 0; i < 100; i++) {
  const stationId = stationIds[Math.floor(Math.random() * stationIds.length)];
  const timestamp = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)); // Last 100 days
  const waterLevel = 5 + Math.random() * 20; // Random water level between 5-25m
  
  let waterLevelStatus;
  if (waterLevel < 5) waterLevelStatus = 'critical';
  else if (waterLevel < 10) waterLevelStatus = 'low';
  else if (waterLevel < 20) waterLevelStatus = 'moderate';
  else waterLevelStatus = 'good';

  sampleReadings.push({
    stationId: stationId,
    timestamp: timestamp,
    waterLevel: Math.round(waterLevel * 100) / 100,
    waterLevelStatus: waterLevelStatus,
    batteryLevel: 80 + Math.random() * 20,
    signalStrength: -70 + Math.random() * 20,
    temperature: 20 + Math.random() * 15,
    humidity: 40 + Math.random() * 40,
    rainfall: Math.random() * 10,
    quality: {
      ph: 6.5 + Math.random() * 2,
      tds: 300 + Math.random() * 400,
      turbidity: Math.random() * 5,
      conductivity: 200 + Math.random() * 800
    },
    metadata: {
      dataSource: 'dwlr',
      confidence: 85 + Math.random() * 15,
      notes: 'Automated reading'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

db.readings.insertMany(sampleReadings);

print('Database initialized successfully with sample data');
