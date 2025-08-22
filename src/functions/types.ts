export interface Matchup {
  Team1: string;
  Team2: string;
  Team1Spread: string;
  Team2Spread: string;
  Team1SpreadHandle?: string;
  Team1SpreadBets?: string;
  Team2SpreadHandle?: string;
  Team2SpreadBets?: string;
  Total: string;
  Team1TotalHandle?: string;
  Team1TotalBets?: string;
  Team2TotalHandle?: string;
  Team2TotalBets?: string;
  Team1ML: string;
  Team2ML: string;
  aiAnalysis?: string;
}

export interface TeamStats {
  O_Score: null;
  D_Score: null;
  pointsPG: number;
  pointsAllowed: number;
  pace: number;
  pace_ranking: number;
  passYards: number;
  passYards_ranking: number;
  passYardsAllowed: number;
  passYardsAllowed_ranking: number;
  rushYards: number;
  rushYards_ranking: number;
  rushYardsAllowed: number;
  rushYardsAllowed_ranking: number;
  thirdOffense: number;
  thirdOffense_ranking: number;
  thirdDefense: number;
  thirdDefense_ranking: number;
  redzoneOffense: number;
  redzoneOffense_ranking: number;
  redzoneDefense: number;
  redzoneDefense_ranking: number;
  pointsPG_ranking: number;
  pointsAllowed_ranking: number;
  scheduleStrength: number;
  scheduleStrength_ranking: number;
}

export interface FavoriteInfo {
  favoriteTeam: string;
  favoriteSpread: string;
}

export interface MatchupRowProps {
  matchup: Matchup;
  teamStats: Record<string, TeamStats>;
  logoMappings: Record<string, string>;
  aiAnalysis?: string;
}
