import React, { useState } from 'react';
import '../src/ReportGenerate.css';

function ReportPage() {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the server-side API endpoint — OpenAI key is NOT exposed to browser
      const response = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err) {
      console.error('Report generation error:', err);
      setError('Failed to generate report. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="report-page">
      <h1>Forum Report Generator</h1>
      <button
        onClick={handleGenerateReport}
        disabled={isLoading}
        className="generate-button"
      >
        {isLoading ? 'Generating...' : 'Generate Report'}
      </button>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {report && (
        <div className="report-container">
          <h2>Forum Summary Report</h2>
          <div className="report-content">
            {report.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportPage;
