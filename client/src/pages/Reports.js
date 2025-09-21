import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { 
  Download, 
  FileText, 
  MapPin, 
  BarChart3, 
  Calendar
} from 'lucide-react';
import { reportsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [reportType, setReportType] = useState('location');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch summary report
  const { data: summaryReport } = useQuery(
    'summary-report',
    () => reportsAPI.generateSummaryReport(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const handleGenerateReport = async (type, data) => {
    setIsGenerating(true);
    try {
      let response;
      
      switch (type) {
        case 'location':
          response = await reportsAPI.generateLocationReport(data, 'pdf');
          break;
        case 'area':
          response = await reportsAPI.generateAreaReport(data, 'pdf');
          break;
        case 'station':
          response = await reportsAPI.generateStationReport(data.stationId, { format: 'pdf' });
          break;
        default:
          response = await reportsAPI.generateSummaryReport({ format: 'pdf' });
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report generated and downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    {
      id: 'location',
      name: 'Location Report',
      description: 'Detailed groundwater analysis for a specific location',
      icon: <MapPin className="w-6 h-6" />,
      color: 'blue'
    },
    {
      id: 'area',
      name: 'Area Report',
      description: 'Comprehensive analysis for a geographical area',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'green'
    },
    {
      id: 'station',
      name: 'Station Report',
      description: 'Detailed report for a specific monitoring station',
      icon: <FileText className="w-6 h-6" />,
      color: 'purple'
    },
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'System-wide overview and statistics',
      icon: <Calendar className="w-6 h-6" />,
      color: 'orange'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Reports - Groundwater Detection System</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Generate comprehensive groundwater reports and analysis
          </p>
        </div>

        {/* Report Types */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportTypes.map((type) => (
            <div
              key={type.id}
              className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
                reportType === type.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setReportType(type.id)}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                type.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                type.color === 'green' ? 'bg-green-100 text-green-600' :
                type.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {type.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {type.name}
              </h3>
              <p className="text-sm text-gray-600">
                {type.description}
              </p>
            </div>
          ))}
        </div>

        {/* Report Generation */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Generate {reportTypes.find(t => t.id === reportType)?.name}
          </h2>

          {reportType === 'location' && (
            <LocationReportForm 
              onGenerate={(data) => handleGenerateReport('location', data)}
              isGenerating={isGenerating}
            />
          )}

          {reportType === 'area' && (
            <AreaReportForm 
              onGenerate={(data) => handleGenerateReport('area', data)}
              isGenerating={isGenerating}
            />
          )}

          {reportType === 'station' && (
            <StationReportForm 
              onGenerate={(data) => handleGenerateReport('station', data)}
              isGenerating={isGenerating}
            />
          )}

          {reportType === 'summary' && (
            <SummaryReportForm 
              onGenerate={() => handleGenerateReport('summary')}
              isGenerating={isGenerating}
              summaryData={summaryReport}
            />
          )}
        </div>

        {/* Recent Reports */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {[
              { name: 'Location Analysis - Delhi', date: '2024-01-15', type: 'PDF' },
              { name: 'Area Report - NCR Region', date: '2024-01-14', type: 'PDF' },
              { name: 'Station Report - DRMS-001', date: '2024-01-13', type: 'PDF' },
              { name: 'Monthly Summary', date: '2024-01-12', type: 'PDF' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-500">{report.date}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    {report.type}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// Location Report Form
const LocationReportForm = ({ onGenerate, isGenerating }) => {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    extractionRate: 2000
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.latitude && formData.longitude) {
      onGenerate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            className="input-field"
            placeholder="28.6139"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            className="input-field"
            placeholder="77.2090"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Extraction Rate (L/day)
        </label>
        <input
          type="number"
          value={formData.extractionRate}
          onChange={(e) => setFormData({ ...formData, extractionRate: e.target.value })}
          className="input-field"
          placeholder="2000"
        />
      </div>
      <button
        type="submit"
        disabled={isGenerating}
        className="btn-primary flex items-center"
      >
        {isGenerating ? (
          <div className="loading-spinner mr-2"></div>
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Generate Location Report
      </button>
    </form>
  );
};

// Area Report Form
const AreaReportForm = ({ onGenerate, isGenerating }) => {
  const [formData, setFormData] = useState({
    centerLatitude: '',
    centerLongitude: '',
    radius: 10
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.centerLatitude && formData.centerLongitude) {
      onGenerate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Center Latitude
          </label>
          <input
            type="number"
            step="any"
            value={formData.centerLatitude}
            onChange={(e) => setFormData({ ...formData, centerLatitude: e.target.value })}
            className="input-field"
            placeholder="28.6139"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Center Longitude
          </label>
          <input
            type="number"
            step="any"
            value={formData.centerLongitude}
            onChange={(e) => setFormData({ ...formData, centerLongitude: e.target.value })}
            className="input-field"
            placeholder="77.2090"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Radius (km)
        </label>
        <input
          type="number"
          value={formData.radius}
          onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
          className="input-field"
          placeholder="10"
          min="1"
          max="100"
        />
      </div>
      <button
        type="submit"
        disabled={isGenerating}
        className="btn-primary flex items-center"
      >
        {isGenerating ? (
          <div className="loading-spinner mr-2"></div>
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Generate Area Report
      </button>
    </form>
  );
};

// Station Report Form
const StationReportForm = ({ onGenerate, isGenerating }) => {
  const [formData, setFormData] = useState({
    stationId: '',
    days: 30
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.stationId) {
      onGenerate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Station ID
        </label>
        <input
          type="text"
          value={formData.stationId}
          onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
          className="input-field"
          placeholder="DRMS-001"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Analysis Period (days)
        </label>
        <input
          type="number"
          value={formData.days}
          onChange={(e) => setFormData({ ...formData, days: e.target.value })}
          className="input-field"
          placeholder="30"
          min="7"
          max="365"
        />
      </div>
      <button
        type="submit"
        disabled={isGenerating}
        className="btn-primary flex items-center"
      >
        {isGenerating ? (
          <div className="loading-spinner mr-2"></div>
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Generate Station Report
      </button>
    </form>
  );
};

// Summary Report Form
const SummaryReportForm = ({ onGenerate, isGenerating, summaryData }) => {
  return (
    <div className="space-y-4">
      {summaryData && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">System Overview</h4>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summaryData.data.report.overview.totalStations}
              </div>
              <div className="text-gray-600">Total Stations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summaryData.data.report.overview.activeStations}
              </div>
              <div className="text-gray-600">Active Stations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summaryData.data.report.overview.totalReadings}
              </div>
              <div className="text-gray-600">Total Readings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {summaryData.data.report.overview.criticalAlerts}
              </div>
              <div className="text-gray-600">Critical Alerts</div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="btn-primary flex items-center"
      >
        {isGenerating ? (
          <div className="loading-spinner mr-2"></div>
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Generate Summary Report
      </button>
    </div>
  );
};

export default Reports;
