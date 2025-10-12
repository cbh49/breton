import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import BasePlayerPropsTable from '../components/BasePlayerPropsTable';

// Load the data
const rbHistoricalData = JSON.parse(fs.readFileSync(path.join(__dirname, '../json-data/rb_props.json'), 'utf8'));
const teamLogos = JSON.parse(fs.readFileSync(path.join(__dirname, '../logos/nfl-team-logos.json'), 'utf8'));
const playerHeadshots = JSON.parse(fs.readFileSync(path.join(__dirname, '../headshots/players_headshots.json'), 'utf8'));
const teamStats = JSON.parse(fs.readFileSync(path.join(__dirname, '../json-data/teamStats.json'), 'utf8'));

// Load logos as base64
const pikkitLogo = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../public/pikkit.png')).toString('base64')}`;
const draftKingsLogo = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../public/DraftKings.png')).toString('base64')}`;

// Function to get player headshot URL
function getPlayerHeadshot(playerName: string): string | null {
  const headshot = playerHeadshots[playerName];
  console.log(`Looking for headshot for ${playerName}: ${headshot}`);
  return headshot || null;
}

// Function to get opponent team name from abbreviation
function getOpponentTeamName(opponentAbbr: string): string | null {
  const teamMapping: { [key: string]: string } = {
    'NE': 'New England Patriots',
    'IND': 'Indianapolis Colts',
    'NYJ': 'New York Jets',
    'BAL': 'Baltimore Ravens',
    'MIA': 'Miami Dolphins',
    'BUF': 'Buffalo Bills',
    'KC': 'Kansas City Chiefs',
    'DEN': 'Denver Broncos',
    'LV': 'Las Vegas Raiders',
    'LAC': 'Los Angeles Chargers',
    'CIN': 'Cincinnati Bengals',
    'PIT': 'Pittsburgh Steelers',
    'CLE': 'Cleveland Browns',
    'TEN': 'Tennessee Titans',
    'JAX': 'Jacksonville Jaguars',
    'HOU': 'Houston Texans',
    'DAL': 'Dallas Cowboys',
    'PHI': 'Philadelphia Eagles',
    'NYG': 'New York Giants',
    'WAS': 'Washington Commanders',
    'GB': 'Green Bay Packers',
    'MIN': 'Minnesota Vikings',
    'CHI': 'Chicago Bears',
    'DET': 'Detroit Lions',
    'TB': 'Tampa Bay Buccaneers',
    'ATL': 'Atlanta Falcons',
    'CAR': 'Carolina Panthers',
    'NO': 'New Orleans Saints',
    'ARI': 'Arizona Cardinals',
    'LAR': 'Los Angeles Rams',
    'SEA': 'Seattle Seahawks',
    'SF': 'San Francisco 49ers'
  };
  return teamMapping[opponentAbbr] || null;
}

// Function to calculate matchup grade for RB stats
function calculateMatchupGrade(statType: string, trend: string, opponentAbbr: string): string {
  const opponentTeamName = getOpponentTeamName(opponentAbbr);
  if (!opponentTeamName || !teamStats[opponentTeamName]) {
    return 'A'; // Default grade if opponent not found
  }

  const opponentStats = teamStats[opponentTeamName];
  let ranking: number;

  // Get the appropriate ranking based on RB stat type
  if (statType === 'rush_yards') {
    ranking = opponentStats.rush_yards_allowed_per_game_ranking;
  } else if (statType === 'long_rush') {
    ranking = opponentStats.rush_yards_allowed_per_game_ranking;
  } else if (statType === 'rushrec') {
    // For rush+rec yards, average rush yards allowed and pass yards allowed rankings
    const rushRanking = opponentStats.rush_yards_allowed_per_game_ranking;
    const passRanking = opponentStats.pass_yards_allowed_per_game_ranking;
    ranking = Math.round((rushRanking + passRanking) / 2);
  } else {
    return 'A'; // Default grade for unknown stat types
  }

  // Different grading scales for OVER vs UNDER
  if (trend === 'UNDER') {
    // For UNDER bets, better defense = better matchup
    if (ranking <= 5) return 'A';   // Best defense (1-5)
    if (ranking <= 12) return 'B';   // Good defense (6-12)
    if (ranking <= 20) return 'C';   // Average defense (13-20)
    if (ranking <= 27) return 'D';   // Bad defense (21-27)
    return 'F'; // Worst defense (28-32)
  } else {
    // For OVER bets, worse defense = better matchup (inverted)
    if (ranking >= 28) return 'A'; // Worst defense (28-32) = best matchup for OVER
    if (ranking >= 21) return 'B'; // Bad defense (21-27) = good matchup for OVER
    if (ranking >= 13) return 'C'; // Average defense (13-20) = average matchup for OVER
    if (ranking >= 6) return 'D';  // Good defense (6-12) = bad matchup for OVER
    return 'F'; // Best defense (1-5) = worst matchup for OVER
  }
}

function transformData(): any[] {
  const transformedData: any[] = [];

  rbHistoricalData.forEach((player: any) => {
    // Get team and opponent logos
    const teamLogo = teamLogos[player.team]?.logo_url;
    const opponentTeam = player.current_opponent || player.opponent[0]; // Use current opponent if available
    const opponentLogo = (Object.values(teamLogos) as any[]).find((team: any) => 
      team.abbr === opponentTeam
    )?.logo_url;
    
    // Get player headshot
    const playerHeadshot = getPlayerHeadshot(player.name);

    // Create a row for each stat that has a trend
    const statsToCheck = [
      {
        key: 'rushrec',
        line: player.rushrec_line,
        trend: player.rushrec_trend,
        odds: player.rushrec_trend === 'UNDER' ? player.rushrec_under : player.rushrec_over,
        values: player.rushrec_yards,
        rate: player.rushrec_rate,
        label: 'Rush+Rec Yards'
      },
      {
        key: 'rush_yards',
        line: player.rush_yards_line,
        trend: player.rush_yards_trend,
        odds: player.rush_yards_trend === 'UNDER' ? player.rush_yards_under : player.rush_yards_over,
        values: player.rush_yards,
        rate: player.rush_yards_rate,
        label: 'Rush Yards'
      },
      {
        key: 'long_rush',
        line: player.long_rush_line,
        trend: player.long_rush_trend,
        odds: player.long_rush_trend === 'UNDER' ? player.long_rush_under : player.long_rush_over,
        values: player.longest_rush,
        rate: player.long_rush_rate,
        label: 'Longest Rush'
      }
    ];

    statsToCheck.forEach(stat => {
      if (stat.trend && stat.line !== undefined) {
        // Calculate matchup grade
        const matchupGrade = calculateMatchupGrade(stat.key, stat.trend, opponentTeam);
        
        // Filter out D and F grades
        if (matchupGrade === 'D' || matchupGrade === 'F' || matchupGrade === 'C') {
          return; // Skip this player
        }
          transformedData.push({
            name: player.name,
            team: player.team,
            opponent: opponentTeam,
            current_opponent: player.current_opponent || opponentTeam,
            line: stat.line,
            stat: stat.label,
            overUnder: stat.trend,
            odds: stat.odds || 0,
            rate: stat.rate,
            opponents: player.opponent, // Changed from years to opponents
            statValues: stat.values,
            teamLogo: teamLogo,
            opponentLogo: opponentLogo,
            playerHeadshot: playerHeadshot,
            matchupGrade: matchupGrade
          });
      }
    });
  });

  return transformedData;
}

async function generateImage() {
  const data = transformData();
  
  // Copy pikkit.png to scripts directory for image generation
  const pikkitSourcePath = path.join(__dirname, '../public/pikkit.png');
  const pikkitDestPath = path.join(__dirname, 'pikkit.png');
  fs.copyFileSync(pikkitSourcePath, pikkitDestPath);
  
  // Render the React component to HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NFL Runningback Props</title>
      <style>
        @font-face {
          font-family: 'VTFRedzone';
          src: url('data:font/truetype;base64,${fs.readFileSync(path.join(__dirname, '../VTFRedzone-Classic.ttf')).toString('base64')}') format('truetype');
        }
        body {
          margin: 0;
          padding: 20px;
          font-family: 'VTFRedzone', Arial, sans-serif;
          background-color: #0a0a0a;
          color: white;
        }
      </style>
    </head>
    <body>
      <div id="root">
        ${ReactDOMServer.renderToString(
          React.createElement(BasePlayerPropsTable, {
            data: data,
            title: "NFL RUSHING PROPS",
            subtitle: "Recent game trends",
            pikkitLogo: pikkitLogo,
            draftKingsLogo: draftKingsLogo
          })
        )}
      </div>
    </body>
    </html>
  `;

  // Launch browser and take screenshot
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  await page.setViewport({ width: 2400, height: 2400 });
  
  // Wait for images to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: path.join(outputDir, 'runningback-props-react.png') as `${string}.png`,
    type: 'png',
    fullPage: false
  });

  await browser.close();
  console.log('Runningback props image generated successfully using React component!');
}

// Run the script
generateImage().catch(console.error);
