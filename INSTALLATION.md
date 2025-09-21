# 🚀 Installation Guide - Groundwater Detection System

## Prerequisites

Before installing the application, ensure you have the following software installed:

### 1. Node.js (Required)
- **Version**: 18.0 or higher
- **Download**: https://nodejs.org/
- **Verify**: Open command prompt and run:
  ```bash
  node --version
  npm --version
  ```

### 2. MongoDB (Required)
Choose one of the following options:

#### Option A: MongoDB Atlas (Cloud - Recommended)
- **Sign up**: https://www.mongodb.com/atlas
- **Create a free cluster**
- **Get connection string**

#### Option B: Local MongoDB Installation
- **Download**: https://www.mongodb.com/try/download/community
- **Install and start MongoDB service**

### 3. Git (Optional)
- **Download**: https://git-scm.com/
- **For cloning the repository**

## 🛠️ Installation Methods

### Method 1: Automatic Installation (Windows)

1. **Run the installation script**:
   ```bash
   install.bat
   ```

2. **Edit configuration**:
   - Open `.env` file
   - Update MongoDB connection string
   - Add your API keys (optional for basic functionality)

3. **Start the application**:
   ```bash
   start.bat
   ```

### Method 2: Manual Installation

#### Step 1: Install Dependencies
```bash
# Install all dependencies (client + server)
npm run install-all
```

#### Step 2: Environment Setup
```bash
# Create environment file
node setup.js

# Edit .env file with your configuration
notepad .env
```

#### Step 3: Build Frontend
```bash
cd client
npm run build
cd ..
```

#### Step 4: Start Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Or start individually:
# Backend only
npm run server

# Frontend only
npm run client
```

## 🔧 Configuration

### Required Configuration (.env file)

```env
# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/groundwater

# JWT Secret (REQUIRED - Change this!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Port
PORT=5000
```

### Optional Configuration

```env
# API Keys (Optional - for enhanced features)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
WEATHER_API_KEY=your_weather_api_key

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Production Mode
```bash
# Build frontend
cd client && npm run build && cd ..

# Start backend
npm start
```

### Using Docker
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📱 Accessing the Application

1. **Open your web browser**
2. **Navigate to**: http://localhost:3000
3. **Create an account** or use demo credentials:
   - Email: `demo@groundwater.com`
   - Password: `demo123`

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: 
- Check if MongoDB is running
- Verify connection string in `.env`
- For Atlas: Check network access settings

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**:
- Change PORT in `.env` file
- Or kill the process using the port

#### 3. Node Modules Issues
```
Error: Cannot find module
```
**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm run install-all
```

#### 4. Build Errors
```
Error: Failed to compile
```
**Solution**:
```bash
# Clear cache and rebuild
cd client
npm run build
```

### Getting Help

1. **Check logs**: Look at console output for error messages
2. **Verify prerequisites**: Ensure Node.js and MongoDB are installed
3. **Check configuration**: Verify `.env` file settings
4. **Restart services**: Try stopping and starting again

## 📊 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 2GB free space
- **OS**: Windows 10, macOS 10.14, or Linux

### Recommended Requirements
- **RAM**: 8GB
- **Storage**: 5GB free space
- **OS**: Latest version of Windows, macOS, or Linux

## 🔐 Security Notes

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable HTTPS** in production
4. **Configure firewall** rules
5. **Regular security updates**

## 📈 Performance Tips

1. **Use MongoDB Atlas** for better performance
2. **Enable Redis** for caching (optional)
3. **Use CDN** for static assets in production
4. **Monitor memory usage**
5. **Regular database maintenance**

## 🆘 Support

If you encounter issues:

1. **Check this guide** first
2. **Review error logs**
3. **Verify all prerequisites**
4. **Try the troubleshooting steps**
5. **Contact support** if needed

---

**Happy coding! 🎉**
