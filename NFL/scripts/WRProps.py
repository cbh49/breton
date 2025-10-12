import json
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup

# ---------- Config ----------
SCRIPT_DIR = Path(__file__).parent
PLAYERS_JSON = SCRIPT_DIR.parent / "json-links" / "recievers_tight_ends.json"
RECEIVER_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "reciever_lines.json"
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
TEAM_ABBREVIATION_JSON = SCRIPT_DIR.parent / "json-links" / "team-abbreviation.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "wr_props.json"

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; wr-props-scraper/1.0)"
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


def scrape_last_four_games(player_name: str, game_log_url: str, position: str) -> Optional[List[Dict]]:
    """
    Scrape the last four games from CBS game log and return stats for those games.
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

        # Get the first four games (most recent)
        recent_rows = rows[:4] if len(rows) >= 4 else rows

        for row in recent_rows:
            tds = row.find_all("td", class_="TableBase-bodyTd")

            # Compute indices based on position (matching historical-wrs.py)
            i_opp = 1
            # Use different columns for RB vs WR/TE (matching historical-wrs.py)
            if position == "RB":
                i_rec = 11 + offset  # Receptions for RB
                i_rec_yds = 12 + offset  # Receiving yards for RB
            elif position == "TE":
                i_rec = 4 + offset  # Receptions for TE
                i_rec_yds = 5 + offset  # Receiving yards for TE
            else:  # WR
                i_rec = 4 + offset  # Receptions for WR
                i_rec_yds = 6 + offset  # Receiving yards for WR

            needed_max = max(i_opp, i_rec, i_rec_yds)
            if len(tds) <= needed_max:
                continue

            # Opponent: "@MIA" / "vs MIA"
            opp_raw = tds[i_opp].get_text(" ", strip=True)
            opp_code = normalize_opponent_cell(opp_raw)
            if not opp_code:
                continue

            # Parse receiving stats (matching historical-wrs.py)
            receptions = parse_int(tds[i_rec].get_text(strip=True))
            rec_yards = parse_float(tds[i_rec_yds].get_text(strip=True))

            # Skip games where all stats are 0 (likely DNP or didn't play)
            if receptions == 0 and rec_yards == 0.0:
                continue

            game_data = {
                "opponent": opp_code,
                "receptions": receptions,
                "rec_yards": rec_yards,
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

    # Return only the first four games
    return games[:4] if len(games) >= 4 else None


def get_player_betting_lines(player_name: str, wr_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in wr_lines:
        if player.get("name") == player_name:
            return player
    return None


def is_above_line_in_most_games(games: List[Dict], stat_name: str, line: float) -> bool:
    """
    Check if player exceeded the line in 3/4 or 4/4 of the last four games.
    """
    if len(games) < 4 or line is None:
        return False
    
    above_count = sum(1 for game in games if game[stat_name] > line)
    return above_count >= 3


def is_below_line_in_most_games(games: List[Dict], stat_name: str, line: float) -> bool:
    """
    Check if player was below the line in 3/4 or 4/4 of the last four games.
    """
    if len(games) < 4 or line is None:
        return False
    
    below_count = sum(1 for game in games if game[stat_name] < line)
    return below_count >= 3


def analyze_player_props(player_name: str, team: str, position: str, url: str, wr_lines: List[Dict], public_bets: List[Dict], team_abbreviations: Dict[str, str]) -> Optional[Dict]:
    """
    Analyze a player's last four games against their betting lines.
    Returns player data if they exceed lines in 3/4 or 4/4 games, None otherwise.
    """
    # Scrape last four games
    games = scrape_last_four_games(player_name, url, position)
    if not games:
        print(f"No recent games found for {player_name}")
        return None

    # Get betting lines
    betting_lines = get_player_betting_lines(player_name, wr_lines)
    if not betting_lines:
        print(f"No betting lines found for {player_name}")
        return None

    # Check if player has any qualifying stats (above OR below line in both games)
    has_qualifying_stats = False
    
    stat_checks = [
        ("receptions", "receptions_line"),
        ("rec_yards", "rec_yards_line")
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
        
        # Build data structure matching historical format (simplified like historical-wrs.py)
        player_data = {
            "name": player_name,
            "team": team,
            "position": position,
            "opponent": [game["opponent"] for game in games],
            "current_opponent": current_opponent,
            "receptions": [game["receptions"] for game in games],
            "rec_yards": [game["rec_yards"] for game in games],
            "years": [game["season"] for game in games]
        }
        
        # Add betting lines and trends for qualifying stats
        if betting_lines.get("receptions_line"):
            receptions_line = betting_lines.get("receptions_line")
            receptions_trend = None
            over_hits = sum(1 for game in games if game['receptions'] > receptions_line)
            under_hits = sum(1 for game in games if game['receptions'] < receptions_line)
            
            if over_hits >= 3:
                receptions_trend = "OVER"
                receptions_rate = f"{over_hits}/{len(games)}"
                player_data.update({
                    "receptions_line": receptions_line,
                    "receptions_over": betting_lines.get("receptions_over"),
                    "receptions_under": betting_lines.get("receptions_under"),
                    "receptions_trend": receptions_trend,
                    "receptions_rate": receptions_rate
                })
            elif under_hits >= 3:
                receptions_trend = "UNDER"
                receptions_rate = f"{under_hits}/{len(games)}"
                player_data.update({
                    "receptions_line": receptions_line,
                    "receptions_over": betting_lines.get("receptions_over"),
                    "receptions_under": betting_lines.get("receptions_under"),
                    "receptions_trend": receptions_trend,
                    "receptions_rate": receptions_rate
                })
        
        if betting_lines.get("rec_yards_line"):
            rec_yards_line = betting_lines.get("rec_yards_line")
            rec_yards_trend = None
            over_hits = sum(1 for game in games if game['rec_yards'] > rec_yards_line)
            under_hits = sum(1 for game in games if game['rec_yards'] < rec_yards_line)
            
            if over_hits >= 3:
                rec_yards_trend = "OVER"
                rec_yards_rate = f"{over_hits}/{len(games)}"
                player_data.update({
                    "rec_yards_line": rec_yards_line,
                    "rec_yards_over": betting_lines.get("rec_yards_over"),
                    "rec_yards_under": betting_lines.get("rec_yards_under"),
                    "rec_yards_trend": rec_yards_trend,
                    "rec_yards_rate": rec_yards_rate
                })
            elif under_hits >= 3:
                rec_yards_trend = "UNDER"
                rec_yards_rate = f"{under_hits}/{len(games)}"
                player_data.update({
                    "rec_yards_line": rec_yards_line,
                    "rec_yards_over": betting_lines.get("rec_yards_over"),
                    "rec_yards_under": betting_lines.get("rec_yards_under"),
                    "rec_yards_trend": rec_yards_trend,
                    "rec_yards_rate": rec_yards_rate
                })
        
        return player_data
    
    return None


def main():
    players = load_json(PLAYERS_JSON)
    wr_lines = load_json(RECEIVER_LINES_JSON)
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
        player_data = analyze_player_props(player_name, team, position, url, wr_lines, public_bets, team_abbreviations)
        if player_data:
            results.append(player_data)
            print(f"✓ {player_name} qualifies with qualifying stats")

    # Save results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nFound {len(results)} players hitting their lines in 3/4 or 4/4 recent games")
    print(f"Results saved to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
