import React from 'react';

interface AIAnalysisProps {
  analysis: string;
  isLoading: boolean;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="ai-analysis">
        <div className="ai-label">AI Analysis:</div>
        <div className="ai-content">
          <div className="loading-spinner">Generating analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-analysis">
      <div className="ai-label">AI Analysis:</div>
      <div className="ai-content">
        <p className="ai-text">{analysis}</p>
      </div>
    </div>
  );
};

export default AIAnalysis;
