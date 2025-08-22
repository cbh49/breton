import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import NCAAFImage from '../src/components/NCAAFImage';
import { generateBettingAnalysis, getBettingLean, type TeamStats } from '../src/functions';





// Generate AI analysis for a matchup
async function generateMatchupAnalysis(
  matchup: any,
  team1Stats: any,
  team2Stats: any,
  logoMappings: Record<string, string>
) {
  try {
    console.log(`🤖 Generating AI analysis for ${matchup.Team1} vs ${matchup.Team2}...`);
    
    // Get betting lean
    const bettingLean = getBettingLean(team1Stats, team2Stats, matchup, logoMappings);
    
    if (!bettingLean) {
      console.log(`⚠️ No betting lean for ${matchup.Team1} vs ${matchup.Team2}`);
      return 'AI analysis unavailable';
    }
    
    // Generate AI analysis
    const analysis = await generateBettingAnalysis(matchup, team1Stats, team2Stats, bettingLean);
    console.log(`✅ AI analysis generated for ${matchup.Team1} vs ${matchup.Team2}`);
    
    return analysis;
  } catch (error) {
    console.error(`❌ Error generating AI analysis for ${matchup.Team1} vs ${matchup.Team2}:`, error);
    return 'AI analysis temporarily unavailable';
  }
}

// Load data from JSON files
async function loadData() {
  try {
    // Load public bets data
    const publicBetsPath = path.join(process.cwd(), 'json-data/publicBets.json');
    const publicBetsData = JSON.parse(fs.readFileSync(publicBetsPath, 'utf8'));
    
    // Transform the data to match our new interface
    const matchups = publicBetsData.map((bet: any) => {
      return {
        Team1: bet.Team1,
        Team2: bet.Team2,
        Team1Spread: bet.Team1Spread,
        Team2Spread: bet.Team2Spread,
        Total: bet.Total,
        Favorite: bet.Team1Spread < 0 ? bet.Team1 : bet.Team2,
        Team1ML: bet.Team1ML,
        Team2ML: bet.Team2ML
      };
    });
    
    // Load team stats data - use current working directory
    const teamStatsPath = path.join(process.cwd(), 'teamStats.json');
    const teamStatsData: Record<string, TeamStats> = JSON.parse(fs.readFileSync(teamStatsPath, 'utf8'));
    
    // Load logo mapping from CSV - use current working directory
    const logosPath = path.join(process.cwd(), 'cfb-logos/logos');
    const logoMapping: Record<string, string> = {};
    
    if (fs.existsSync(logosPath)) {
      const logoData = fs.readFileSync(logosPath, 'utf8');
      const lines = logoData.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('id,')) {
          const parts = line.split(',');
          if (parts.length >= 12) {
            const schoolName = parts[1];
            const logoUrl = parts[11];
            if (logoUrl && logoUrl.startsWith('http')) {
              logoMapping[schoolName] = logoUrl;
            }
          }
        }
      }
    }
    
    // Generate AI analysis for each matchup
    console.log('🤖 Generating AI analysis for all matchups...');
    const matchupsWithAI = await Promise.all(
      matchups.map(async (matchup: any) => {
        const team1Stats = teamStatsData[matchup.Team1];
        const team2Stats = teamStatsData[matchup.Team2];
        
        if (!team1Stats || !team2Stats) {
          console.log(`⚠️ Missing stats for ${matchup.Team1} or ${matchup.Team2}`);
          return { ...matchup, aiAnalysis: 'AI analysis unavailable' };
        }
        
        const aiAnalysis = await generateMatchupAnalysis(matchup, team1Stats, team2Stats, logoMapping);
        return { ...matchup, aiAnalysis };
      })
    );
    
    console.log(`✅ Generated AI analysis for ${matchupsWithAI.length} matchups`);
    
    return { matchups: matchupsWithAI, teamStatsData, logoMapping };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Create HTML string from React component
function createHTMLString(data: {
  matchups: any[];
  teamStatsData: Record<string, TeamStats>;
  logoMapping: Record<string, string>;
}) {
  const { matchups, teamStatsData, logoMapping } = data;
  
  const reactElement = React.createElement(NCAAFImage, {
    matchups: matchups,
    teamStats: teamStatsData,
    logoMappings: logoMapping,
    aiAnalysisData: matchups.reduce((acc, matchup) => {
      acc[`${matchup.Team1}-${matchup.Team2}`] = matchup.aiAnalysis || 'AI analysis unavailable';
      return acc;
    }, {} as Record<string, string>)
  });
  
  const htmlString = ReactDOMServer.renderToString(reactElement);
  
  // Read CSS file as string - use current working directory
  const cssPath = path.join(process.cwd(), 'src/styles/NCAAFImage.css');
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Convert font file to base64 for embedding
  const fontPath = path.join(process.cwd(), 'VTFRedzone-Classic.ttf');
  if (fs.existsSync(fontPath)) {
    const fontBuffer = fs.readFileSync(fontPath);
    const fontBase64 = fontBuffer.toString('base64');
    const fontDataUrl = `data:font/truetype;base64,${fontBase64}`;
    
    // Replace the font URL with the base64 data URL
    cssContent = cssContent.replace(
      /url\(['"]?\/fonts\/VTFRedzone-Classic\.ttf['"]?\)/g,
      `url('${fontDataUrl}')`
    );
  }
  
  // Create complete HTML document
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>NCAAF Image Generator</title>
    <style>
        ${cssContent}
        body {
            margin: 0;
            padding: 0;
            background: transparent;
        }
        .ncaaf-image {
            min-height: auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    ${htmlString}
</body>
</html>`;
}

// Generate PNG image using Puppeteer
async function generatePNG() {
  let browser;
  
  try {
    console.log('🚀 Starting NCAAF image generation with Puppeteer...');
    
    // Load data
    const data = await loadData();
    console.log(`✅ Loaded ${data.matchups.length} matchups`);
    console.log(`✅ Loaded stats for ${Object.keys(data.teamStatsData).length} teams`);
    console.log(`✅ Loaded ${Object.keys(data.logoMapping).length} logo mappings`);
    
    // Create HTML string
    const htmlString = createHTMLString(data);
    console.log('✅ Created HTML string');
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent sizing
    await page.setViewport({ width: 1600, height: 1200 });
    
    // Set content
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });
    
    // Wait for any images to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate PNG
    console.log('🔄 Generating PNG...');
    const pngBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false
    });
    
    // Save PNG file - use current working directory
    const outputPath = path.join(process.cwd(), 'ncaaf_ou_output.png');
    fs.writeFileSync(outputPath, pngBuffer);
    
    console.log('✅ PNG generated successfully:', outputPath);
    console.log(`📊 Image size: ${pngBuffer.length} bytes`);
    
  } catch (error) {
    console.error('❌ Error generating image:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the generator
if (require.main === module) {
  generatePNG();
}
