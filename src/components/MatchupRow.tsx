import React from 'react';
import { 
  getFavoriteInfo, 
  getFavoriteLogo, 
  getAdvantage, 
  getAdvantageLogo, 
  getRankColorClass,
  getOverallAdvantage,
  type Matchup,
  type TeamStats,
  type MatchupRowProps
} from '../functions';
import BettingLean from './BettingLean';



const MatchupRow: React.FC<MatchupRowProps> = ({ matchup, teamStats, logoMappings }) => {
  const team1Stats = teamStats[matchup.Team1];
  const team2Stats = teamStats[matchup.Team2];
  
  const team1Logo = logoMappings[matchup.Team1];
  const team2Logo = logoMappings[matchup.Team2];

  // Get favorite info and logo using utility functions
  const { favoriteTeam, favoriteSpread } = getFavoriteInfo(matchup);
  const favoriteLogo = getFavoriteLogo(favoriteTeam, matchup.Team1, team1Logo, team2Logo);

  if (!team1Stats || !team2Stats) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="matchup-row">
      {/* Header with team logos, names, and betting info */}
      <div className="matchup-header">
        <div className="team-info">
          <img src={team1Logo} alt={matchup.Team1} className="team-logo" />
          <h2 className="team-name">{matchup.Team1}</h2>
          <div className="team1-ml">
            <span className="ml-label">ML</span>
            <span className="ml-value">{matchup.Team1ML}</span>
          </div>
        </div>
        
        <div className="center-info">
          <div className="vs-divider">VS</div>
          <div className="spread-total">
            <div className="spread">
              <span className="label">Spread:</span>
              {favoriteLogo && (
                <img src={favoriteLogo} alt={favoriteTeam} className="inline-logo" />
              )}
              <span className="value">{favoriteSpread}</span>
            </div>
            <div className="total">
              <span className="label">Total:</span>
              <span className="value">{matchup.Total}</span>
            </div>
          </div>
        </div>
        
        <div className="team-info">
          <img src={team2Logo} alt={matchup.Team2} className="team-logo" />
          <h2 className="team-name">{matchup.Team2}</h2>
          <div className="team2-ml">
            <span className="ml-label">ML</span>
            <span className="ml-value">{matchup.Team2ML}</span>
          </div>
        </div>
      </div>

      {/* Strategic Matchup Analysis */}
      <div className="strategic-matchups">
        {/* Team 1 OFFENSE vs Team 2 DEFENSE */}
        <div className="matchup-section">
          <div className="stats-table">
             {/* Header row with just logos and labels */}
             <div className="stat-row header-row">
               <div className="stat-cell team1-offense">
                 <span className="stat-label-header">Offense</span>
                 <img src={team1Logo} alt={matchup.Team1} className="team-header-logo" />
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <span className="stat-label-header">Defense</span>
                 <img src={team2Logo} alt={matchup.Team2} className="team-header-logo" />
               </div>
               <div className="advantage-indicator">
                 <span className="stat-label-header advantage">Advantage</span>
                 {(() => {
                   const overallAdvantage = getOverallAdvantage(team1Stats, team2Stats);
                   const winningLogo = overallAdvantage.winningTeam === 'Team1' ? team1Logo : team2Logo;
                   return (
                     <img src={winningLogo} alt="Overall Advantage" className="team-header-logo advantage" />
                   );
                 })()}
               </div>
             </div>
             
             {/* First stat row */}
             <div className="stat-row">
               <div className="stat-cell team1-offense">
                 <div className="stat-title">Points Per Game</div>
                 <div className="stat-value">{team1Stats.pointsPG}</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.pointsPG_ranking)}`}>#{team1Stats.pointsPG_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <div className="stat-title">Points Allowed</div>
                 <div className="stat-value">{team2Stats.pointsAllowed}</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.pointsAllowed_ranking)}`}>#{team2Stats.pointsAllowed_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team1Stats.pointsPG_ranking, team2Stats.pointsAllowed_ranking, team1Logo, team2Logo) && (
                   <img 
                     src={getAdvantageLogo(team1Stats.pointsPG_ranking, team2Stats.pointsAllowed_ranking, team1Logo, team2Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
            
             <div className="stat-row">
               <div className="stat-cell team1-offense">
                 <div className="stat-title">Passing Yards</div>
                 <div className="stat-value">{team1Stats.passYards}</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.passYards_ranking)}`}>#{team1Stats.passYards_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <div className="stat-title">Passing Yards Allowed</div>
                 <div className="stat-value">{team2Stats.passYardsAllowed}</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.passYardsAllowed_ranking)}`}>#{team2Stats.passYardsAllowed_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team1Stats.passYards_ranking, team2Stats.passYardsAllowed_ranking, team1Logo, team2Logo) && (
                   <img 
                     src={getAdvantageLogo(team1Stats.passYards_ranking, team2Stats.passYardsAllowed_ranking, team1Logo, team2Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
             
             <div className="stat-row">
               <div className="stat-cell team1-offense">
                 <div className="stat-title">Rushing Yards</div>
                 <div className="stat-value">{team1Stats.rushYards}</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.rushYards_ranking)}`}>#{team1Stats.rushYards_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <div className="stat-title">Rushing Yards Allowed</div>
                 <div className="stat-value">{team2Stats.rushYardsAllowed}</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.rushYardsAllowed_ranking)}`}>#{team2Stats.rushYardsAllowed_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team1Stats.rushYards_ranking, team2Stats.rushYardsAllowed_ranking, team1Logo, team2Logo) && (
                   <img 
                     src={getAdvantageLogo(team1Stats.rushYards_ranking, team2Stats.rushYardsAllowed_ranking, team1Logo, team2Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
             
             <div className="stat-row">
               <div className="stat-cell team1-offense">
                 <div className="stat-title">3rd Down Conversion %</div>
                 <div className="stat-value">{team1Stats.thirdOffense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.thirdOffense_ranking)}`}>#{team1Stats.thirdOffense_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <div className="stat-title">3rd Down Defense %</div>
                 <div className="stat-value">{team2Stats.thirdDefense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.thirdDefense_ranking)}`}>#{team2Stats.thirdDefense_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team1Stats.thirdOffense_ranking, team2Stats.thirdDefense_ranking, team1Logo, team2Logo) && (
                   <img 
                     src={getAdvantageLogo(team1Stats.thirdOffense_ranking, team2Stats.thirdDefense_ranking, team1Logo, team2Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
             
             <div className="stat-row">
               <div className="stat-cell team1-offense">
                 <div className="stat-title">Red Zone Conversion %</div>
                 <div className="stat-value">{team1Stats.redzoneOffense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.redzoneOffense_ranking)}`}>#{team1Stats.redzoneOffense_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <div className="stat-title">Red Zone Defense %</div>
                 <div className="stat-value">{team2Stats.redzoneDefense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.redzoneDefense_ranking)}`}>#{team2Stats.redzoneDefense_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team1Stats.redzoneOffense_ranking, team2Stats.redzoneDefense_ranking, team1Logo, team2Logo) && (
                   <img 
                     src={getAdvantageLogo(team1Stats.redzoneOffense_ranking, team2Stats.redzoneDefense_ranking, team1Logo, team2Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
          </div>
        </div>

        {/* Team 2 OFFENSE vs Team 1 DEFENSE */}
        <div className="matchup-section">
          <div className="stats-table">
             {/* Header row with just logos and labels */}
             <div className="stat-row header-row">
               <div className="stat-cell team2-offense">
                 <span className="stat-label-header">Offense</span>
                 <img src={team2Logo} alt={matchup.Team2} className="team-header-logo" />
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <span className="stat-label-header">Defense</span>
                 <img src={team1Logo} alt={matchup.Team1} className="team-header-logo" />
               </div>
               <div className="advantage-indicator">
                 <span className="stat-label-header advantage">Advantage</span>
                 {(() => {
                   const overallAdvantage = getOverallAdvantage(team2Stats, team1Stats);
                   const winningLogo = overallAdvantage.winningTeam === 'Team2' ? team2Logo : team1Logo;
                   return (
                     <img src={winningLogo} alt="Overall Advantage" className="team-header-logo advantage" />
                   );
                 })()}
               </div>
             </div>
             
             {/* First stat row */}
             <div className="stat-row">
               <div className="stat-cell team2-offense">
                 <div className="stat-title">Points Per Game</div>
                 <div className="stat-value">{team2Stats.pointsPG}</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.pointsPG_ranking)}`}>#{team2Stats.pointsPG_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team1-defense">
                 <div className="stat-title">Points Allowed</div>
                 <div className="stat-value">{team1Stats.pointsAllowed}</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.pointsAllowed_ranking)}`}>#{team1Stats.pointsAllowed_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team2Stats.pointsPG_ranking, team1Stats.pointsAllowed_ranking, team2Logo, team1Logo) && (
                   <img 
                     src={getAdvantageLogo(team2Stats.pointsPG_ranking, team1Stats.pointsAllowed_ranking, team2Logo, team1Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
            
             <div className="stat-row">
               <div className="stat-cell team2-offense">
                 <div className="stat-title">Passing Yards</div>
                 <div className="stat-value">{team2Stats.passYards}</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.passYards_ranking)}`}>#{team2Stats.passYards_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team1-defense">
                 <div className="stat-title">Passing Yards Allowed</div>
                 <div className="stat-value">{team1Stats.passYardsAllowed}</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.passYardsAllowed_ranking)}`}>#{team1Stats.passYardsAllowed_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team2Stats.passYards_ranking, team1Stats.passYardsAllowed_ranking, team2Logo, team1Logo) && (
                   <img 
                     src={getAdvantageLogo(team2Stats.passYards_ranking, team1Stats.passYardsAllowed_ranking, team2Logo, team1Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
             
             <div className="stat-row">
               <div className="stat-cell team2-offense">
                 <div className="stat-title">Rushing Yards</div>
                 <div className="stat-value">{team2Stats.rushYards}</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.rushYards_ranking)}`}>#{team2Stats.rushYards_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team1-defense">
                 <div className="stat-title">Rushing Yards Allowed</div>
                 <div className="stat-value">{team1Stats.rushYardsAllowed}</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.rushYardsAllowed_ranking)}`}>#{team1Stats.rushYardsAllowed_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team2Stats.rushYards_ranking, team1Stats.rushYardsAllowed_ranking, team2Logo, team1Logo) && (
                   <img 
                     src={getAdvantageLogo(team2Stats.rushYards_ranking, team1Stats.rushYardsAllowed_ranking, team2Logo, team1Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
             
             <div className="stat-row">
               <div className="stat-cell team2-offense">
                 <div className="stat-title">3rd Down Conversion %</div>
                 <div className="stat-value">{team2Stats.thirdOffense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.thirdOffense_ranking)}`}>#{team2Stats.thirdOffense_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team1-defense">
                 <div className="stat-title">3rd Down Defense %</div>
                 <div className="stat-value">{team1Stats.thirdDefense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.thirdDefense_ranking)}`}>#{team1Stats.thirdDefense_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team2Stats.thirdOffense_ranking, team1Stats.thirdDefense_ranking, team2Logo, team1Logo) && (
                   <img 
                     src={getAdvantageLogo(team2Stats.thirdOffense_ranking, team1Stats.thirdDefense_ranking, team2Logo, team1Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
             
             <div className="stat-row">
               <div className="stat-cell team2-offense">
                 <div className="stat-title">Red Zone Conversion %</div>
                 <div className="stat-value">{team2Stats.redzoneOffense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team2Stats.redzoneOffense_ranking)}`}>#{team2Stats.redzoneOffense_ranking}</div>
               </div>
               <div className="vs-divider">VS</div>
               <div className="stat-cell team2-defense">
                 <div className="stat-title">Red Zone Defense %</div>
                 <div className="stat-value">{team1Stats.redzoneDefense}%</div>
                 <div className={`stat-rank ${getRankColorClass(team1Stats.redzoneDefense_ranking)}`}>#{team1Stats.redzoneDefense_ranking}</div>
               </div>
               <div className="advantage-indicator">
                 <div className="advantage-text">Advantage</div>
                 {getAdvantageLogo(team2Stats.redzoneOffense_ranking, team1Stats.redzoneDefense_ranking, team2Logo, team1Logo) && (
                   <img 
                     src={getAdvantageLogo(team2Stats.redzoneOffense_ranking, team1Stats.redzoneDefense_ranking, team2Logo, team1Logo)} 
                     alt="Advantage" 
                     className="advantage-logo" 
                   />
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Betting Lean Component */}
      <BettingLean 
        matchup={matchup}
        teamStats={teamStats}
        logoMappings={logoMappings}
      />
    </div>
  );
};

export default MatchupRow;