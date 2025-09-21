const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF report
 */
async function generatePDFReport(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add header
      addHeader(doc, reportData);

      // Add content based on report type
      switch (reportData.type) {
        case 'location':
          addLocationReportContent(doc, reportData);
          break;
        case 'area':
          addAreaReportContent(doc, reportData);
          break;
        case 'station':
          addStationReportContent(doc, reportData);
          break;
        case 'summary':
          addSummaryReportContent(doc, reportData);
          break;
        default:
          addGenericReportContent(doc, reportData);
      }

      // Add footer
      addFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add header to PDF
 */
function addHeader(doc, reportData) {
  // Logo area (placeholder)
  doc.rect(50, 50, 100, 30)
     .fill('#667eea');
  
  doc.fillColor('white')
     .fontSize(16)
     .text('Groundwater Detection', 60, 60)
     .fontSize(10)
     .text('Real-Time Monitoring System', 60, 80);

  // Title
  doc.fillColor('black')
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(reportData.title, 200, 60);

  // Report info
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Generated: ${new Date().toLocaleDateString()}`, 200, 85)
     .text(`Report Type: ${reportData.type.toUpperCase()}`, 200, 100);

  // Line separator
  doc.moveTo(50, 120)
     .lineTo(550, 120)
     .stroke('#cccccc');

  doc.y = 140;
}

/**
 * Add location report content
 */
function addLocationReportContent(doc, reportData) {
  // Executive Summary
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Executive Summary', 50, doc.y)
     .moveDown();

  const summary = reportData.executiveSummary;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Water Availability: ${summary.availability.score}% (${summary.availability.status})`, 50, doc.y)
     .text(`Sustainability: ${summary.sustainability.yearsRemaining} years remaining`, 50, doc.y)
     .text(`Risk Level: ${summary.riskLevel}`, 50, doc.y)
     .moveDown();

  // Location Details
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Location Details', 50, doc.y)
     .moveDown();

  const coords = reportData.location.coordinates;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Coordinates: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`, 50, doc.y)
     .text(`Address: ${reportData.location.address}`, 50, doc.y)
     .moveDown();

  // Nearest Station
  if (reportData.detailedAnalysis.nearestStation) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Nearest Monitoring Station', 50, doc.y)
       .moveDown();

    const station = reportData.detailedAnalysis.nearestStation;
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Station: ${station.name}`, 50, doc.y)
       .text(`Distance: ${station.distance} km`, 50, doc.y)
       .text(`Water Level: ${station.waterLevel} m`, 50, doc.y)
       .text(`Last Updated: ${new Date(station.lastUpdated).toLocaleString()}`, 50, doc.y)
       .moveDown();
  }

  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Recommendations', 50, doc.y)
       .moveDown();

    reportData.recommendations.forEach((rec, index) => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${rec.title}`, 50, doc.y)
         .font('Helvetica')
         .text(`Priority: ${rec.priority}`, 70, doc.y)
         .text(rec.description, 70, doc.y)
         .moveDown();
    });
  }

  // Usage Suitability
  if (reportData.usageSuitability) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Usage Suitability', 50, doc.y)
       .moveDown();

    const suitability = reportData.usageSuitability;
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Agriculture: ${suitability.agriculture.status} (${suitability.agriculture.score}%)`, 50, doc.y)
       .text(`Domestic: ${suitability.domestic.status} (${suitability.domestic.score}%)`, 50, doc.y)
       .text(`Industrial: ${suitability.industrial.status} (${suitability.industrial.score}%)`, 50, doc.y)
       .moveDown();
  }
}

/**
 * Add area report content
 */
function addAreaReportContent(doc, reportData) {
  // Area Summary
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Area Summary', 50, doc.y)
     .moveDown();

  const summary = reportData.summary;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Total Analyses: ${summary.totalAnalyses}`, 50, doc.y)
     .text(`Total Stations: ${summary.totalStations}`, 50, doc.y)
     .text(`Average Availability: ${summary.averageAvailability}%`, 50, doc.y)
     .text(`Average Sustainability: ${summary.averageSustainability} years`, 50, doc.y)
     .moveDown();

  // Status Distribution
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Status Distribution', 50, doc.y)
     .moveDown();

  const distribution = summary.statusDistribution;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Critical: ${distribution.critical}`, 50, doc.y)
     .text(`Low: ${distribution.low}`, 50, doc.y)
     .text(`Moderate: ${distribution.moderate}`, 50, doc.y)
     .text(`Good: ${distribution.good}`, 50, doc.y)
     .text(`Excellent: ${distribution.excellent}`, 50, doc.y)
     .moveDown();

  // Area Details
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Area Details', 50, doc.y)
     .moveDown();

  const area = reportData.area;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Center: ${area.center.latitude.toFixed(6)}, ${area.center.longitude.toFixed(6)}`, 50, doc.y)
     .text(`Radius: ${area.radius} km`, 50, doc.y)
     .moveDown();

  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Area Recommendations', 50, doc.y)
       .moveDown();

    reportData.recommendations.forEach((rec, index) => {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${rec.title}`, 50, doc.y)
         .font('Helvetica')
         .text(`Priority: ${rec.priority}`, 70, doc.y)
         .text(rec.description, 70, doc.y)
         .moveDown();
    });
  }
}

/**
 * Add station report content
 */
function addStationReportContent(doc, reportData) {
  // Station Information
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Station Information', 50, doc.y)
     .moveDown();

  const station = reportData.station;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Name: ${station.name}`, 50, doc.y)
     .text(`Station ID: ${station.stationId}`, 50, doc.y)
     .text(`Location: ${station.location.coordinates[1].toFixed(6)}, ${station.location.coordinates[0].toFixed(6)}`, 50, doc.y)
     .text(`Address: ${station.address.state}, ${station.address.district}`, 50, doc.y)
     .moveDown();

  // Statistics
  if (reportData.statistics) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Statistics', 50, doc.y)
       .moveDown();

    const stats = reportData.statistics;
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Data Points: ${stats.count}`, 50, doc.y)
       .text(`Average Water Level: ${stats.mean.toFixed(2)} m`, 50, doc.y)
       .text(`Minimum: ${stats.min.toFixed(2)} m`, 50, doc.y)
       .text(`Maximum: ${stats.max.toFixed(2)} m`, 50, doc.y)
       .text(`Range: ${stats.range.toFixed(2)} m`, 50, doc.y)
       .moveDown();
  }

  // Trend Analysis
  if (reportData.trend) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Trend Analysis', 50, doc.y)
       .moveDown();

    const trend = reportData.trend;
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Direction: ${trend.direction}`, 50, doc.y)
       .text(`Significance: ${trend.significance}`, 50, doc.y)
       .text(`Trend: ${trend.trend.toFixed(4)} m/day`, 50, doc.y)
       .text(`Data Points: ${trend.dataPoints}`, 50, doc.y)
       .moveDown();
  }

  // Period
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Report Period', 50, doc.y)
     .moveDown();

  const period = reportData.period;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Start: ${period.start.toLocaleDateString()}`, 50, doc.y)
     .text(`End: ${period.end.toLocaleDateString()}`, 50, doc.y)
     .text(`Duration: ${period.days} days`, 50, doc.y)
     .moveDown();
}

/**
 * Add summary report content
 */
function addSummaryReportContent(doc, reportData) {
  // System Overview
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('System Overview', 50, doc.y)
     .moveDown();

  const overview = reportData.overview;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Total Stations: ${overview.totalStations}`, 50, doc.y)
     .text(`Active Stations: ${overview.activeStations}`, 50, doc.y)
     .text(`Total Readings: ${overview.totalReadings}`, 50, doc.y)
     .text(`Total Analyses: ${overview.totalAnalyses}`, 50, doc.y)
     .text(`Critical Alerts: ${overview.criticalAlerts}`, 50, doc.y)
     .text(`Average Water Level: ${overview.averageWaterLevel} m`, 50, doc.y)
     .moveDown();

  // System Health
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('System Health', 50, doc.y)
     .moveDown();

  const health = reportData.systemHealth;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Station Uptime: ${health.stationUptime}%`, 50, doc.y)
     .text(`Data Quality: ${health.dataQuality}`, 50, doc.y)
     .text(`Alert Level: ${health.alertLevel}`, 50, doc.y)
     .moveDown();

  // Period
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Report Period', 50, doc.y)
     .moveDown();

  const period = reportData.period;
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Start: ${period.start.toLocaleDateString()}`, 50, doc.y)
     .text(`End: ${period.end.toLocaleDateString()}`, 50, doc.y)
     .text(`Duration: ${period.days} days`, 50, doc.y)
     .moveDown();
}

/**
 * Add generic report content
 */
function addGenericReportContent(doc, reportData) {
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Report Content', 50, doc.y)
     .moveDown();

  doc.fontSize(12)
     .font('Helvetica')
     .text('This report contains groundwater monitoring data and analysis.', 50, doc.y)
     .text(`Report Type: ${reportData.type}`, 50, doc.y)
     .text(`Generated: ${new Date().toLocaleString()}`, 50, doc.y)
     .moveDown();
}

/**
 * Add footer to PDF
 */
function addFooter(doc) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 50;

  // Footer line
  doc.moveTo(50, footerY - 10)
     .lineTo(550, footerY - 10)
     .stroke('#cccccc');

  // Footer text
  doc.fontSize(8)
     .fillColor('#666666')
     .text('Groundwater Detection System - Real-Time Monitoring', 50, footerY)
     .text(`Generated on ${new Date().toLocaleString()}`, 400, footerY);
}

module.exports = {
  generatePDFReport
};
