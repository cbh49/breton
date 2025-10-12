import os
import json
import argparse
import re
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
import pandas as pd

CBS_SCOREBOARD_URL = "https://www.cbssports.com/nfl/scoreboard/2025/regular/5/?layout=compact"

def load_team_normalization() -> Dict[str, str]:
    """Load team name normalization mapping from JSON file"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        normalization_path = os.path.join(script_dir, '../json-links/team-normalization.json')
        
        with open(normalization_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load team normalization: {e}")
        return {}

def normalize_team_name(team_name: str, normalization_map: Dict[str, str]) -> str:
    """Normalize team name using the mapping"""
    # First try exact match
    if team_name in normalization_map:
        return normalization_map[team_name]
    
    # Try case-insensitive match
    for key, value in normalization_map.items():
        if key.lower() == team_name.lower():
            return value
    
    # Return original name if no mapping found
    return team_name

def get_team_name_from_link(team_link: str) -> str:
    """Extract team name from CBS team link URL"""
    # Extract team name from URL like "/college-football/teams/PORTST/portland-state-vikings/"
    match = re.search(r'/teams/[^/]+/([^/]+)/', team_link)
    if match:
        team_slug = match.group(1)
        # Convert slug to readable name (e.g., "portland-state-vikings" -> "Portland St.")
        words = team_slug.split('-')
        if len(words) >= 2:
            # Take first two words and capitalize
            name = ' '.join(words[:2]).title()
            # Handle common abbreviations
            if 'state' in name.lower():
                name = name.replace('State', 'St.')
            return name
    return team_link

def extract_game_scores(table_html: str, normalization_map: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Extract game scores from a single table HTML.
    Returns list of game dictionaries with normalized team names.
    """
    soup = BeautifulSoup(table_html, 'html.parser')
    games = []
    
    # Find all table rows
    rows = soup.find_all('tr')
    
    # Skip header row (index 0) and process team rows in pairs
    i = 1  # Start from row 1 (skip header)
    while i < len(rows) - 1:
        away_row = rows[i]
        home_row = rows[i + 1]
        
        # Extract team names and scores
        away_team_data = extract_team_data(away_row)
        home_team_data = extract_team_data(home_row)
        
        if away_team_data and home_team_data:
            # Normalize team names
            away_team_normalized = normalize_team_name(away_team_data["name"], normalization_map)
            home_team_normalized = normalize_team_name(home_team_data["name"], normalization_map)
            
            game = {
                "Team1": away_team_normalized,  # Away team (normalized)
                "Team1Score": away_team_data["total_score"],
                "Team2": home_team_normalized,   # Home team (normalized)
                "Team2Score": home_team_data["total_score"],
                "Team1Record": away_team_data.get("record", ""),
                "Team2Record": home_team_data.get("record", ""),
                "Team1QuarterScores": away_team_data.get("quarter_scores", []),
                "Team2QuarterScores": home_team_data.get("quarter_scores", []),
                "MatchupKey": f"{away_team_normalized} vs {home_team_normalized}",
                # Keep original names for reference
                "Team1Original": away_team_data["name"],
                "Team2Original": home_team_data["name"]
            }
            games.append(game)
        
        i += 2  # Move to next pair
    
    return games

def extract_team_data(row) -> Optional[Dict[str, Any]]:
    """Extract team name, record, and scores from a table row"""
    try:
        # Find team name link
        team_link = row.find('a', class_='team-name-link')
        if not team_link:
            return None
            
        team_name = team_link.get_text(strip=True)
        team_url = team_link.get('href', '')
        
        # Extract record if available
        record_span = row.find('span', class_='record')
        record = record_span.get_text(strip=True) if record_span else ""
        
        # Extract quarter scores
        quarter_scores = []
        cells = row.find_all('td')
        
        # Skip first cell (team info), get quarter scores
        for cell in cells[1:]:
            if cell.get('class') == ['total']:
                break  # Stop at total column
            score_text = cell.get_text(strip=True)
            try:
                score = int(score_text) if score_text else 0
                quarter_scores.append(score)
            except ValueError:
                quarter_scores.append(0)
        
        # Get total score
        total_cell = row.find('td', class_='total')
        total_score = 0
        if total_cell:
            try:
                total_score = int(total_cell.get_text(strip=True))
            except ValueError:
                pass
        
        return {
            "name": team_name,
            "record": record,
            "quarter_scores": quarter_scores,
            "total_score": total_score,
            "url": team_url
        }
        
    except Exception as e:
        print(f"Error extracting team data: {e}")
        return None

def scrape_cbs_scoreboard(url: str = CBS_SCOREBOARD_URL) -> List[Dict[str, Any]]:
    """
    Scrape CBS Sports scoreboard and extract all game scores with normalized team names.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    # Load team normalization mapping
    normalization_map = load_team_normalization()
    print(f"Loaded {len(normalization_map)} team name mappings")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find the score card container
        score_container = soup.find('div', id='score-card-container-react')
        if not score_container:
            print("Could not find score card container")
            return []
        
        all_games = []
        
        # Find all tables within the container
        tables = score_container.find_all('table')
        
        for table in tables:
            table_html = str(table)
            games = extract_game_scores(table_html, normalization_map)
            all_games.extend(games)
        
        return all_games
        
    except requests.RequestException as e:
        print(f"Error fetching URL: {e}")
        return []
    except Exception as e:
        print(f"Error parsing HTML: {e}")
        return []

def write_json_output(games: List[Dict[str, Any]], output_path: str):
    """Write games data to JSON file"""
    output_data = {
        "games": games,
        "total_games": len(games),
        "scraped_at": pd.Timestamp.now().isoformat()
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"[OK] Wrote {output_path} ({len(games)} games)")

def main():
    parser = argparse.ArgumentParser(description="Scrape CBS Sports college football scoreboard")
    parser.add_argument("--url", default=CBS_SCOREBOARD_URL, 
                       help=f"CBS Sports scoreboard URL (default: {CBS_SCOREBOARD_URL})")
    parser.add_argument("--out", 
                       help="Output JSON file path (default: ../json-data/cfb_scores.json)")
    
    args = parser.parse_args()
    
    # Default output path
    if not args.out:
        args.out = "../json-data/nfl_scores.json"
    
    try:
        print(f"Scraping CBS Sports scoreboard: {args.url}")
        games = scrape_cbs_scoreboard(args.url)
        
        if not games:
            print("No games found")
            return 1
        
        write_json_output(games, args.out)
        
        # Print summary
        print(f"\nFound {len(games)} games:")
        for game in games:
            print(f"  {game['MatchupKey']}: {game['Team1Score']}-{game['Team2Score']}")
            
            # Show normalization if it occurred
            if game.get('Team1Original') != game['Team1']:
                print(f"    Team1 normalized: '{game['Team1Original']}' -> '{game['Team1']}'")
            if game.get('Team2Original') != game['Team2']:
                print(f"    Team2 normalized: '{game['Team2Original']}' -> '{game['Team2']}'")
        
        return 0
        
    except Exception as e:
        print(f"[ERROR] {e}")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
