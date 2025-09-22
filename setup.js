const fs = require('fs');
const path = require('path');

// Create .env file with default configuration
const envContent = `# MongoDB Configuration
MONGODB_URI=mongodb+srv://245122735307_db_user:Tharun%40123@cluster0.v7zegbz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# API Keys (Get these from the respective services)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
DATA_GOV_API_KEY=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b

# Server Configuration
PORT=5000
NODE_ENV=development

# External API URLs
WEATHER_API_URL=https://weather-component-with-api-open-weather.vercel.app
RAINFALL_API_URL=https://api.data.gov.in/resource/6c05cd1b-ed59-40c2-bc31-e314f39c6971

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Frontend URL
CLIENT_URL=http://localhost:3000`;

// Write .env file
fs.writeFileSync('.env', envContent);

console.log('✅ .env file created successfully!');
console.log('📝 Please edit the .env file with your actual configuration values.');
console.log('🔑 Important: Change the JWT_SECRET and MongoDB password!');
