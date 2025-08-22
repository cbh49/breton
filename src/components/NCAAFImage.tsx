import React from 'react';
import MatchupRow from './MatchupRow';
import { type Matchup, type TeamStats } from '../functions/types';

interface NCAAFImageProps {
  matchups: Matchup[];
  teamStats: Record<string, TeamStats>;
  logoMappings: Record<string, string>;
  aiAnalysisData?: Record<string, string>;
}

const NCAAFImage: React.FC<NCAAFImageProps> = ({ matchups, teamStats, logoMappings }) => {
  // For now, just show the first matchup
  const matchup = matchups[0];
  
  if (!matchup) {
    return <div>No matchups available</div>;
  }

  return (
    <div className="ncaaf-image">
      {/* Header */}
      <div className="header">
        <h1 className="main-title">NCAAF Matchup Analysis</h1>
        <p className="subtitle">Comprehensive Team Statistics & Betting Odds</p>
      </div>

      {/* Single Matchup Row - Much Larger */}
      <div className="single-matchup-container">
        <MatchupRow 
          matchup={matchup}
          teamStats={teamStats}
          logoMappings={logoMappings}
          aiAnalysis={matchup.aiAnalysis || 'AI analysis unavailable'}
        />
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-color advantage"></span>
          <span>Team Advantage</span>
        </div>
        <div className="legend-item">
          <span className="legend-color rank-1-10"></span>
          <span>Rank 1-10</span>
        </div>
        <div className="legend-item">
          <span className="legend-color rank-11-50"></span>
          <span>Rank 25-50</span>
        </div>
        <div className="legend-item">
          <span className="legend-color rank-51-100"></span>
          <span>Rank 51-100</span>
        </div>
        <div className="legend-item">
          <span className="legend-color rank-101-134"></span>
          <span>Rank 101-134</span>
        </div>
      </div>
    </div>
  );
};

export default NCAAFImage;
