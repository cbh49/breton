/**
 * Generates AI analysis for betting lean using OpenAI API
 */
export const generateBettingAnalysis = async (
  matchup: any,
  team1Stats: any,
  team2Stats: any,
  bettingLean: any
): Promise<string> => {
  console.log('🔍 generateBettingAnalysis called');

  try {
    console.log('🔑 API key:', process.env.REACT_APP_OPENAI_API_KEY ? 'Present' : 'Missing');
    
    const prompt = `Based on the following NCAA football matchup data, write exactly 4 sentences explaining why the betting lean is ${bettingLean.leanType === 'spread' ? `on ${bettingLean.leanTeam === 'Team1' ? 'Team1' : 'Team2'} with spread ${bettingLean.spread}` : `${bettingLean.leanType.toUpperCase()} ${bettingLean.total}`}.

Matchup: ${matchup.Team1} vs ${matchup.Team2}
Spread: ${matchup.Team1Spread} / ${matchup.Team2Spread}
Total: ${matchup.Total}
Team1 Moneyline: ${matchup.Team1ML}
Team2 Moneyline: ${matchup.Team2ML}

Team1 (${matchup.Team1}) Stats:
- Points Per Game: ${team1Stats.pointsPG} (Rank: #${team1Stats.pointsPG_ranking})
- Passing Yards: ${team1Stats.passYards} (Rank: #${team1Stats.passYards_ranking})
- Rushing Yards: ${team1Stats.rushYards} (Rank: #${team1Stats.rushYards_ranking})
- 3rd Down Conversion: ${team1Stats.thirdOffense}% (Rank: #${team1Stats.thirdOffense_ranking})
- Red Zone Conversion: ${team1Stats.redzoneOffense}% (Rank: #${team1Stats.redzoneOffense_ranking})
- Points Allowed: ${team1Stats.pointsAllowed} (Rank: #${team1Stats.pointsAllowed_ranking})
- Passing Yards Allowed: ${team1Stats.passYardsAllowed} (Rank: #${team1Stats.passYardsAllowed_ranking})
- Rushing Yards Allowed: ${team1Stats.rushYardsAllowed} (Rank: #${team1Stats.rushYardsAllowed_ranking})
- 3rd Down Defense: ${team1Stats.thirdDefense}% (Rank: #${team1Stats.thirdDefense_ranking})
- Red Zone Defense: ${team1Stats.redzoneDefense}% (Rank: #${team1Stats.redzoneDefense_ranking})

Team2 (${matchup.Team2}) Stats:
- Points Per Game: ${team2Stats.pointsPG} (Rank: #${team2Stats.pointsPG_ranking})
- Passing Yards: ${team2Stats.passYards} (Rank: #${team2Stats.passYards_ranking})
- Rushing Yards: ${team2Stats.rushYards} (Rank: #${team2Stats.rushYards_ranking})
- 3rd Down Conversion: ${team2Stats.thirdOffense}% (Rank: #${team2Stats.thirdOffense_ranking})
- Red Zone Conversion: ${team2Stats.redzoneOffense}% (Rank: #${team2Stats.redzoneOffense_ranking})
- Points Allowed: ${team2Stats.pointsAllowed} (Rank: #${team2Stats.pointsAllowed_ranking})
- Passing Yards Allowed: ${team2Stats.passYardsAllowed} (Rank: #${team2Stats.passYardsAllowed_ranking})
- Rushing Yards Allowed: ${team2Stats.rushYardsAllowed} (Rank: #${team2Stats.rushYardsAllowed_ranking})
- 3rd Down Defense: ${team2Stats.thirdDefense}% (Rank: #${team2Stats.thirdDefense_ranking})
- Red Zone Defense: ${team2Stats.redzoneDefense}% (Rank: #${team2Stats.redzoneDefense_ranking})

Write exactly 4 sentences explaining the betting lean based on this statistical data.`;

    console.log('📝 Generated prompt (length:', prompt.length, 'chars)');

    const requestBody = {
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    };

    console.log('🚀 Making API request...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received');
    
    const analysis = data.choices[0]?.message?.content || 'Unable to generate analysis';
    console.log('🎯 Analysis length:', analysis.length, 'chars');
    
    return analysis;
  } catch (error) {
    console.error('💥 Error generating AI analysis:', error);
    return 'AI analysis temporarily unavailable';
  }
};
