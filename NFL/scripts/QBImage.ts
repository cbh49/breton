import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import BasePlayerPropsTable from '../components/BasePlayerPropsTable';

// Load the data
const qbHistoricalData = JSON.parse(fs.readFileSync(path.join(__dirname, '../json-data/qb_props.json'), 'utf8'));
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

// Function to calculate matchup grade for QB stats
function calculateMatchupGrade(statType: string, trend: string, opponent: string): string {
  // Check if opponent is already a full team name or abbreviation
  let opponentTeamName: string | null;
  if (opponent.length > 3) {
    // Likely a full team name like "Buffalo Bills"
    opponentTeamName = opponent;
  } else {
    // Likely an abbreviation like "BUF"
    opponentTeamName = getOpponentTeamName(opponent);
  }
  
  if (!opponentTeamName || !teamStats[opponentTeamName]) {
    return 'A'; // Default grade if opponent not found
  }

  const opponentStats = teamStats[opponentTeamName];
  let ranking: number;

  // Get the appropriate ranking based on QB stat type
  if (statType === 'completions') {
    ranking = opponentStats.completions_allowed_per_game_ranking;
  } else if (statType === 'pass_attempts') {
    ranking = opponentStats.pass_attempts_allowed_per_game_ranking;
  } else if (statType === 'pass_yards') {
    ranking = opponentStats.pass_yards_allowed_per_game_ranking;
  } else if (statType === 'pass_touchdowns') {
    ranking = opponentStats.pass_touchdowns_allowed_per_game_ranking;
  } else if (statType === 'interceptions') {
    ranking = opponentStats.interceptions_per_game_ranking;
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

  qbHistoricalData.forEach((player: any) => {
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
        key: 'completions',
        line: player.completions_line,
        trend: player.completions_trend,
        odds: player.completions_trend === 'UNDER' ? player.completions_under : player.completions_over,
        values: player.pass_completions,
        rate: player.completions_rate,
        label: 'Completions'
      },
      {
        key: 'pass_attempts',
        line: player.pass_attempts_line,
        trend: player.pass_attempts_trend,
        odds: player.pass_attempts_trend === 'UNDER' ? player.pass_attempts_under : player.pass_attempts_over,
        values: player.pass_attempts,
        rate: player.pass_attempts_rate,
        label: 'Pass Attempts'
      },
      {
        key: 'pass_yards',
        line: player.pass_yards_line,
        trend: player.pass_yards_trend,
        odds: player.pass_yards_trend === 'UNDER' ? player.pass_yards_under : player.pass_yards_over,
        values: player.pass_yards,
        rate: player.pass_yards_rate,
        label: 'Pass Yards'
      },
      {
        key: 'pass_touchdowns',
        line: player.pass_touchdowns_line,
        trend: player.pass_touchdowns_trend,
        odds: player.pass_touchdowns_trend === 'UNDER' ? player.pass_touchdowns_under : player.pass_touchdowns_over,
        values: player.pass_touchdowns,
        rate: player.pass_touchdowns_rate,
        label: 'Pass TDs'
      },
      {
        key: 'interceptions',
        line: player.interceptions_line,
        trend: player.interceptions_trend,
        odds: player.interceptions_trend === 'UNDER' ? player.interceptions_under : player.interceptions_over,
        values: player.interceptions,
        rate: player.interceptions_rate,
        label: 'Interceptions'
      }
    ];

    statsToCheck.forEach(stat => {
      if (stat.trend && stat.line !== undefined) {
        // Calculate matchup grade
        const matchupGrade = calculateMatchupGrade(stat.key, stat.trend, opponentTeam);
        
        // Filter out players with D or F grades
        if (matchupGrade === 'D' || matchupGrade === 'F') {
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
          opponents: player.opponent,
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
      <title>NFL Quarterback Props</title>
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
            title: "NFL QUARTERBACK PROPS",
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
    path: path.join(outputDir, 'quarterback-props-react.png') as `${string}.png`,
    type: 'png',
    fullPage: false
  });

  await browser.close();
  console.log('Quarterback props image generated successfully using React component!');
}

// Run the script
generateImage().catch(console.error);
