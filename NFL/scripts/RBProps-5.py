import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

# ---------- Config ----------
SCRIPT_DIR = Path(__file__).parent
PLAYERS_JSON = SCRIPT_DIR.parent / "json-links" / "running-backs.json"
QUARTERBACKS_JSON = SCRIPT_DIR.parent / "json-links" / "quarterbacks.json"
RUNNINGBACK_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "runningback_lines.json"
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
TEAM_ABBREVIATION_JSON = SCRIPT_DIR.parent / "json-links" / "team-abbreviation.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "rb_props.json"

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; rb-props-scraper/1.0)"
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

            # Determine if this is a QB or RB based on position from data
            is_qb_table = (position == "QB")
            
            if is_qb_table:
                # QB table: Opponent, Cmp, Att, Cmp%, Yds, Avg, TD, Int, Sck, Rate, QBR, Rush, Yds, Avg, TD, Long, Fum
                i_opp   = 1
                i_ra    = 14 + offset
                i_ry    = 15 + offset
                i_ravg  = 16 + offset
                i_lr    = 17 + offset
                i_rtd   = None
                i_rf    = None
                # QBs don't have receiving stats in their table
                i_rec_avg = None
                i_rec   = None
                i_recy  = None
                i_lrec  = None
                i_rectd = None
                i_recf  = None
            else:
                # RB table: Opponent, Rush, Yds, Avg, TD, Long, Rec, Yds, Avg, TD, Long, Fum
                i_opp   = 1
                i_ra    = 4 + offset
                i_ry    = 5 + offset
                i_ravg  = 6 + offset
                i_lr    = 7 + offset
                i_rtd   = 8 + offset
                i_rf    = 9 + offset
                i_rec_avg = 10 + offset
                i_rec   = 11 + offset
                i_recy  = 12 + offset
                i_lrec  = 13 + offset
                i_rectd = 14 + offset
                i_recf  = 15 + offset

            # Calculate needed_max based on table type
            if is_qb_table:
                needed_max = max(i_opp, i_lr)  # Use i_lr since i_rf is None
            else:
                needed_max = max(i_opp, i_recf)
            if len(tds) <= needed_max:
                continue

            # Opponent: "@MIA" / "vs MIA"
            opp_raw = tds[i_opp].get_text(" ", strip=True)
            opp_code = normalize_opponent_cell(opp_raw)
            if not opp_code:
                continue

            # Parse rushing stats (same for both QB and RB)
            rush_attempts   = parse_int(tds[i_ra].get_text(strip=True))
            rush_yards      = parse_int(tds[i_ry].get_text(strip=True))
            longest_rush    = parse_int(tds[i_lr].get_text(strip=True))
            
            # Handle QB vs RB differences for TD and fumbles
            if is_qb_table:
                rush_td = 0  # QBs don't have rush TD column in this table
                rush_fum = 0  # QBs don't have rush fumble column in this table
            else:
                rush_td = parse_int(tds[i_rtd].get_text(strip=True))
                rush_fum = parse_int(tds[i_rf].get_text(strip=True))
            
            rush_avg        = parse_float(tds[i_ravg].get_text(strip=True))
            
            # Parse receiving stats (only for RB tables)
            if is_qb_table:
                # QBs don't have receiving stats
                rec_avg = 0.0
                receptions = 0
                rec_yards = 0
                longest_rec = 0
                rec_td = 0
                rec_fum = 0
            else:
                rec_avg         = parse_float(tds[i_rec_avg].get_text(strip=True))
                receptions      = parse_int(tds[i_rec].get_text(strip=True))
                rec_yards       = parse_int(tds[i_recy].get_text(strip=True))
                longest_rec     = parse_int(tds[i_lrec].get_text(strip=True))
                rec_td          = parse_int(tds[i_rectd].get_text(strip=True))
                rec_fum         = parse_int(tds[i_recf].get_text(strip=True))

            # Calculate rush+rec yards
            rushrec_yards = rush_yards + rec_yards

            # Skip games where the player didn't actually play
            if (rush_attempts == 0 and receptions == 0):
                continue

            game_data = {
                "opponent": opp_code,
                "rush_attempts": rush_attempts,
                "rush_yards": rush_yards,
                "longest_rush": longest_rush,
                "rush_touchdowns": rush_td,
                "rush_fumbles": rush_fum,
                "rush_avg": rush_avg,
                "receptions": receptions,
                "rec_yards": rec_yards,
                "longest_rec": longest_rec,
                "rec_touchdowns": rec_td,
                "rec_fumbles": rec_fum,
                "rec_avg": rec_avg,
                "rushrec_yards": rushrec_yards,
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


def get_player_betting_lines(player_name: str, rb_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in rb_lines:
        if player.get("name") == player_name:
            return player
    return None


def is_above_line_in_most_games(games: List[Dict], stat_name: str, line: float) -> bool:
    """
    Check if player exceeded the line in 4/5 or 5/5 of the last five games.
    """
    if len(games) < 5 or line is None:
        return False
    
    above_count = sum(1 for game in games if game[stat_name] > line)
    return above_count >= 4


def is_below_line_in_most_games(games: List[Dict], stat_name: str, line: float) -> bool:
    """
    Check if player was below the line in 4/5 or 5/5 of the last five games.
    """
    if len(games) < 5 or line is None:
        return False
    
    below_count = sum(1 for game in games if game[stat_name] < line)
    return below_count >= 4


def analyze_player_props(player_name: str, team: str, position: str, url: str, rb_lines: List[Dict], public_bets: List[Dict], team_abbreviations: Dict[str, str]) -> Optional[Dict]:
    """
    Analyze a player's last five games against their betting lines.
    Returns player data if they exceed lines in 4/5 or 5/5 games, None otherwise.
    """
    # Scrape last five games
    games = scrape_last_five_games(player_name, url, position)
    if not games:
        print(f"No recent games found for {player_name}")
        return None

    # Get betting lines
    betting_lines = get_player_betting_lines(player_name, rb_lines)
    if not betting_lines:
        print(f"No betting lines found for {player_name}")
        return None

    # Check if player has any qualifying stats (above OR below line in both games)
    has_qualifying_stats = False
    
    stat_checks = [
        ("rush_yards", "rush_yards_line"),
        ("rushrec_yards", "rushrec_line"),
        ("longest_rush", "long_rush_line"),
        ("receptions", "receptions_line"),
        ("rec_yards", "rec_yards_line"),
        ("rush_touchdowns", "rush_touchdowns_line")
    ]
    
    for stat_name, line_key in stat_checks:
        line = betting_lines.get(line_key)
        if line and (is_above_line_in_most_games(games, stat_name, line) or is_below_line_in_most_games(games, stat_name, line)):
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
            "rush_attempts": [game["rush_attempts"] for game in games],
            "rush_yards": [game["rush_yards"] for game in games],
            "longest_rush": [game["longest_rush"] for game in games],
            "rush_touchdowns": [game["rush_touchdowns"] for game in games],
            "rush_fumbles": [game["rush_fumbles"] for game in games],
            "rush_avg": [game["rush_avg"] for game in games],
            "receptions": [game["receptions"] for game in games],
            "rec_yards": [game["rec_yards"] for game in games],
            "longest_rec": [game["longest_rec"] for game in games],
            "rec_touchdowns": [game["rec_touchdowns"] for game in games],
            "rec_fumbles": [game["rec_fumbles"] for game in games],
            "rec_avg": [game["rec_avg"] for game in games],
            "rushrec_yards": [game["rushrec_yards"] for game in games],
            "years": [game["season"] for game in games]
        }
        
        # Add betting lines and trends for qualifying stats
        if betting_lines.get("rush_yards_line"):
            rush_yards_line = betting_lines.get("rush_yards_line")
            rush_yards_trend = None
            over_hits = sum(1 for game in games if game['rush_yards'] > rush_yards_line)
            under_hits = sum(1 for game in games if game['rush_yards'] < rush_yards_line)
            
            if over_hits >= 4:
                rush_yards_trend = "OVER"
                rush_yards_rate = f"{over_hits}/{len(games)}"
                player_data.update({
                    "rush_yards_line": rush_yards_line,
                    "rush_yards_over": betting_lines.get("rush_yards_over"),
                    "rush_yards_under": betting_lines.get("rush_yards_under"),
                    "rush_yards_trend": rush_yards_trend,
                    "rush_yards_rate": rush_yards_rate
                })
            elif under_hits >= 4:
                rush_yards_trend = "UNDER"
                rush_yards_rate = f"{under_hits}/{len(games)}"
                player_data.update({
                    "rush_yards_line": rush_yards_line,
                    "rush_yards_over": betting_lines.get("rush_yards_over"),
                    "rush_yards_under": betting_lines.get("rush_yards_under"),
                    "rush_yards_trend": rush_yards_trend,
                    "rush_yards_rate": rush_yards_rate
                })
        
        if betting_lines.get("rushrec_line"):
            rushrec_line = betting_lines.get("rushrec_line")
            rushrec_trend = None
            over_hits = sum(1 for game in games if game['rushrec_yards'] > rushrec_line)
            under_hits = sum(1 for game in games if game['rushrec_yards'] < rushrec_line)
            
            if over_hits >= 4:
                rushrec_trend = "OVER"
                rushrec_rate = f"{over_hits}/{len(games)}"
                player_data.update({
                    "rushrec_line": rushrec_line,
                    "rushrec_over": betting_lines.get("rushrec_over"),
                    "rushrec_under": betting_lines.get("rushrec_under"),
                    "rushrec_trend": rushrec_trend,
                    "rushrec_rate": rushrec_rate
                })
            elif under_hits >= 4:
                rushrec_trend = "UNDER"
                rushrec_rate = f"{under_hits}/{len(games)}"
                player_data.update({
                    "rushrec_line": rushrec_line,
                    "rushrec_over": betting_lines.get("rushrec_over"),
                    "rushrec_under": betting_lines.get("rushrec_under"),
                    "rushrec_trend": rushrec_trend,
                    "rushrec_rate": rushrec_rate
                })
        
        if betting_lines.get("long_rush_line"):
            long_rush_line = betting_lines.get("long_rush_line")
            long_rush_trend = None
            over_hits = sum(1 for game in games if game['longest_rush'] > long_rush_line)
            under_hits = sum(1 for game in games if game['longest_rush'] < long_rush_line)
            
            if over_hits >= 4:
                long_rush_trend = "OVER"
                long_rush_rate = f"{over_hits}/{len(games)}"
                player_data.update({
                    "long_rush_line": long_rush_line,
                    "long_rush_over": betting_lines.get("long_rush_over"),
                    "long_rush_under": betting_lines.get("long_rush_under"),
                    "long_rush_trend": long_rush_trend,
                    "long_rush_rate": long_rush_rate
                })
            elif under_hits >= 4:
                long_rush_trend = "UNDER"
                long_rush_rate = f"{under_hits}/{len(games)}"
                player_data.update({
                    "long_rush_line": long_rush_line,
                    "long_rush_over": betting_lines.get("long_rush_over"),
                    "long_rush_under": betting_lines.get("long_rush_under"),
                    "long_rush_trend": long_rush_trend,
                    "long_rush_rate": long_rush_rate
                })
        
        return player_data
    
    return None


def main():
    # Load both running backs and quarterbacks
    rb_players = load_json(PLAYERS_JSON)
    qb_players = load_json(QUARTERBACKS_JSON)
    rb_lines = load_json(RUNNINGBACK_LINES_JSON)
    public_bets = load_json(PUBLIC_BETS_JSON)
    team_abbreviations = load_json(TEAM_ABBREVIATION_JSON)
    
    # Get teams playing in upcoming games
    upcoming_teams = get_upcoming_game_teams(public_bets)
    print(f"Upcoming games teams: {upcoming_teams}")
    
    results = []

    # Process running backs
    for player_name, data in rb_players.items():
        try:
            position, team, url = data
        except Exception:
            print(f"Bad player row for {player_name}: {data}")
            continue

        # Only analyze players from teams playing in upcoming games
        if team not in upcoming_teams:
            continue

        print(f"Analyzing RB {player_name} ({team})...")
        
        # Analyze player's props
        player_data = analyze_player_props(player_name, team, position, url, rb_lines, public_bets, team_abbreviations)
        if player_data:
            results.append(player_data)
            print(f"✓ {player_name} qualifies with qualifying stats")

    # Process quarterbacks
    for player_name, data in qb_players.items():
        try:
            position, team, url = data
        except Exception:
            print(f"Bad player row for {player_name}: {data}")
            continue

        # Only analyze players from teams playing in upcoming games
        if team not in upcoming_teams:
            continue

        print(f"Analyzing QB {player_name} ({team})...")
        
        # Analyze player's props
        player_data = analyze_player_props(player_name, team, position, url, rb_lines, public_bets, team_abbreviations)
        if player_data:
            results.append(player_data)
            print(f"✓ {player_name} qualifies with qualifying stats")

    # Save results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nFound {len(results)} players hitting their lines in 4/5 or 5/5 recent games")
    print(f"Results saved to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
