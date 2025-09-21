# Groundwater Detection System

A comprehensive Real-Time Groundwater Resource Evaluation System built with MERN stack, featuring AI-powered predictions, real-time monitoring, and advanced analytics for groundwater resources across India.

## 🌟 Features

### Core Functionality
- **Real-time Monitoring**: Live DWLR telemetry from 5,260+ monitoring stations
- **AI-Powered Analysis**: Machine learning models for groundwater prediction and sustainability analysis
- **Location-Based Queries**: Get groundwater analysis for any location in India
- **Interactive Maps**: Real-time visualization of monitoring stations and water levels
- **Comprehensive Reports**: Generate detailed PDF reports for locations, areas, and stations

### Advanced Analytics
- **Mann-Kendall Trend Analysis**: Statistical analysis of water level trends
- **Multi-criteria Scoring**: Combines proximity to rivers, rainfall, geology, and usage patterns
- **Sustainability Predictions**: Years of water remaining at current extraction rates
- **Usage Suitability**: Recommendations for agriculture, domestic, and industrial use

### User Features
- **Role-based Access**: Citizen, Researcher, Policy Maker, and Admin roles
- **Real-time Notifications**: Email, SMS, and push notifications for critical alerts
- **Personalized Dashboard**: Location-based insights and recommendations
- **Export Capabilities**: Download reports in PDF format

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 7.0+
- Docker and Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd groundwater-detection-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Or using Docker
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/health

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React.js 18, Tailwind CSS, Leaflet Maps, Chart.js
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MongoDB with geospatial indexing
- **AI/ML**: Custom models with Mann-Kendall analysis and ensemble predictions
- **External APIs**: IMD rainfall data, Google Maps, weather services

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (Auth, Socket)
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── utils/            # Utility functions
├── docker-compose.yml    # Docker configuration
├── Dockerfile           # Production Docker image
└── README.md           # This file
```

## 📊 Data Sources

### Primary Data
- **DWLR Stations**: 5,260+ Digital Water Level Recorder stations
- **Central Ground Water Board (CGWB)**: Official groundwater data
- **India-WRIS**: Water Resources Information System
- **IMD Rainfall Data**: Indian Meteorological Department rainfall data

### External APIs
- **Weather API**: Real-time weather conditions
- **Google Maps**: Geocoding and mapping services
- **OpenStreetMap**: Geospatial data for rivers and water bodies

## 🤖 AI/ML Models

### Prediction Models
1. **Ensemble Model**: Combines linear regression, weighted scoring, and trend analysis
2. **Mann-Kendall Test**: Statistical trend analysis for time series data
3. **Feature Engineering**: 15+ environmental and geological features
4. **Confidence Scoring**: Model confidence based on data quality and availability

### Analysis Features
- **Availability Score**: 0-100% groundwater availability assessment
- **Sustainability Prediction**: Years of water remaining
- **Usage Suitability**: Agriculture, domestic, and industrial recommendations
- **Risk Assessment**: Critical, high, medium, low risk levels

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Stations & Readings
- `GET /api/stations` - Get all stations
- `GET /api/stations/:id` - Get station details
- `GET /api/readings/latest` - Get latest readings
- `GET /api/readings/stats/overview` - Reading statistics

### Analysis
- `POST /api/geolocation/analyze` - Analyze location
- `POST /api/geolocation/nearest-station` - Find nearest station
- `GET /api/analysis/trends` - Get analysis trends

### Reports
- `POST /api/reports/location` - Generate location report
- `POST /api/reports/area` - Generate area report
- `GET /api/reports/station/:id` - Generate station report

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build production image
docker build -t groundwater-system .

# Run with production settings
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://your-mongodb-uri \
  groundwater-system
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet.js**: Security headers and protection
- **Password Hashing**: bcrypt for secure password storage

## 📱 Mobile Responsiveness

- **Progressive Web App (PWA)**: Mobile-optimized interface
- **Responsive Design**: Works on all device sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Offline Capabilities**: Basic offline functionality

## 🧪 Testing

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test

# Run all tests
npm test
```

## 📈 Performance

- **Database Indexing**: Optimized MongoDB indexes for geospatial queries
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Gzip compression for API responses
- **CDN Ready**: Static asset optimization
- **Real-time Updates**: WebSocket connections for live data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Central Ground Water Board (CGWB)** for providing DWLR data
- **Indian Meteorological Department (IMD)** for rainfall data
- **India-WRIS** for water resources information
- **OpenStreetMap** contributors for geospatial data

## 📞 Support

For support and questions:
- Email: support@groundwater-detection.com
- Documentation: [API Docs](http://localhost:5000/api/docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced ML models (LSTM, XGBoost)
- [ ] Satellite data integration
- [ ] Multi-language support
- [ ] Advanced visualization tools
- [ ] IoT device integration
- [ ] Blockchain for data integrity

---

**Built with ❤️ for sustainable water management in India**
#   g r o u n d w a t e r  
 