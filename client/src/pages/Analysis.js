import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Download,
  RefreshCw,
  ArrowLeft,
  CloudRain,
  Waves,
  Mountain
} from 'lucide-react';
import { geolocationAPI } from '../services/api';
import toast from 'react-hot-toast';

const Analysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get location from navigation state or geolocation
  useEffect(() => {
    if (location.state?.location) {
      setUserLocation(location.state.location);
    } else if (navigator.geolocation) {
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
  }, [location.state]);

  // Fetch analysis for the location
  const { data: analysis, isLoading: isLoadingAnalysis, refetch: refetchAnalysis } = useQuery(
    ['analysis', userLocation],
    () => geolocationAPI.analyzeLocation(userLocation),
    {
      enabled: !!userLocation,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch trends for the location
  // const { data: trends, isLoading: isLoadingTrends } = useQuery(
  //   ['trends', userLocation],
  //   () => geolocationAPI.getTrends(userLocation),
  //   {
  //     enabled: !!userLocation,
  //     staleTime: 5 * 60 * 1000, // 5 minutes
  //   }
  // );

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'low': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'good': return 'text-green-600 bg-green-100 border-green-200';
      case 'excellent': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
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

  const handleDownloadReport = async () => {
    try {
      const response = await geolocationAPI.analyzeLocation({
        ...userLocation,
        format: 'pdf'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `groundwater-analysis-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  if (isLoadingLocation) {
    return (
      <div className="p-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Getting your location...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="p-6">
        <div className="card">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Required</h3>
            <p className="text-gray-600 mb-4">
              We need your location to perform groundwater analysis.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Groundwater Analysis - Groundwater Detection System</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Groundwater Analysis
              </h1>
              <p className="text-gray-600">
                Detailed analysis for your location
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadReport}
              className="btn-secondary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              onClick={handleRefreshAnalysis}
              disabled={isLoadingAnalysis}
              className="btn-primary flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Location Info */}
        <div className="card">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-gray-600">
              Analyzing location: {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
            </span>
          </div>
        </div>

        {isLoadingAnalysis ? (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing groundwater data...</p>
              </div>
            </div>
          </div>
        ) : analysis ? (
          <>
            {/* Main Analysis Results */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center border ${getStatusColor(analysis.data.groundwaterAssessment.availability.status)}`}>
                  {getStatusIcon(analysis.data.groundwaterAssessment.availability.status)}
                  <span className="ml-1 capitalize">{analysis.data.groundwaterAssessment.availability.status}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                {/* Availability Score */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {analysis.data.groundwaterAssessment.availability.score}%
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Availability Score</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysis.data.groundwaterAssessment.availability.score}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {analysis.data.groundwaterAssessment.availability.confidence}% confidence
                  </div>
                </div>

                {/* Water Level */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {analysis.data.groundwaterAssessment.depth.estimated}m
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Estimated Depth</div>
                  <div className="text-xs text-gray-500">
                    Range: {analysis.data.groundwaterAssessment.depth.range.min}m - {analysis.data.groundwaterAssessment.depth.range.max}m
                  </div>
                </div>

                {/* Sustainability */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {analysis.data.groundwaterAssessment.sustainability.yearsRemaining}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Years Remaining</div>
                  <div className="text-xs text-gray-500">
                    At current extraction rate
                  </div>
                </div>

                {/* Balance */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {analysis.data.groundwaterAssessment.sustainability.balance}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Water Balance</div>
                  <div className="text-xs text-gray-500">
                    Recharge vs Extraction
                  </div>
                </div>
              </div>
            </div>

            {/* Nearest Station */}
            {analysis.data.nearestStation && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nearest Monitoring Station</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {analysis.data.nearestStation.name}
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Distance: {analysis.data.nearestStation.distance} km
                      </div>
                      <div className="flex items-center">
                        <Droplets className="w-4 h-4 mr-2" />
                        Water Level: {analysis.data.nearestStation.waterLevel}m
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Last Updated: {new Date(analysis.data.nearestStation.lastUpdated).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${getStatusColor('moderate')}`}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      <span>Monitoring Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Environmental Factors */}
            {analysis.data.environmentalFactors && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Factors</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Rainfall */}
                  {analysis.data.environmentalFactors.rainfall && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <CloudRain className="w-5 h-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Rainfall</h4>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {analysis.data.environmentalFactors.rainfall.annual}mm
                      </div>
                      <div className="text-sm text-gray-600">Annual</div>
                      {analysis.data.environmentalFactors.rainfall.seasonal && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div>Monsoon: {analysis.data.environmentalFactors.rainfall.seasonal.monsoon}mm</div>
                          <div>Post-Monsoon: {analysis.data.environmentalFactors.rainfall.seasonal.postMonsoon}mm</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proximity to Water Bodies */}
                  {analysis.data.environmentalFactors.proximity && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Waves className="w-5 h-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Water Bodies</h4>
                      </div>
                      {analysis.data.environmentalFactors.proximity.rivers && analysis.data.environmentalFactors.proximity.rivers.length > 0 && (
                        <div className="text-sm text-gray-600 mb-1">
                          Nearest River: {analysis.data.environmentalFactors.proximity.rivers[0].distance}km
                        </div>
                      )}
                      {analysis.data.environmentalFactors.proximity.waterBodies && analysis.data.environmentalFactors.proximity.waterBodies.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Nearest Water Body: {analysis.data.environmentalFactors.proximity.waterBodies[0].distance}km
                        </div>
                      )}
                    </div>
                  )}

                  {/* Geology */}
                  {analysis.data.environmentalFactors.geology && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Mountain className="w-5 h-5 text-yellow-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Geology</h4>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Soil: {analysis.data.environmentalFactors.geology.soilType}</div>
                        <div>Aquifer: {analysis.data.environmentalFactors.geology.aquiferType}</div>
                        <div>Permeability: {analysis.data.environmentalFactors.geology.permeability}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Usage Suitability */}
            {analysis.data.usageSuitability && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Suitability</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(analysis.data.usageSuitability).map(([usage, data]) => (
                    <div key={usage} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {data.score}%
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-2 capitalize">
                        {usage}
                      </div>
                      <div className={`text-xs px-3 py-1 rounded-full inline-block ${
                        data.status === 'suitable' ? 'bg-green-100 text-green-800' :
                        data.status === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.status}
                      </div>
                      {data.recommendations && data.recommendations.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {data.recommendations[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.data.recommendations && analysis.data.recommendations.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-4">
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
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {rec.impact && <span><strong>Impact:</strong> {rec.impact}</span>}
                        {rec.cost && <span><strong>Cost:</strong> {rec.cost}</span>}
                        {rec.timeline && <span><strong>Timeline:</strong> {rec.timeline}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ML Predictions */}
            {analysis.data.mlPredictions && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Predictions</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Model Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Model: {analysis.data.mlPredictions.model}</div>
                      <div>Confidence: {analysis.data.mlPredictions.predictionConfidence}%</div>
                      <div>Features: {analysis.data.mlPredictions.features.length}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Feature Importance</h4>
                    <div className="space-y-1">
                      {Object.entries(analysis.data.mlPredictions.featureImportance).slice(0, 5).map(([feature, importance]) => (
                        <div key={feature} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 capitalize">{feature.replace(/_/g, ' ')}</span>
                          <span className="text-gray-900 font-medium">{(importance * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
              <p className="text-gray-600 mb-4">
                Unable to perform groundwater analysis for this location.
              </p>
              <button
                onClick={handleRefreshAnalysis}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Analysis;
