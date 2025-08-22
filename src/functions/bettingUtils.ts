import { Matchup, FavoriteInfo } from './types';

/**
 * Determines the favorite team and spread based on moneyline values
 * Negative ML indicates the favorite team
 */
export const getFavoriteInfo = (matchup: Matchup): FavoriteInfo => {
  // Determine favorite based on ML value (negative ML = favorite)
  let favoriteTeam = '';
  let favoriteSpread = '';
  
  if (parseFloat(matchup.Team1ML) < 0) {
    favoriteTeam = matchup.Team1;
    favoriteSpread = matchup.Team1Spread;
  } else if (parseFloat(matchup.Team2ML) < 0) {
    favoriteTeam = matchup.Team2;
    favoriteSpread = matchup.Team2Spread;
  }
  
  return { favoriteTeam, favoriteSpread };
};

/**
 * Gets the logo for the favorite team
 */
export const getFavoriteLogo = (
  favoriteTeam: string, 
  team1: string, 
  team1Logo: string, 
  team2Logo: string
): string => {
  return favoriteTeam === team1 ? team1Logo : team2Logo;
};
