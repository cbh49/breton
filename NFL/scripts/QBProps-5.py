import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

# ---------- Config ----------
SCRIPT_DIR = Path(__file__).parent
PLAYERS_JSON = SCRIPT_DIR.parent / "json-links" / "quarterbacks.json"
QUARTERBACK_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "quarterback_lines.json"
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
TEAM_ABBREVIATION_JSON = SCRIPT_DIR.parent / "json-links" / "team-abbreviation.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "qb_props.json"

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; qb-props-scraper/1.0)"
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


def scrape_last_five_games(player_name: str, game_log_url: str) -> Optional[List[Dict]]:
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

            # Compute indices based on table type for QB stats
            i_opp   = 1
            i_comp  = 4 + offset
            i_att   = 6 + offset
            i_comp_pct = 5 + offset
            i_yards = 7 + offset
            i_avg   = 8 + offset
            i_td    = 9 + offset
            i_int   = 10 + offset
            i_rating = 13 + offset

            needed_max = max(i_opp, i_rating)
            if len(tds) <= needed_max:
                continue

            # Opponent: "@MIA" / "vs MIA"
            opp_raw = tds[i_opp].get_text(" ", strip=True)
            opp_code = normalize_opponent_cell(opp_raw)
            if not opp_code:
                continue

            # Parse QB stats
            pass_completions = parse_int(tds[i_comp].get_text(strip=True))
            pass_attempts = parse_int(tds[i_att].get_text(strip=True))
            completion_pct = parse_float(tds[i_comp_pct].get_text(strip=True))
            pass_yards = parse_int(tds[i_yards].get_text(strip=True))
            yards_per_attempt = parse_float(tds[i_avg].get_text(strip=True))
            pass_touchdowns = parse_int(tds[i_td].get_text(strip=True))
            interceptions = parse_int(tds[i_int].get_text(strip=True))
            passer_rating = parse_float(tds[i_rating].get_text(strip=True))

            # Skip games where the player didn't actually play
            if (pass_attempts == 0 and pass_completions == 0 and pass_yards == 0 and 
                pass_touchdowns == 0 and interceptions == 0):
                continue

            game_data = {
                "opponent": opp_code,
                "pass_completions": pass_completions,
                "pass_attempts": pass_attempts,
                "pass_yards": pass_yards,
                "pass_touchdowns": pass_touchdowns,
                "interceptions": interceptions,
                "passer_rating": passer_rating,
                "completion_pct": completion_pct,
                "yards_per_attempt": yards_per_attempt,
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


def get_player_betting_lines(player_name: str, qb_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in qb_lines:
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


def analyze_player_props(player_name: str, team: str, position: str, url: str, qb_lines: List[Dict], public_bets: List[Dict], team_abbreviations: Dict[str, str]) -> Optional[Dict]:
    """
    Analyze a player's last five games against their betting lines.
    Returns player data if they exceed lines in 4/5 or 5/5 games, None otherwise.
    """
    # Scrape last five games
    games = scrape_last_five_games(player_name, url)
    if not games:
        print(f"No recent games found for {player_name}")
        return None

    # Get betting lines
    betting_lines = get_player_betting_lines(player_name, qb_lines)
    if not betting_lines:
        print(f"No betting lines found for {player_name}")
        return None

    # Check if player has any qualifying stats (above OR below line in both games)
    has_qualifying_stats = False
    
    stat_checks = [
        ("pass_completions", "completions_line"),
        ("pass_attempts", "pass_attempts_line"),
        ("pass_yards", "pass_yards_line"),
        ("pass_touchdowns", "pass_touchdowns_line"),
        ("interceptions", "interceptions_line")
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
            "pass_completions": [game["pass_completions"] for game in games],
            "pass_attempts": [game["pass_attempts"] for game in games],
            "pass_yards": [game["pass_yards"] for game in games],
            "pass_touchdowns": [game["pass_touchdowns"] for game in games],
            "interceptions": [game["interceptions"] for game in games],
            "passer_rating": [game["passer_rating"] for game in games],
            "completion_pct": [game["completion_pct"] for game in games],
            "yards_per_attempt": [game["yards_per_attempt"] for game in games],
            "years": [game["season"] for game in games]
        }
        
        # Add betting lines and trends
        completions_line = betting_lines.get("completions_line")
        pass_attempts_line = betting_lines.get("pass_attempts_line")
        pass_yards_line = betting_lines.get("pass_yards_line")
        pass_touchdowns_line = betting_lines.get("pass_touchdowns_line")
        interceptions_line = betting_lines.get("interceptions_line")
        
        # Calculate trends
        completions_trend = None
        if completions_line:
            if is_above_line_in_most_games(games, "pass_completions", completions_line):
                completions_trend = "OVER"
            elif is_below_line_in_most_games(games, "pass_completions", completions_line):
                completions_trend = "UNDER"
        
        pass_attempts_trend = None
        if pass_attempts_line:
            if is_above_line_in_most_games(games, "pass_attempts", pass_attempts_line):
                pass_attempts_trend = "OVER"
            elif is_below_line_in_most_games(games, "pass_attempts", pass_attempts_line):
                pass_attempts_trend = "UNDER"
        
        pass_yards_trend = None
        if pass_yards_line:
            if is_above_line_in_most_games(games, "pass_yards", pass_yards_line):
                pass_yards_trend = "OVER"
            elif is_below_line_in_most_games(games, "pass_yards", pass_yards_line):
                pass_yards_trend = "UNDER"
        
        pass_touchdowns_trend = None
        if pass_touchdowns_line:
            if is_above_line_in_most_games(games, "pass_touchdowns", pass_touchdowns_line):
                pass_touchdowns_trend = "OVER"
            elif is_below_line_in_most_games(games, "pass_touchdowns", pass_touchdowns_line):
                pass_touchdowns_trend = "UNDER"
        
        interceptions_trend = None
        if interceptions_line:
            if is_above_line_in_most_games(games, "interceptions", interceptions_line):
                interceptions_trend = "OVER"
            elif is_below_line_in_most_games(games, "interceptions", interceptions_line):
                interceptions_trend = "UNDER"
        
        # Add betting lines and trends with appropriate odds based on trend
        player_data.update({
            "completions_line": completions_line,
            "completions_over": betting_lines.get("completions_over"),
            "completions_under": betting_lines.get("completions_under"),
            "pass_attempts_line": pass_attempts_line,
            "pass_attempts_over": betting_lines.get("pass_attempts_over"),
            "pass_attempts_under": betting_lines.get("pass_attempts_under"),
            "pass_yards_line": pass_yards_line,
            "pass_yards_over": betting_lines.get("pass_yards_over"),
            "pass_yards_under": betting_lines.get("pass_yards_under"),
            "pass_touchdowns_line": pass_touchdowns_line,
            "pass_touchdowns_over": betting_lines.get("pass_touchdowns_over"),
            "pass_touchdowns_under": betting_lines.get("pass_touchdowns_under"),
            "interceptions_line": interceptions_line,
            "interceptions_over": betting_lines.get("interceptions_over"),
            "interceptions_under": betting_lines.get("interceptions_under"),
            "completions_trend": completions_trend,
            "pass_attempts_trend": pass_attempts_trend,
            "pass_yards_trend": pass_yards_trend,
            "pass_touchdowns_trend": pass_touchdowns_trend,
            "interceptions_trend": interceptions_trend,
            "completions_rate": f"{sum(1 for game in games if (completions_trend == 'OVER' and game['pass_completions'] > (completions_line or 0)) or (completions_trend == 'UNDER' and game['pass_completions'] < (completions_line or 0)))}/{len(games)}",
            "pass_attempts_rate": f"{sum(1 for game in games if (pass_attempts_trend == 'OVER' and game['pass_attempts'] > (pass_attempts_line or 0)) or (pass_attempts_trend == 'UNDER' and game['pass_attempts'] < (pass_attempts_line or 0)))}/{len(games)}",
            "pass_yards_rate": f"{sum(1 for game in games if (pass_yards_trend == 'OVER' and game['pass_yards'] > (pass_yards_line or 0)) or (pass_yards_trend == 'UNDER' and game['pass_yards'] < (pass_yards_line or 0)))}/{len(games)}",
            "pass_touchdowns_rate": f"{sum(1 for game in games if (pass_touchdowns_trend == 'OVER' and game['pass_touchdowns'] > (pass_touchdowns_line or 0)) or (pass_touchdowns_trend == 'UNDER' and game['pass_touchdowns'] < (pass_touchdowns_line or 0)))}/{len(games)}",
            "interceptions_rate": f"{sum(1 for game in games if (interceptions_trend == 'OVER' and game['interceptions'] > (interceptions_line or 0)) or (interceptions_trend == 'UNDER' and game['interceptions'] < (interceptions_line or 0)))}/{len(games)}"
        })
        
        return player_data
    
    return None


def main():
    players = load_json(PLAYERS_JSON)
    qb_lines = load_json(QUARTERBACK_LINES_JSON)
    public_bets = load_json(PUBLIC_BETS_JSON)
    team_abbreviations = load_json(TEAM_ABBREVIATION_JSON)
    
    # Get teams playing in upcoming games
    upcoming_teams = get_upcoming_game_teams(public_bets)
    print(f"Upcoming games teams: {upcoming_teams}")
    
    results = []

    for player_name, data in players.items():
        try:
            position, team, url = data
        except Exception:
            print(f"Bad player row for {player_name}: {data}")
            continue

        # Only analyze players from teams playing in upcoming games
        if team not in upcoming_teams:
            continue

        print(f"Analyzing {player_name} ({team})...")
        
        # Analyze player's props
        player_data = analyze_player_props(player_name, team, position, url, qb_lines, public_bets, team_abbreviations)
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
