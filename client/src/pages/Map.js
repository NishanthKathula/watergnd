import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPin, Droplets, AlertTriangle, CheckCircle } from 'lucide-react';
import { stationsAPI, readingsAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Fetch stations
  const { data: stations, isLoading: isLoadingStations } = useQuery(
    'stations',
    () => stationsAPI.getAll({ limit: 100 }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch latest readings
  const { data: latestReadings, isLoading: isLoadingReadings } = useQuery(
    'latest-readings',
    () => readingsAPI.getLatest(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#ef4444';
      case 'low': return '#f97316';
      case 'moderate': return '#eab308';
      case 'good': return '#22c55e';
      case 'excellent': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <Droplets className="w-4 h-4" />;
      case 'moderate': return <Droplets className="w-4 h-4" />;
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      default: return <Droplets className="w-4 h-4" />;
    }
  };

  if (isLoadingStations || isLoadingReadings) {
    return (
      <div className="p-6">
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Map View - Groundwater Detection System</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Monitoring Stations Map
            </h1>
            <p className="text-gray-600">
              Real-time groundwater monitoring across India
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {stations?.data?.stations?.length || 0} stations
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="card p-0 overflow-hidden">
          <div className="h-96 w-full">
            <MapContainer
              center={userLocation || [20.5937, 78.9629]} // Default to India center
              zoom={6}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* User location */}
              {userLocation && (
                <Circle
                  center={userLocation}
                  radius={10000}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
                />
              )}

              {/* Station markers */}
              {stations?.data?.stations?.map((station) => {
                const reading = latestReadings?.data?.readings?.find(
                  r => r.station?.id === station._id
                );
                
                const status = reading?.status || 'unknown';
                // const color = getStatusColor(status);
                
                return (
                  <Marker
                    key={station._id}
                    position={[station.location.coordinates[1], station.location.coordinates[0]]}
                    eventHandlers={{
                      click: () => setSelectedStation(station)
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {station.name}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {station.address.state}, {station.address.district}
                          </div>
                          {reading && (
                            <>
                              <div className="flex items-center">
                                <Droplets className="w-4 h-4 mr-2" />
                                Water Level: {reading.waterLevel}m
                              </div>
                              <div className="flex items-center">
                                {getStatusIcon(status)}
                                <span className="ml-2 capitalize">{status}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Last updated: {new Date(reading.timestamp).toLocaleString()}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { status: 'excellent', label: 'Excellent', color: '#10b981' },
              { status: 'good', label: 'Good', color: '#22c55e' },
              { status: 'moderate', label: 'Moderate', color: '#eab308' },
              { status: 'low', label: 'Low', color: '#f97316' },
              { status: 'critical', label: 'Critical', color: '#ef4444' }
            ].map((item) => (
              <div key={item.status} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Station Details */}
        {selectedStation && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Station Details: {selectedStation.name}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>{selectedStation.address.state}, {selectedStation.address.district}</div>
                  <div>Coordinates: {selectedStation.location.coordinates[1].toFixed(4)}, {selectedStation.location.coordinates[0].toFixed(4)}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Station ID: {selectedStation.stationId}</div>
                  <div>Status: <span className="capitalize">{selectedStation.status}</span></div>
                  {selectedStation.technicalDetails?.wellDepth && (
                    <div>Well Depth: {selectedStation.technicalDetails.wellDepth}m</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedStation(null)}
                className="btn-secondary"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Map;
