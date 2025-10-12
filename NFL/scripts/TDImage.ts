import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import BasePlayerPropsTable from '../components/BasePlayerPropsTable';

// Load the data
const tdHistoricalData = JSON.parse(fs.readFileSync(path.join(__dirname, '../json-data/td_props.json'), 'utf8'));
const teamLogos = JSON.parse(fs.readFileSync(path.join(__dirname, '../logos/nfl-team-logos.json'), 'utf8'));
const playerHeadshots = JSON.parse(fs.readFileSync(path.join(__dirname, '../headshots/players_headshots.json'), 'utf8'));
const teamStats = JSON.parse(fs.readFileSync(path.join(__dirname, '../json-data/teamStats.json'), 'utf8'));
const teamAbbreviations = JSON.parse(fs.readFileSync(path.join(__dirname, '../json-links/team-abbreviation.json'), 'utf8'));

// Load logos as base64
const pikkitLogo = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../public/pikkit.png')).toString('base64')}`;
const draftKingsLogo = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '../public/DraftKings.png')).toString('base64')}`;

// Function to get player headshot URL
function getPlayerHeadshot(playerName: string): string | null {
  const headshot = playerHeadshots[playerName];
  console.log(`Looking for headshot for ${playerName}: ${headshot}`);
  return headshot || null;
}

// Function to get matchup grade based on opponent's defensive ranking
function getMatchupGrade(opponentTeam: string, playerPosition: string): string {
  // Convert abbreviation to full team name
  const teamName = Object.keys(teamAbbreviations).find(team => 
    teamAbbreviations[team] === opponentTeam
  );
  
  if (!teamName || !teamStats[teamName]) {
    console.log(`Team not found in teamStats: ${opponentTeam}`);
    return 'C'; // Default grade if team not found
  }
  
  let ranking: number;
  
  // Choose ranking based on player position
  if (playerPosition === 'RB' || playerPosition === 'QB') {
    // For RBs and QBs, use rush touchdowns allowed ranking
    ranking = teamStats[teamName].rush_touchdowns_allowed_per_game_ranking;
  } else if (playerPosition === 'WR' || playerPosition === 'TE') {
    // For WRs and TEs, use pass touchdowns allowed ranking
    ranking = teamStats[teamName].pass_touchdowns_allowed_per_game_ranking;
  } else {
    // Default to points allowed ranking for other positions
    ranking = teamStats[teamName].points_allowed_per_game_ranking;
  }
  
  // For OVER bets, worse defense = better matchup (inverted)
  if (ranking >= 28) return 'A'; // Worst defense (28-32) = best matchup for OVER
  if (ranking >= 21) return 'B'; // Bad defense (21-27) = good matchup for OVER
  if (ranking >= 13) return 'C'; // Average defense (13-20) = average matchup for OVER
  if (ranking >= 6) return 'D';  // Good defense (6-12) = bad matchup for OVER
  return 'F'; // Best defense (1-5) = worst matchup for OVER
}

function transformData(): any[] {
  const transformedData: any[] = [];

  tdHistoricalData.forEach((player: any) => {
    // Get team and opponent logos
    const teamLogo = teamLogos[player.team]?.logo_url;
    const opponentTeam = player.current_opponent || player.opponent[0]; // Use current opponent if available
    const opponentLogo = (Object.values(teamLogos) as any[]).find((team: any) => 
      team.abbr === opponentTeam
    )?.logo_url;
    
    // Get player headshot
    const playerHeadshot = getPlayerHeadshot(player.name);
    
    // Get matchup grade based on opponent's defensive ranking and player position
    const matchupGrade = getMatchupGrade(opponentTeam, player.position);

    // Only include players with OVER trends and good matchup grades
    if (player.touchdowns_trend === "OVER" && player.touchdowns_line !== undefined) {
      // Filter out D and F grades
      if (matchupGrade === 'D' || matchupGrade === 'F') {
        return; // Skip this player
      }
      transformedData.push({
        name: player.name,
        team: player.team,
        opponent: opponentTeam,
        current_opponent: player.current_opponent || opponentTeam,
        line: player.touchdowns_line,
        stat: "Touchdowns",
        overUnder: player.touchdowns_trend,
        odds: player.touchdown_odds || 0,
        rate: player.touchdowns_rate,
        years: player.opponent,
        statValues: player.total_touchdowns,
        teamLogo: teamLogo,
        opponentLogo: opponentLogo,
        playerHeadshot: playerHeadshot,
        position: player.position,
        matchupGrade: matchupGrade
      });
    }
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
      <title>NFL Touchdown Props</title>
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
            title: "NFL TOUCHDOWN PROPS",
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
    path: path.join(outputDir, 'touchdown-props-react.png') as `${string}.png`,
    type: 'png',
    fullPage: false
  });

  await browser.close();
  console.log('Touchdown props image generated successfully using React component!');
}

// Run the script
generateImage().catch(console.error);
