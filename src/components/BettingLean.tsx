import React, { useState, useEffect } from 'react';
import { getBettingLean, generateBettingAnalysis, type Matchup, type TeamStats } from '../functions';
import AIAnalysis from './AIAnalysis';

// Debug imports
console.log('🔍 Import check:', {
  getBettingLean: typeof getBettingLean,
  generateBettingAnalysis: typeof generateBettingAnalysis
});

interface BettingLeanProps {
  matchup: Matchup;
  teamStats: Record<string, TeamStats>;
  logoMappings: { [key: string]: string };
}

const BettingLean: React.FC<BettingLeanProps> = ({ matchup, teamStats, logoMappings }) => {
  console.log('🎬 BettingLean component rendering');
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  console.log('🔧 State values:', { aiAnalysis, isLoading });
  
  const team1Stats = teamStats[matchup.Team1];
  const team2Stats = teamStats[matchup.Team2];
  
  if (!team1Stats || !team2Stats) {
    console.log('❌ Missing team stats, returning null');
    return null;
  }

  const bettingLean = getBettingLean(team1Stats, team2Stats, matchup, logoMappings);
  console.log('🎯 Betting lean calculated:', { leanType: bettingLean.leanType, leanTeam: bettingLean.leanTeam });
  
  const team1Logo = logoMappings[matchup.Team1];
  const team2Logo = logoMappings[matchup.Team2];

  if (!bettingLean) {
    console.log('❌ No betting lean, returning null');
    return null;
  }

  // Generate AI analysis when component mounts
  console.log('🔧 useEffect dependencies check:', {
    matchupExists: !!matchup,
    team1StatsExists: !!team1Stats,
    team2StatsExists: !!team2Stats,
    bettingLeanExists: !!bettingLean,
    dependencyArray: [matchup, team1Stats, team2Stats, bettingLean]
  });
  
  useEffect(() => {
    console.log('🔄 BettingLean useEffect triggered');
    console.log('🔍 Dependencies in useEffect:', {
      matchup: matchup?.Team1 + ' vs ' + matchup?.Team2,
      team1Stats: team1Stats ? 'Present' : 'Missing',
      team2Stats: team2Stats ? 'Present' : 'Missing',
      bettingLean: bettingLean?.leanType
    });

    const generateAnalysis = async () => {
      console.log('🚀 Starting AI analysis generation...');
      setIsLoading(true);
      try {
        console.log('📞 Calling generateBettingAnalysis...');
        console.log('🔍 Function exists:', typeof generateBettingAnalysis);
        console.log('📋 Function name:', generateBettingAnalysis.name);
        const analysis = await generateBettingAnalysis(matchup, team1Stats, team2Stats, bettingLean);
        console.log('✅ AI analysis received:', analysis);
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('💥 Error generating AI analysis:', error);
        setAiAnalysis('AI analysis temporarily unavailable');
      } finally {
        console.log('🏁 Setting loading to false');
        setIsLoading(false);
      }
    };

    console.log('🎯 About to call generateAnalysis()');
    generateAnalysis();
  }, [matchup, team1Stats, team2Stats, bettingLean]);

  console.log('🎨 Rendering with aiAnalysis:', aiAnalysis ? 'Present' : 'Empty', 'isLoading:', isLoading);
  
  return (
    <>
      {/* AI Analysis Component */}
      <AIAnalysis analysis={aiAnalysis} isLoading={isLoading} />
      
      {/* Betting Lean Component */}
      <div className="betting-lean">
        <div className="lean-label">Lean:</div>
        
        {bettingLean.leanType === 'spread' && (
          <div className="lean-content spread-lean">
            <img src={bettingLean.leanTeam === 'Team1' ? team1Logo : team2Logo} alt="Lean Team" className="lean-logo" />
            <span className="lean-value">{bettingLean.spread}</span>
          </div>
        )}
        
        {(bettingLean.leanType === 'over' || bettingLean.leanType === 'under') && (
          <div className="lean-content total-lean">
            <img src={team1Logo} alt={matchup.Team1} className="lean-logo" />
            <img src={team2Logo} alt={matchup.Team2} className="lean-logo" />
            <span className="lean-direction">{bettingLean.leanType.toUpperCase()}</span>
            <span className="lean-value">{bettingLean.total}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default BettingLean;
