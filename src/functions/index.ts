// Type definitions
export type { 
  Matchup, 
  TeamStats, 
  FavoriteInfo, 
  MatchupRowProps 
} from './types';

// Betting-related utilities
export { 
  getFavoriteInfo, 
  getFavoriteLogo 
} from './bettingUtils';

// Stats-related utilities  
export { 
  getAdvantage, 
  getAdvantageLogo, 
  getRankColorClass,
  getOverallAdvantage,
  getBettingLean
} from './statsUtils';

// AI Analysis utilities
export { generateBettingAnalysis } from './aiAnalysis';
