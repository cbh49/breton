import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

# ---------- Config ----------
SCRIPT_DIR = Path(__file__).parent
RECEIVERS_JSON = SCRIPT_DIR.parent / "json-links" / "recievers_tight_ends.json"
RECEIVER_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "reciever_lines.json"
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
TEAM_ABBREVIATION_JSON = SCRIPT_DIR.parent / "json-links" / "team-abbreviation.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "wr_alt_props.json"

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; wr-alt-props-scraper/1.0)"
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


def parse_float(cell_text: str) -> float:
    cell_text = cell_text.strip()
    if cell_text == "" or cell_text == "-":
        return 0.0
    m = re.search(r"-?\d+(?:\.\d+)?", cell_text)
    return float(m.group(0)) if m else 0.0


def fetch_html(url: str) -> Optional[str]:
    try:
        r = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT)
        if r.status_code == 200:
            return r.text
        return None
    except requests.RequestException:
        return None


def modify_rec_yards_alt_line(original_line: float) -> Optional[float]:
    """
    Modify rec_yards betting lines according to alt line rules (same as rush_yards):
    If < 10 : skip (return None)
    If 11-20 : new value = 10
    If 21-30 : new value = 15
    If 31-40: new value = 25
    If 41-55: new value = 40
    If 56-70: 50
    If 71-80: 60
    If 81-90: 70
    If 91-100: 80
    If 101-110: 90
    If 111-120: 100
    If > 120: continue (return original)
    """
    if original_line < 10:
        return None
    elif 11 <= original_line <= 20:
        return 10.0
    elif 21 <= original_line <= 30:
        return 15.0
    elif 31 <= original_line <= 40:
        return 25.0
    elif 41 <= original_line <= 55:
        return 40.0
    elif 56 <= original_line <= 70:
        return 50.0
    elif 71 <= original_line <= 80:
        return 60.0
    elif 81 <= original_line <= 90:
        return 70.0
    elif 91 <= original_line <= 100:
        return 80.0
    elif 101 <= original_line <= 110:
        return 90.0
    elif 111 <= original_line <= 120:
        return 100.0
    else:  # > 120
        return original_line


def modify_receptions_alt_line(original_line: float) -> Optional[float]:
    """
    Modify receptions betting lines according to alt line rules:
    If < 2: continue (return original)
    If 3-4: new value = 2
    If 4-5: new value = 3
    If 5-6: new value = 4
    If 6-7: new value = 5
    If 7-8: new value = 6
    If 8-9: new value = 7
    If 9-10: new value = 8
    If 10-11: new value = 9
    """
    if original_line < 2:
        return original_line
    elif 3 <= original_line <= 4:
        return 2.0
    elif 4 < original_line <= 5:
        return 3.0
    elif 5 < original_line <= 6:
        return 4.0
    elif 6 < original_line <= 7:
        return 5.0
    elif 7 < original_line <= 8:
        return 6.0
    elif 8 < original_line <= 9:
        return 7.0
    elif 9 < original_line <= 10:
        return 8.0
    elif 10 < original_line <= 11:
        return 9.0
    else:  # > 11
        return original_line


def scrape_last_three_games(player_name: str, game_log_url: str, position: str) -> Optional[List[Dict]]:
    """
    Scrape the last three games from CBS game log and return stats for those games.
    Returns list of game dictionaries with stats, or None if no games found.
    """
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

        # Get the last three games (most recent)
        recent_rows = rows[-3:] if len(rows) >= 3 else rows

        for row in recent_rows:
            tds = row.find_all("td", class_="TableBase-bodyTd")

            # WR/TE table: Opponent, Rec, Yds, Avg, TD, Long, Fum
            i_opp   = 1
            i_rec   = 2 + offset
            i_recy  = 3 + offset
            i_recavg = 4 + offset
            i_rectd = 5 + offset
            i_lrec  = 6 + offset
            i_recf  = 7 + offset

            # Calculate needed_max
            needed_max = max(i_opp, i_recf)
            if len(tds) <= needed_max:
                continue

            # Opponent: "@MIA" / "vs MIA"
            opp_raw = tds[i_opp].get_text(" ", strip=True)
            opp_code = normalize_opponent_cell(opp_raw)
            if not opp_code:
                continue

            # Parse receiving stats
            receptions      = parse_int(tds[i_rec].get_text(strip=True))
            rec_yards       = parse_int(tds[i_recy].get_text(strip=True))
            rec_avg         = parse_float(tds[i_recavg].get_text(strip=True))
            rec_td          = parse_int(tds[i_rectd].get_text(strip=True))
            longest_rec     = parse_int(tds[i_lrec].get_text(strip=True))
            rec_fum         = parse_int(tds[i_recf].get_text(strip=True))

            # Skip games where the player didn't actually play
            if receptions == 0:
                continue

            game_data = {
                "opponent": opp_code,
                "receptions": receptions,
                "rec_yards": rec_yards,
                "rec_avg": rec_avg,
                "rec_touchdowns": rec_td,
                "longest_rec": longest_rec,
                "rec_fumbles": rec_fum,
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

    # Return only the last three games
    return games[-3:] if len(games) >= 3 else None


def get_player_betting_lines(player_name: str, receiver_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in receiver_lines:
        if player.get("name") == player_name:
            return player
    return None


def is_over_line_in_all_games(games: List[Dict], stat_name: str, line: float) -> bool:
    """
    Check if player exceeded the line in ALL 3/3 of the last three games.
    """
    if len(games) < 3 or line is None:
        return False
    
    over_count = sum(1 for game in games if game[stat_name] > line)
    return over_count == 3


def analyze_player_alt_props(player_name: str, team: str, position: str, url: str, receiver_lines: List[Dict], public_bets: List[Dict], team_abbreviations: Dict[str, str]) -> Optional[Dict]:
    """
    Analyze a player's last three games against their modified alt betting lines.
    Returns player data if they exceed lines in ALL 3/3 games, None otherwise.
    """
    # Scrape last three games
    games = scrape_last_three_games(player_name, url, position)
    if not games:
        print(f"No recent games found for {player_name}")
        return None

    # Get betting lines
    betting_lines = get_player_betting_lines(player_name, receiver_lines)
    if not betting_lines:
        print(f"No betting lines found for {player_name}")
        return None

    # Check if player has any qualifying stats (over line in ALL 3 games)
    has_qualifying_stats = False
    
    # Only check rec_yards_line and receptions_line
    rec_yards_line = betting_lines.get("rec_yards_line")
    receptions_line = betting_lines.get("receptions_line")
    
    # Modify lines according to alt line rules
    alt_rec_yards_line = modify_rec_yards_alt_line(rec_yards_line) if rec_yards_line else None
    alt_receptions_line = modify_receptions_alt_line(receptions_line) if receptions_line else None
    
    # Check if player qualifies for either stat
    if alt_rec_yards_line and is_over_line_in_all_games(games, "rec_yards", alt_rec_yards_line):
        has_qualifying_stats = True
    elif alt_receptions_line and is_over_line_in_all_games(games, "receptions", alt_receptions_line):
        has_qualifying_stats = True

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
            "receptions": [game["receptions"] for game in games],
            "rec_yards": [game["rec_yards"] for game in games],
            "rec_avg": [game["rec_avg"] for game in games],
            "rec_touchdowns": [game["rec_touchdowns"] for game in games],
            "longest_rec": [game["longest_rec"] for game in games],
            "rec_fumbles": [game["rec_fumbles"] for game in games],
            "years": [game["season"] for game in games]
        }
        
        # Add betting lines and trends for qualifying stats
        if alt_rec_yards_line and is_over_line_in_all_games(games, "rec_yards", alt_rec_yards_line):
            player_data.update({
                "rec_yards_line": rec_yards_line,  # Original line
                "rec_yards_alt_line": alt_rec_yards_line,  # Modified alt line
                "rec_yards_over": betting_lines.get("rec_yards_over"),
                "rec_yards_under": betting_lines.get("rec_yards_under"),
                "rec_yards_trend": "OVER",
                "rec_yards_rate": "3/3"
            })
        
        if alt_receptions_line and is_over_line_in_all_games(games, "receptions", alt_receptions_line):
            player_data.update({
                "receptions_line": receptions_line,  # Original line
                "receptions_alt_line": alt_receptions_line,  # Modified alt line
                "receptions_over": betting_lines.get("receptions_over"),
                "receptions_under": betting_lines.get("receptions_under"),
                "receptions_trend": "OVER",
                "receptions_rate": "3/3"
            })
        
        return player_data
    
    return None


def main():
    # Load receivers and receiver lines
    receiver_players = load_json(RECEIVERS_JSON)
    receiver_lines = load_json(RECEIVER_LINES_JSON)
    public_bets = load_json(PUBLIC_BETS_JSON)
    team_abbreviations = load_json(TEAM_ABBREVIATION_JSON)
    
    # Get teams playing in upcoming games
    upcoming_teams = get_upcoming_game_teams(public_bets)
    print(f"Upcoming games teams: {upcoming_teams}")
    
    results = []

    # Process receivers
    for player_name, data in receiver_players.items():
        try:
            position, team, url = data
        except Exception:
            print(f"Bad player row for {player_name}: {data}")
            continue

        # Only analyze players from teams playing in upcoming games
        if team not in upcoming_teams:
            continue

        print(f"Analyzing {position} {player_name} ({team})...")
        
        # Analyze player's alt props
        player_data = analyze_player_alt_props(player_name, team, position, url, receiver_lines, public_bets, team_abbreviations)
        if player_data:
            results.append(player_data)
            print(f"✓ {player_name} qualifies with 3/3 OVER alt lines")

    # Save results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nFound {len(results)} players hitting their alt lines OVER in ALL 3/3 recent games")
    print(f"Results saved to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
