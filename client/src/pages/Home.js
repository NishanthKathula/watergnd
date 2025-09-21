import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Droplets, TrendingUp, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// import { geolocationAPI } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const handleCheckGroundwater = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });

      // Navigate to analysis page with location
      navigate('/analysis', { 
        state: { 
          location: { latitude, longitude },
          fromHome: true 
        } 
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      toast.error('Unable to get your location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Droplets className="w-8 h-8 text-blue-600" />,
      title: "Real-time Data",
      description: "Live DWLR telemetry from monitoring stations across India"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: "Rainfall Analysis",
      description: "Comprehensive recharge calculations using IMD rainfall data"
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-600" />,
      title: "Smart Predictions",
      description: "AI-powered sustainability estimates and usage recommendations"
    }
  ];

  const benefits = [
    "Real-time groundwater monitoring",
    "AI-powered predictions and analysis",
    "Location-based water availability",
    "Sustainability recommendations",
    "Comprehensive reporting system",
    "Multi-source data integration"
  ];

  return (
    <>
      <Helmet>
        <title>Groundwater Detection System - Real-Time Monitoring</title>
        <meta name="description" content="Monitor, visualize, and predict groundwater resources across India with our advanced AI-powered system." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              {/* Logo */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <Droplets className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                  Ground Water{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Detection
                  </span>
                </h1>
              </div>

              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Real-time groundwater monitoring and sustainability analysis powered by{' '}
                <strong>DWLR telemetry</strong> and <strong>advanced forecasting</strong>
              </p>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {features.map((feature, index) => (
                  <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-soft border border-white/20">
                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-sm mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mb-16">
                <button
                  onClick={handleCheckGroundwater}
                  disabled={isLoading}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner mr-3"></div>
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 mr-3" />
                      Check My Groundwater Level
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  We'll use your location to find the nearest groundwater monitoring station
                </p>
              </div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Our System?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Advanced technology meets environmental monitoring for comprehensive groundwater management
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Sources Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-8">
              Powered by official data sources
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
              <span>• Central Ground Water Board</span>
              <span>• India-WRIS</span>
              <span>• IMD Rainfall Data</span>
              <span>• NWIC Telemetry</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of users monitoring groundwater resources across India
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
