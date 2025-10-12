import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

# ---------- Config ----------
SCRIPT_DIR = Path(__file__).parent
TOUCHDOWN_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "touchdown_lines.json"
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
TEAM_ABBREVIATION_JSON = SCRIPT_DIR.parent / "json-links" / "team-abbreviation.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "td_props.json"
QUARTERBACKS_JSON = SCRIPT_DIR.parent / "json-links" / "quarterbacks.json"
RECEIVERS_JSON = SCRIPT_DIR.parent / "json-links" / "recievers_tight_ends.json"
RUNNINGBACKS_JSON = SCRIPT_DIR.parent / "json-links" / "running-backs.json"

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; td-props-scraper/1.0)"
}
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_REQUESTS = 0.8  # seconds


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def get_upcoming_game_teams(public_bets: List[Dict]) -> set:
    """Extract all team names from upcoming games in publicBets.json"""
    teams = set()
    for game in public_bets:
        teams.add(game.get("Team1"))
        teams.add(game.get("Team2"))
    return teams


def get_current_opponent(team: str, public_bets: List[Dict], team_abbreviations: Dict[str, str]) -> Optional[str]:
    """Get the current opponent for a team from publicBets.json and return as abbreviation"""
    for game in public_bets:
        if game.get("Team1") == team:
            opponent_full_name = game.get("Team2")
            return team_abbreviations.get(opponent_full_name, opponent_full_name)
        elif game.get("Team2") == team:
            opponent_full_name = game.get("Team1")
            return team_abbreviations.get(opponent_full_name, opponent_full_name)
    return None


def get_player_info(player_name: str, quarterbacks: Dict, receivers: Dict, runningbacks: Dict) -> Optional[tuple]:
    """
    Get player position and URL from the player data files.
    Returns (position, url) tuple or None if not found.
    """
    # Check quarterbacks
    if player_name in quarterbacks:
        data = quarterbacks[player_name]
        return data[0], data[2]  # position, url
    
    # Check receivers/tight ends
    if player_name in receivers:
        data = receivers[player_name]
        return data[0], data[2]  # position, url
    
    # Check running backs
    if player_name in runningbacks:
        data = runningbacks[player_name]
        return data[0], data[2]  # position, url
    
    return None


def normalize_opponent_cell(text: str) -> str:
    """
    Opponent cell looks like "@MIA" or "vs MIA" (sometimes without a space).
    Strip "@" or "vs" and spaces, return uppercase token.
    """
    t = text.strip().upper()
    t = t.replace("VS", "").replace("@", "").strip()
    # Some rows can say "BYE WEEK" or similar
    if "BYE" in t:
        return ""
    # Keep only letters (handle edge cases like trailing markers)
    t = re.sub(r"[^A-Z]", "", t)
    return t


def parse_int(cell_text: str) -> int:
    cell_text = cell_text.strip()
    if cell_text == "" or cell_text == "-" or cell_text.upper() == "DNP":
        return 0
    # longest might include "T" (touchdown) suffix; strip non-digits and minus
    m = re.search(r"-?\d+", cell_text)
    return int(m.group(0)) if m else 0


def fetch_html(url: str) -> Optional[str]:
    try:
        r = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT)
        if r.status_code == 200:
            return r.text
        return None
    except requests.RequestException:
        return None


def scrape_last_five_games(player_name: str, game_log_url: str, position: str) -> Optional[List[Dict]]:
    """
    Scrape the last five games from CBS game log and return stats for those games.
    Returns list of game dictionaries with stats, or None if no games found.
    """
    # Quick guard: skip college URLs only if they don't have NFL games
    # We'll check after scraping if we got valid NFL games

    games = []
    
    # Scrape the base game log URL (CBS shows current season by default)
    html = fetch_html(game_log_url)
    if not html:
        return None

    soup = BeautifulSoup(html, "html.parser")

    # Find tables titled "Regular Season Game Log" or "Post-Season Game Log"
    section_headers = soup.find_all("h4", class_="TableBase-title")
    for h in section_headers:
        title = h.get_text(strip=True)
        if "Game Log" not in title:
            continue

        # Detect postseason vs regular
        is_postseason = ("Post-Season" in title) or ("Postseason" in title)
        # Columns after opponent (index 1) shift left by 1 in postseason
        offset = -1 if is_postseason else 0

        wrapper = h.find_parent("div", class_="TableBaseWrapper")
        if not wrapper:
            continue
        rows = wrapper.find_all("tr", class_="TableBase-bodyTr")

        # Get the last five games (most recent)
        recent_rows = rows[-5:] if len(rows) >= 5 else rows

        for row in recent_rows:
            tds = row.find_all("td", class_="TableBase-bodyTd")

            # Set up column indices for touchdown stats (receiving and rushing only)
            i_opp = 1
            i_rec_td = 8 + offset  # Receiving touchdowns
            
            # Different rushing TD column based on position
            if position == "QB":
                i_rush_td = 18 + offset  # Rushing touchdowns for QBs
            else:
                i_rush_td = 14 + offset  # Rushing touchdowns for WR/TE/RB

            needed_max = max(i_opp, i_rec_td, i_rush_td)
            if len(tds) <= needed_max:
                continue

            # Opponent: "@MIA" / "vs MIA"
            opp_raw = tds[i_opp].get_text(" ", strip=True)
            opp_code = normalize_opponent_cell(opp_raw)
            if not opp_code:
                continue

            # Parse touchdown stats (receiving and rushing only)
            receiving_touchdowns = parse_int(tds[i_rec_td].get_text(strip=True))
            rushing_touchdowns = parse_int(tds[i_rush_td].get_text(strip=True))
            
            # For quarterbacks, only use rushing touchdowns (column 18)
            if position == "QB":
                receiving_touchdowns = 0

            # Calculate total touchdowns
            total_touchdowns = receiving_touchdowns + rushing_touchdowns

            # Skip games where the player didn't actually play (no stats)
            if total_touchdowns == 0 and receiving_touchdowns == 0 and rushing_touchdowns == 0:
                # Check if player had any other stats to determine if they played
                has_stats = False
                for i in range(2, min(len(tds), 8)):  # Check a few stat columns
                    if parse_int(tds[i].get_text(strip=True)) > 0:
                        has_stats = True
                        break
                if not has_stats:
                    continue

            game_data = {
                "opponent": opp_code,
                "receiving_touchdowns": receiving_touchdowns,
                "rushing_touchdowns": rushing_touchdowns,
                "total_touchdowns": total_touchdowns,
                "season": 2025  # Current season
            }
            
            games.append(game_data)

        # If we found games, break out of loop
        if games:
            break

    time.sleep(SLEEP_BETWEEN_REQUESTS)

    # If this was a college URL and we didn't get any games, skip
    if "/college-football/" in game_log_url and len(games) == 0:
        print(f"Skipping (college link with no NFL games): {player_name}")
        return None

    # Return only the last five games
    return games[-5:] if len(games) >= 5 else None




def get_player_betting_lines(player_name: str, td_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in td_lines:
        if player.get("name") == player_name:
            return player
    return None


def is_above_line_in_most_games(games: List[Dict], stat_name: str, line: float) -> bool:
    """
    Check if player exceeded the line in 3/5 or more of the last five games.
    """
    if len(games) < 5 or line is None:
        return False
    
    above_count = sum(1 for game in games if game[stat_name] > line)
    return above_count >= 3


def analyze_player_props(player_name: str, team: str, position: str, url: str, td_lines: List[Dict], public_bets: List[Dict], team_abbreviations: Dict[str, str]) -> Optional[Dict]:
    """
    Analyze a player's last five games against their betting lines.
    Returns player data if they exceed lines in 3/5 or more games, None otherwise.
    """
    # Scrape last five games
    games = scrape_last_five_games(player_name, url, position)
    if not games:
        print(f"No recent games found for {player_name}")
        return None

    # Get betting lines
    betting_lines = get_player_betting_lines(player_name, td_lines)
    if not betting_lines:
        print(f"No betting lines found for {player_name}")
        return None

    # Check if player has any qualifying stats (above line in both games)
    has_qualifying_stats = False
    
    stat_checks = [
        ("total_touchdowns", "touchdowns_line"),
        ("receiving_touchdowns", "touchdowns_line"),
        ("rushing_touchdowns", "touchdowns_line")
    ]
    
    for stat_name, line_key in stat_checks:
        line = betting_lines.get(line_key)
        if line and is_above_line_in_most_games(games, stat_name, line):
            has_qualifying_stats = True
            break

    # Only return if player has at least one qualifying stat
    if has_qualifying_stats:
        # Get current opponent
        current_opponent = get_current_opponent(team, public_bets, team_abbreviations)
        
        # Build data structure matching historical format
        player_data = {
            "name": player_name,
            "team": team,
            "position": position,
            "opponent": [game["opponent"] for game in games],
            "current_opponent": current_opponent,
            "receiving_touchdowns": [game["receiving_touchdowns"] for game in games],
            "rushing_touchdowns": [game["rushing_touchdowns"] for game in games],
            "total_touchdowns": [game["total_touchdowns"] for game in games],
            "years": [game["season"] for game in games]
        }
        
        # Add betting lines and trends
        player_data.update({
            "touchdowns_line": betting_lines.get("touchdowns_line"),
            "touchdown_odds": betting_lines.get("touchdown_odds"),
            "two_td_line": betting_lines.get("two_td_line"),
            "two_td_odds": betting_lines.get("two_td_odds"),
            "three_td_line": betting_lines.get("three_td_line"),
            "three_td_odds": betting_lines.get("three_td_odds"),
            "touchdowns_trend": "OVER" if is_above_line_in_most_games(games, "total_touchdowns", betting_lines.get("touchdowns_line")) else None,
            "touchdowns_rate": f"{sum(1 for game in games if game['total_touchdowns'] > betting_lines.get('touchdowns_line', 0))}/{len(games)}"
        })
        
        return player_data
    
    return None


def main():
    td_lines = load_json(TOUCHDOWN_LINES_JSON)
    public_bets = load_json(PUBLIC_BETS_JSON)
    team_abbreviations = load_json(TEAM_ABBREVIATION_JSON)
    quarterbacks = load_json(QUARTERBACKS_JSON)
    receivers = load_json(RECEIVERS_JSON)
    runningbacks = load_json(RUNNINGBACKS_JSON)
    
    # Get teams playing in upcoming games
    upcoming_teams = get_upcoming_game_teams(public_bets)
    print(f"Upcoming games teams: {upcoming_teams}")
    
    results = []

    for player_data in td_lines:
        player_name = player_data.get("name")
        team = player_data.get("team")
        
        if not player_name or not team:
            continue
            
        # Only analyze players from teams playing in upcoming games
        if team not in upcoming_teams:
            continue
            
        # Get current opponent for this team
        current_opponent = get_current_opponent(team, public_bets, team_abbreviations)
        if not current_opponent:
            print(f"No current opponent found for {team}, skipping...")
            continue
            
        # Get player position and URL from the player data files
        player_info = get_player_info(player_name, quarterbacks, receivers, runningbacks)
        if not player_info:
            print(f"Player {player_name} not found in player data files, skipping...")
            continue
            
        position, game_log_url = player_info
        
        # Skip players with invalid URLs
        if not game_log_url or game_log_url == "url":
            print(f"Invalid URL for {player_name}, skipping...")
            continue
        
        print(f"Analyzing {player_name} ({team}) vs {current_opponent} - {position}...")
        
        # Analyze player's props
        player_result = analyze_player_props(player_name, team, position, game_log_url, td_lines, public_bets, team_abbreviations)
        if player_result:
            results.append(player_result)
            print(f"✓ {player_name} qualifies with qualifying stats")

    # Save results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nFound {len(results)} players hitting their lines in 3/5 or more recent games")
    print(f"Results saved to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
