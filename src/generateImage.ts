import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import NCAAFImage from './components/NCAAFImage';
import { type Matchup, type TeamStats } from './functions/types';
import './styles/NCAAFImage.css';



// Load data from JSON files
function loadData() {
  try {
    // Load public bets data
    const publicBetsPath = path.join(__dirname, '../../json-data/publicBets.json');
    const publicBetsData: Matchup[] = JSON.parse(fs.readFileSync(publicBetsPath, 'utf8'));
    
    // Load team stats data
    const teamStatsPath = path.join(__dirname, '../../teamStats.json');
    const teamStatsData: Record<string, TeamStats> = JSON.parse(fs.readFileSync(teamStatsPath, 'utf8'));
    
    // Load logo mapping from CSV
    const logosPath = path.join(__dirname, '../../cfb-logos/logos');
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
    
    return { publicBetsData, teamStatsData, logoMapping };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Create HTML string from React component
function createHTMLString(data: {
  publicBetsData: Matchup[];
  teamStatsData: Record<string, TeamStats>;
  logoMapping: Record<string, string>;
}) {
  const { publicBetsData, teamStatsData, logoMapping } = data;
  
  const reactElement = React.createElement(NCAAFImage, {
    matchups: publicBetsData,
    teamStats: teamStatsData,
    logoMappings: logoMapping
  });
  
  const htmlString = ReactDOMServer.renderToString(reactElement);
  
  // Create complete HTML document
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>NCAAF Image Generator</title>
    <style>
        ${fs.readFileSync(path.join(__dirname, './styles/NCAAFImage.css'), 'utf8')}
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

// Generate PNG image
async function generatePNG() {
  try {
    console.log('🚀 Starting NCAAF image generation...');
    
    // Load data
    const data = loadData();
    console.log(`✅ Loaded ${data.publicBetsData.length} matchups`);
    console.log(`✅ Loaded stats for ${Object.keys(data.teamStatsData).length} teams`);
    console.log(`✅ Loaded ${Object.keys(data.logoMapping).length} logo mappings`);
    
    // Create HTML string
    const htmlString = createHTMLString(data);
    console.log('✅ Created HTML string');
    
    // Create temporary HTML file
    const tempHtmlPath = path.join(__dirname, '../../temp_ncaaf.html');
    fs.writeFileSync(tempHtmlPath, htmlString);
    console.log('✅ Created temporary HTML file');
    
    // Convert to PNG using html-to-image
    console.log('🔄 Converting HTML to PNG...');
    
    // Note: html-to-image works best in a browser environment
    // For Node.js, we'll need to use a different approach
    // For now, let's create the HTML file that can be opened in a browser
    
    const outputPath = path.join(__dirname, '../../ncaaf_ou_output.html');
    fs.writeFileSync(outputPath, htmlString);
    
    console.log('✅ Generated HTML file:', outputPath);
    console.log('📝 To convert to PNG:');
    console.log('   1. Open the HTML file in a browser');
    console.log('   2. Use browser dev tools or screenshot tools to capture as PNG');
    console.log('   3. Or use online HTML to PNG converters');
    
    // Clean up temp file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    
  } catch (error) {
    console.error('❌ Error generating image:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  generatePNG();
}
