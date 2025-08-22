import React from 'react';
import ReactDOM from 'react-dom/client';
import NCAAFImage from './components/NCAAFImage';
import './styles/NCAAFImage.css';

// Sample data for development
const sampleMatchups = [
  {
    Team1: "Kansas State",
    Team2: "Iowa State",
    Team1Spread: "-3",
    Team2Spread: "+3",
    Total: "49.5",
    Favorite: "Kansas State",
    Team1ML: "-148",
    Team2ML: "+124"
  }
];

const sampleTeamStats = {
  "Kansas State": {
    O_Score: null,
    D_Score: null,
    pointsPG: 30.0,
    pointsAllowed: 24.8,
    pace: 66.4,
    pace_ranking: 89,
    passYards: 215.2,
    passYards_ranking: 78,
    passYardsAllowed: 235.3,
    passYardsAllowed_ranking: 85,
    rushYards: 210.2,
    rushYards_ranking: 12,
    rushYardsAllowed: 125.6,
    rushYardsAllowed_ranking: 30,
    thirdOffense: 41.25,
    thirdOffense_ranking: 52,
    thirdDefense: 38.04,
    thirdDefense_ranking: 53,
    redzoneOffense: 86.67,
    redzoneOffense_ranking: 49,
    redzoneDefense: 82.5,
    redzoneDefense_ranking: 58,
    pointsPG_ranking: 41,
    pointsAllowed_ranking: 56,
    scheduleStrength: 27,
    scheduleStrength_ranking: 7
  },
  "Iowa State": {
    O_Score: null,
    D_Score: null,
    pointsPG: 31.8,
    pointsAllowed: 24.5,
    pace: 73.5,
    pace_ranking: 16,
    passYards: 254.8,
    passYards_ranking: 37,
    passYardsAllowed: 169.0,
    passYardsAllowed_ranking: 3,
    rushYards: 166.2,
    rushYards_ranking: 53,
    rushYardsAllowed: 189.5,
    rushYardsAllowed_ranking: 105,
    thirdOffense: 42.33,
    thirdOffense_ranking: 42,
    thirdDefense: 37.8,
    thirdDefense_ranking: 52,
    redzoneOffense: 84.91,
    redzoneOffense_ranking: 60,
    redzoneDefense: 87.5,
    redzoneDefense_ranking: 98,
    pointsPG_ranking: 31,
    pointsAllowed_ranking: 52,
    scheduleStrength: 29,
    scheduleStrength_ranking: 7
  }
};

const sampleLogoMappings = {
  "Kansas State": "https://example.com/kstate-logo.png",
  "Iowa State": "https://example.com/isu-logo.png"
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NCAAFImage 
      matchups={sampleMatchups}
      teamStats={sampleTeamStats}
      logoMappings={sampleLogoMappings}
    />
  </React.StrictMode>
);
