/**
 * Determines which team has the advantage based on ranking comparison
 * Lower rank number = better performance = advantage
 */
export const getAdvantage = (
  team1OffenseRank: number, 
  team2DefenseRank: number, 
  team1: string, 
  team2: string
): string => {
  return team1OffenseRank < team2DefenseRank ? team1 : team2;
};

/**
 * Gets the logo for the team with the advantage
 */
export const getAdvantageLogo = (
  team1OffenseRank: number, 
  team2DefenseRank: number, 
  team1Logo: string, 
  team2Logo: string
): string => {
  return team1OffenseRank < team2DefenseRank ? team1Logo : team2Logo;
};

/**
 * Returns the appropriate CSS class for rank color coding
 * Based on rank performance tiers
 */
export const getRankColorClass = (rank: number): string => {
  if (rank <= 25) return 'rank-1-10';     // Green - Elite
  if (rank <= 50) return 'rank-11-50';    // Yellow - Good
  if (rank <= 100) return 'rank-51-100';  // Orange - Average
  return 'rank-101-134';                  // Red - Below Average
};

/**
 * Counts the number of advantages for each team in a matchup
 * Returns the team with more advantages and their advantage count
 */
export const getOverallAdvantage = (
  team1Stats: any,
  team2Stats: any
): { winningTeam: string; team1Advantages: number; team2Advantages: number } => {
  let team1Advantages = 0;
  let team2Advantages = 0;

  // Compare all 5 statistics
  // Points
  if (team1Stats.pointsPG_ranking < team2Stats.pointsAllowed_ranking) {
    team1Advantages++;
  } else {
    team2Advantages++;
  }

  // Passing Yards
  if (team1Stats.passYards_ranking < team2Stats.passYardsAllowed_ranking) {
    team1Advantages++;
  } else {
    team2Advantages++;
  }

  // Rushing Yards
  if (team1Stats.rushYards_ranking < team2Stats.rushYardsAllowed_ranking) {
    team1Advantages++;
  } else {
    team2Advantages++;
  }

  // 3rd Down Conversion
  if (team1Stats.thirdOffense_ranking < team2Stats.thirdDefense_ranking) {
    team1Advantages++;
  } else {
    team2Advantages++;
  }

  // Red Zone Conversion
  if (team1Stats.redzoneOffense_ranking < team2Stats.redzoneDefense_ranking) {
    team1Advantages++;
  } else {
    team2Advantages++;
  }

  // Determine winner
  if (team1Advantages > team2Advantages) {
    return {
      winningTeam: 'Team1',
      team1Advantages,
      team2Advantages
    };
  } else {
    return {
      winningTeam: 'Team2',
      team1Advantages,
      team2Advantages
    };
  }
};

/**
 * Determines the betting lean based on overall advantages
 * Returns lean type and relevant data for display
 */
export const getBettingLean = (
  team1Stats: any,
  team2Stats: any,
  matchup: any,
  logoMappings: Record<string, string>
): { 
  leanType: 'spread' | 'over' | 'under'; 
  team1Logo: string; 
  team2Logo: string; 
  spread?: string; 
  total?: string;
  leanTeam?: string;
} => {
  const team1OffenseAdvantage = getOverallAdvantage(team1Stats, team2Stats);
  const team2OffenseAdvantage = getOverallAdvantage(team2Stats, team1Stats);
  
  // Get logos from logoMappings
  const team1Logo = logoMappings[matchup.Team1] || '';
  const team2Logo = logoMappings[matchup.Team2] || '';
  
  // Check if one team dominates both offense and defense
  if (team1OffenseAdvantage.winningTeam === 'Team1' && team2OffenseAdvantage.winningTeam === 'Team1') {
    // Team1 wins both offense and defense - lean on spread
    return {
      leanType: 'spread',
      team1Logo,
      team2Logo,
      spread: matchup.Team1Spread,
      leanTeam: 'Team1'
    };
  } else if (team1OffenseAdvantage.winningTeam === 'Team2' && team2OffenseAdvantage.winningTeam === 'Team2') {
    // Team2 wins both offense and defense - lean on spread
    return {
      leanType: 'spread',
      team1Logo,
      team2Logo,
      spread: matchup.Team2Spread,
      leanTeam: 'Team2'
    };
  } else if (team1OffenseAdvantage.winningTeam === 'Team1' && team2OffenseAdvantage.winningTeam === 'Team2') {
    // Team1 offense wins, Team2 offense wins - lean OVER
    return {
      leanType: 'over',
      team1Logo,
      team2Logo,
      total: matchup.Total
    };
  } else {
    // Team2 offense wins, Team1 offense wins - lean UNDER
    return {
      leanType: 'under',
      team1Logo,
      team2Logo,
      total: matchup.Total
    };
  }
};
