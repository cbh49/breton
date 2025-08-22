# NCAAF Image Generator

A modern React/TypeScript application that generates clean, professional NCAAF statistics and betting comparison images.

## Features

- **Modern React Components**: Built with TypeScript and modern React patterns
- **Clean Layout**: Matches the exact design specification from your image
- **PNG Output**: Generates high-quality PNG images using Puppeteer
- **Responsive Design**: Works across different screen sizes
- **Data Integration**: Reads from your existing JSON data files

## Layout Structure

Each matchup row includes:
1. **Team Matchup**: Two circular logos with "VS" between them
2. **Betting Lines**: White bar with spread, total, and moneyline information
3. **Scoring Statistics**: Five cards showing PPG, points allowed, and rankings
4. **Advantage Calculation**: Visual indicator of which team has statistical advantage

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Puppeteer (for PNG generation):
```bash
npm install puppeteer
```

## Usage

### Development Mode
```bash
npm run dev
```
This will start a development server where you can preview the layout in your browser.

### Generate HTML Output
```bash
npm run generate
```
This creates an HTML file that can be opened in a browser.

### Generate PNG Image
```bash
npm run generate:png
```
This uses Puppeteer to generate a PNG image from the React component.

## Data Files

The application reads from:
- `json-data/publicBets.json` - Matchup and betting information
- `teamStats.json` - Team statistics and rankings
- `cfb-logos/logos` - Logo URL mappings

## File Structure

```
src/
├── components/
│   ├── MatchupRow.tsx      # Individual matchup row component
│   └── NCAAFImage.tsx      # Main container component
├── styles/
│   └── NCAAFImage.css      # Styling for the layout
├── generateImage.ts         # HTML generation script
├── generateImagePuppeteer.ts # PNG generation script
├── main.tsx                 # Development entry point
└── index.html               # Development HTML file
```

## Key Improvements Over Python PIL

1. **Cleaner Code**: React components are more maintainable and readable
2. **Better Layout**: CSS Grid and Flexbox provide more precise positioning
3. **Responsive Design**: Automatically adapts to different screen sizes
4. **Type Safety**: TypeScript prevents runtime errors
5. **Modern Tooling**: Vite provides fast development and building
6. **PNG Quality**: Puppeteer generates crisp, high-resolution images

## Customization

- **Colors**: Modify the CSS variables in `NCAAFImage.css`
- **Layout**: Adjust the grid and flexbox properties
- **Fonts**: Change font families and sizes in the CSS
- **Dimensions**: Modify viewport settings in the Puppeteer script

## Troubleshooting

### Puppeteer Issues
If you encounter issues with Puppeteer:
1. Ensure you have the latest Node.js version
2. Try running with `--no-sandbox` flag (already included)
3. Check if your system has the necessary dependencies

### Data Loading Issues
- Verify that your JSON files exist and are properly formatted
- Check file paths in the generation scripts
- Ensure team names match between different data files

## Output

The application generates:
- `ncaaf_ou_output.html` - HTML version for browser viewing
- `ncaaf_ou_output.png` - High-quality PNG image (when using Puppeteer)

## Performance

- **Development**: Fast hot-reload with Vite
- **Build**: Optimized production build
- **Image Generation**: Typically 5-10 seconds for PNG generation
- **Memory Usage**: Efficient React rendering with minimal overhead
