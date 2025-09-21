import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { 
  MapPin, 
  Droplets, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { geolocationAPI, readingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setIsLoadingLocation(false);
          toast.error('Unable to get your location');
        }
      );
    }
  }, []);

  // Fetch nearest station
  const { data: nearestStation } = useQuery(
    ['nearest-station', userLocation],
    () => geolocationAPI.getNearestStation(userLocation),
    {
      enabled: !!userLocation,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch latest readings
  const { data: latestReadings } = useQuery(
    'latest-readings',
    () => readingsAPI.getLatest(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

  // Fetch analysis for user location
  const { data: analysis, isLoading: isLoadingAnalysis, refetch: refetchAnalysis } = useQuery(
    ['analysis', userLocation],
    () => geolocationAPI.analyzeLocation(userLocation),
    {
      enabled: !!userLocation,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'good': return 'text-green-600 bg-green-100';
      case 'excellent': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <TrendingDown className="w-4 h-4" />;
      case 'moderate': return <BarChart3 className="w-4 h-4" />;
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      default: return <Droplets className="w-4 h-4" />;
    }
  };

  const handleRefreshAnalysis = () => {
    refetchAnalysis();
    toast.success('Analysis refreshed');
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Groundwater Detection System</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}
            </h1>
            <p className="text-gray-600">
              Monitor groundwater resources in your area
            </p>
          </div>
          <button
            onClick={handleRefreshAnalysis}
            disabled={isLoadingAnalysis}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Location Status */}
        {isLoadingLocation ? (
          <div className="card">
            <div className="flex items-center">
              <div className="loading-spinner mr-3"></div>
              <span className="text-gray-600">Getting your location...</span>
            </div>
          </div>
        ) : userLocation ? (
          <div className="card">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-gray-600">
                Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        ) : (
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-700">
                Location access denied. Please enable location services for better analysis.
              </span>
            </div>
          </div>
        )}

        {/* Main Analysis Card */}
        {analysis && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Groundwater Analysis</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(analysis.data.groundwaterAssessment.availability.status)}`}>
                {getStatusIcon(analysis.data.groundwaterAssessment.availability.status)}
                <span className="ml-1 capitalize">{analysis.data.groundwaterAssessment.availability.status}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Availability Score */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analysis.data.groundwaterAssessment.availability.score}%
                </div>
                <div className="text-sm text-gray-600 mb-2">Availability Score</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.data.groundwaterAssessment.availability.score}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.data.groundwaterAssessment.availability.confidence}% confidence
                </div>
              </div>

              {/* Water Level */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analysis.data.groundwaterAssessment.depth.estimated}m
                </div>
                <div className="text-sm text-gray-600 mb-2">Estimated Depth</div>
                <div className="text-xs text-gray-500">
                  Range: {analysis.data.groundwaterAssessment.depth.range.min}m - {analysis.data.groundwaterAssessment.depth.range.max}m
                </div>
              </div>

              {/* Sustainability */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analysis.data.groundwaterAssessment.sustainability.yearsRemaining}
                </div>
                <div className="text-sm text-gray-600 mb-2">Years Remaining</div>
                <div className="text-xs text-gray-500">
                  At current extraction rate
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nearest Station */}
        {nearestStation && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearest Monitoring Station</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {nearestStation.data.nearestStation.name}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Distance: {nearestStation.data.nearestStation.distance} km
                  </div>
                  {nearestStation.data.nearestStation.lastReading && (
                    <>
                      <div className="flex items-center">
                        <Droplets className="w-4 h-4 mr-2" />
                        Water Level: {nearestStation.data.nearestStation.lastReading.waterLevel}m
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Last Updated: {new Date(nearestStation.data.nearestStation.lastReading.timestamp).toLocaleString()}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${getStatusColor(nearestStation.data.nearestStation.lastReading?.status || 'unknown')}`}>
                  {getStatusIcon(nearestStation.data.nearestStation.lastReading?.status || 'unknown')}
                  <span className="ml-2 capitalize">{nearestStation.data.nearestStation.lastReading?.status || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Suitability */}
        {analysis && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Suitability</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(analysis.data.usageSuitability).map(([usage, data]) => (
                <div key={usage} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {data.score}%
                  </div>
                  <div className="text-sm font-medium text-gray-700 mb-1 capitalize">
                    {usage}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                    data.status === 'suitable' ? 'bg-green-100 text-green-800' :
                    data.status === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {data.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis && analysis.data.recommendations && analysis.data.recommendations.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {analysis.data.recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  {rec.impact && (
                    <div className="text-xs text-gray-500">
                      <strong>Impact:</strong> {rec.impact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Overview */}
        {latestReadings && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {latestReadings.data.count}
                </div>
                <div className="text-sm text-gray-600">Active Stations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {latestReadings.data.readings.filter(r => r.status === 'critical').length}
                </div>
                <div className="text-sm text-gray-600">Critical Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {latestReadings.data.readings.filter(r => r.status === 'good' || r.status === 'excellent').length}
                </div>
                <div className="text-sm text-gray-600">Healthy Stations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {new Date(latestReadings.data.lastUpdated).toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-600">Last Update</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
