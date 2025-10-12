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
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
RUNNINGBACK_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "runningback_lines.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "rb_vs_opponent_historical.json"

# Seasons to scrape (last 3)
SEASONS = [2024, 2023, 2022]

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; rb-scraper/1.0)"
}
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_REQUESTS = 0.8  # seconds


# CBS uses 3-letter abbreviations. Map full team name -> primary CBS code.
# (Include some alternates for safety; we’ll match against any)
TEAM_TO_ABBR: Dict[str, List[str]] = {
    "Arizona Cardinals": ["ARI", "ARZ"],
    "Atlanta Falcons": ["ATL"],
    "Baltimore Ravens": ["BAL"],
    "Buffalo Bills": ["BUF"],
    "Carolina Panthers": ["CAR"],
    "Chicago Bears": ["CHI"],
    "Cincinnati Bengals": ["CIN"],
    "Cleveland Browns": ["CLE"],
    "Dallas Cowboys": ["DAL"],
    "Denver Broncos": ["DEN"],
    "Detroit Lions": ["DET"],
    "Green Bay Packers": ["GB", "GNB"],
    "Houston Texans": ["HOU"],
    "Indianapolis Colts": ["IND"],
    "Jacksonville Jaguars": ["JAC", "JAX"],
    "Kansas City Chiefs": ["KC", "KCC"],
    "Las Vegas Raiders": ["LV", "LVR", "OAK"],     # legacy
    "Los Angeles Chargers": ["LAC", "SD"],         # legacy
    "Los Angeles Rams": ["LAR", "STL"],            # legacy
    "Miami Dolphins": ["MIA"],
    "Minnesota Vikings": ["MIN"],
    "New England Patriots": ["NE", "NWE"],
    "New Orleans Saints": ["NO", "NOR"],
    "New York Giants": ["NYG"],
    "New York Jets": ["NYJ"],
    "Philadelphia Eagles": ["PHI"],
    "Pittsburgh Steelers": ["PIT"],
    "San Francisco 49ers": ["SF", "SFO"],
    "Seattle Seahawks": ["SEA"],
    "Tampa Bay Buccaneers": ["TB", "TAM"],
    "Tennessee Titans": ["TEN"],
    "Washington Commanders": ["WAS", "WSH", "WFT"],  # legacy
}


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_matchup_map(public_bets: List[Dict]) -> Dict[str, str]:
    """
    Returns a dict mapping each team -> its opponent for the slate.
    Example: {"Dallas Cowboys": "Philadelphia Eagles", "Philadelphia Eagles":"Dallas Cowboys", ...}
    """
    m = {}
    for g in public_bets:
        t1, t2 = g.get("Team1"), g.get("Team2")
        if not t1 or not t2:
            continue
        m[t1] = t2
        m[t2] = t1
    return m


def get_opponent_abbr_for_team(team_full: str, matchup_map: Dict[str, str]) -> Optional[List[str]]:
    """
    Given a player's team full name, find their opponent full name from the matchup map,
    then return the list of acceptable 3-letter abbreviations for that opponent.
    """
    opp_full = matchup_map.get(team_full)
    if not opp_full:
        return None
    abbrs = TEAM_TO_ABBR.get(opp_full)
    return abbrs


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


def analyze_trend(historical_values: List[float], betting_line) -> Optional[str]:
    """
    Analyze trend against betting line based on the specified rules:
    - 2 games: must be over/under in both games
    - 3 games: must be over/under in 2 games
    - 4 games: must be over/under in 3 games
    - 5 games: must be over/under in 4 games
    
    Returns "OVER", "UNDER", or None if no clear trend
    """
    if not historical_values or betting_line is None:
        return None
    
    # Convert betting_line to float if it's a string
    try:
        if isinstance(betting_line, str):
            betting_line = float(betting_line.replace('+', ''))
        else:
            betting_line = float(betting_line)
    except (ValueError, TypeError):
        return None
    
    num_games = len(historical_values)
    over_count = sum(1 for value in historical_values if value > betting_line)
    under_count = sum(1 for value in historical_values if value < betting_line)
    
    # Determine required threshold based on number of games
    if num_games == 2:
        required = 2
    elif num_games == 3:
        required = 2
    elif num_games == 4:
        required = 3
    elif num_games >= 5:
        required = 4
    else:
        return None
    
    if over_count >= required:
        return "OVER"
    elif under_count >= required:
        return "UNDER"
    else:
        return None


def calculate_rate(historical_values: List[float], betting_line: float) -> Optional[str]:
    """
    Calculate the rate of over/under performance.
    Returns format like "3/4" where 3 is the number of overs/unders and 4 is total games.
    """
    if not historical_values or betting_line is None:
        return None
    
    num_games = len(historical_values)
    over_count = sum(1 for value in historical_values if value > betting_line)
    under_count = sum(1 for value in historical_values if value < betting_line)
    
    # Return the higher count (over or under) with total games
    if over_count >= under_count:
        return f"{over_count}/{num_games}"
    else:
        return f"{under_count}/{num_games}"


def get_player_betting_lines(player_name: str, rb_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in rb_lines:
        if player.get("name") == player_name:
            return player
    return None


def scrape_player_vs_opponent(player_name: str, team: str, position: str, base_url: str, target_abbrs: List[str]) -> Optional[Dict]:
    """
    Scrape CBS game logs for given seasons and return stats arrays ONLY for games
    where opponent matches one of target_abbrs (e.g., ["MIA"]).
    Handles Regular Season vs Post-Season column offsets:
      - Opponent index stays at 1
      - Post-Season shifts every stat after opponent left by 1 (no Fantasy Points col)
    Returns None if no matches found.
    """
    # Quick guard: skip college URLs (e.g., Bijan link in example)
    if "/college-football/" in base_url:
        print(f"Skipping (college link): {player_name}")
        return None

    out = {
        "name": player_name,
        "team": team,
        "position": position,
        "opponent": [],
        "rush_attempts": [],
        "rush_yards": [],
        "longest_rush": [],
        "rush_touchdowns": [],
        "rush_fumbles": [],
        "rush_avg": [],
        "receptions": [],
        "rec_yards": [],
        "longest_rec": [],
        "rec_touchdowns": [],
        "rec_fumbles": [],
        "years": [],
    }

    for season in SEASONS:
        season_url = base_url.rstrip("/") + f"/{season}/"
        html = fetch_html(season_url) or fetch_html(base_url.rstrip("/") + f"/{season}")
        if not html:
            print(f"  No page for {player_name} {season} ({season_url})")
            continue

        soup = BeautifulSoup(html, "html.parser")

        # Find tables titled "{YEAR} Regular Season Game Log" or "{YEAR} Post-Season Game Log"
        section_headers = soup.find_all("h4", class_="TableBase-title")
        for h in section_headers:
            title = h.get_text(strip=True)
            if str(season) not in title or "Game Log" not in title:
                continue

            # Detect postseason vs regular
            is_postseason = ("Post-Season" in title) or ("Postseason" in title)
            # Columns after opponent (index 1) shift left by 1 in postseason
            offset = -1 if is_postseason else 0

            wrapper = h.find_parent("div", class_="TableBaseWrapper")
            if not wrapper:
                continue
            rows = wrapper.find_all("tr", class_="TableBase-bodyTr")

            for row in rows:
                tds = row.find_all("td", class_="TableBase-bodyTd")

                # Compute indices based on table type
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

                needed_max = max(i_opp, i_recf)
                if len(tds) <= needed_max:
                    # Not enough columns for this row; skip safely
                    continue

                # Opponent: "@MIA" / "vs MIA" (same index in both table types)
                opp_raw = tds[i_opp].get_text(" ", strip=True)
                opp_code = normalize_opponent_cell(opp_raw)
                if not opp_code or opp_code not in target_abbrs:
                    continue

                # Parse stats (shifted appropriately for postseason)
                rush_attempts   = parse_int(tds[i_ra].get_text(strip=True))
                rush_yards      = parse_int(tds[i_ry].get_text(strip=True))
                longest_rush    = parse_int(tds[i_lr].get_text(strip=True))
                rush_td         = parse_int(tds[i_rtd].get_text(strip=True))
                rush_fum        = parse_int(tds[i_rf].get_text(strip=True))
                rush_avg        = parse_float(tds[i_ravg].get_text(strip=True))
                rec_avg         = parse_float(tds[i_rec_avg].get_text(strip=True))
                receptions      = parse_int(tds[i_rec].get_text(strip=True))
                rec_yards       = parse_int(tds[i_recy].get_text(strip=True))
                longest_rec     = parse_int(tds[i_lrec].get_text(strip=True))
                rec_td          = parse_int(tds[i_rectd].get_text(strip=True))
                rec_fum         = parse_int(tds[i_recf].get_text(strip=True))

                out["opponent"].append(opp_code)
                out["rush_attempts"].append(rush_attempts)
                out["rush_yards"].append(rush_yards)
                out["longest_rush"].append(longest_rush)
                out["rush_touchdowns"].append(rush_td)
                out["rush_fumbles"].append(rush_fum)
                out["rush_avg"].append(rush_avg)
                out["receptions"].append(receptions)
                out["rec_yards"].append(rec_yards)
                out["longest_rec"].append(longest_rec)
                out["rec_touchdowns"].append(rec_td)
                out["rec_fumbles"].append(rec_fum)
                out["years"].append(season)

            time.sleep(SLEEP_BETWEEN_REQUESTS)

    return out if out["opponent"] else None



def main():
    players = load_json(PLAYERS_JSON)
    public_bets = load_json(PUBLIC_BETS_JSON)
    rb_lines = load_json(RUNNINGBACK_LINES_JSON)
    matchup_map = build_matchup_map(public_bets)

    results = []

    for player_name, data in players.items():
        try:
            position, team, url = data
        except Exception:
            print(f"Bad player row for {player_name}: {data}")
            continue

        # Find the player's current opponent from publicBets
        target_abbrs = get_opponent_abbr_for_team(team, matchup_map)
        if not target_abbrs:
            # No scheduled matchup in the provided file
            continue

        # Scrape vs this opponent
        stats = scrape_player_vs_opponent(player_name, team, position, url, target_abbrs)
        if stats:
            # Get betting lines for this player
            betting_lines = get_player_betting_lines(player_name, rb_lines)
            
            if betting_lines:
                # Calculate rush+rec yards for each game
                rushrec_yards = [rush + rec for rush, rec in zip(stats["rush_yards"], stats["rec_yards"])]
                
                # Analyze trends for each stat
                rushrec_trend = analyze_trend(rushrec_yards, betting_lines.get("rushrec_line"))
                rush_yards_trend = analyze_trend(stats["rush_yards"], betting_lines.get("rush_yards_line"))
                long_rush_trend = analyze_trend(stats["longest_rush"], betting_lines.get("long_rush_line"))
                
                # Only save if player has at least one trend
                if rushrec_trend or rush_yards_trend or long_rush_trend:
                    # Add basic player info
                    filtered_stats = {
                        "name": stats["name"],
                        "team": stats["team"],
                        "position": stats["position"],
                        "opponent": stats["opponent"],
                        "years": stats["years"]
                    }
                    
                    # Only add relevant stats and betting data for trends that exist
                    if rushrec_trend:
                        filtered_stats["rushrec_yards"] = rushrec_yards
                        filtered_stats["rushrec_line"] = betting_lines.get("rushrec_line")
                        filtered_stats["rushrec_over"] = betting_lines.get("rushrec_over")
                        filtered_stats["rushrec_under"] = betting_lines.get("rushrec_under")
                        filtered_stats["rushrec_trend"] = rushrec_trend
                        filtered_stats["rushrec_rate"] = calculate_rate(rushrec_yards, betting_lines.get("rushrec_line"))
                    
                    if rush_yards_trend:
                        filtered_stats["rush_yards"] = stats["rush_yards"]
                        filtered_stats["rush_yards_line"] = betting_lines.get("rush_yards_line")
                        filtered_stats["rush_yards_over"] = betting_lines.get("rush_yards_over")
                        filtered_stats["rush_yards_under"] = betting_lines.get("rush_yards_under")
                        filtered_stats["rush_yards_trend"] = rush_yards_trend
                        filtered_stats["rush_yards_rate"] = calculate_rate(stats["rush_yards"], betting_lines.get("rush_yards_line"))
                    
                    if long_rush_trend:
                        filtered_stats["longest_rush"] = stats["longest_rush"]
                        filtered_stats["long_rush_line"] = betting_lines.get("long_rush_line")
                        filtered_stats["long_rush_over"] = betting_lines.get("long_rush_over")
                        filtered_stats["long_rush_under"] = betting_lines.get("long_rush_under")
                        filtered_stats["long_rush_trend"] = long_rush_trend
                        filtered_stats["long_rush_rate"] = calculate_rate(stats["longest_rush"], betting_lines.get("long_rush_line"))
                    
                    results.append(filtered_stats)
            else:
                print(f"No betting lines found for {player_name}")

    # Save combined results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(results)} players to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
