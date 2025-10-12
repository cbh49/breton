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
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
QUARTERBACK_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "quarterback_lines.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "qb_vs_opponent_historical.json"

# Seasons to scrape (last 3)
SEASONS = [2024, 2023, 2022]

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; qb-scraper/1.0)"
}
REQUEST_TIMEOUT = 15
SLEEP_BETWEEN_REQUESTS = 0.8  # seconds


# CBS uses 3-letter abbreviations. Map full team name -> primary CBS code.
# (Include some alternates for safety; we'll match against any)
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


def analyze_trend(historical_values: List[float], betting_line: float) -> Optional[str]:
    """
    Analyze trend against betting line based on the specified rules:
    - Minimum 2 games required (no single matchup outputs)
    - 2 games: must be over/under in both games (2/2)
    - 3 games: must be over/under in 2 games (2/3)
    - 4 games: must be over/under in 3 games (3/4)
    - 5 games: must be over/under in 4 games (4/5)
    - 6 games: must be over/under in 4 games (4/6)
    - 7+ games: must be over/under in 4 games (4/7+)
    
    Returns "OVER", "UNDER", or None if no clear trend
    """
    if not historical_values or betting_line is None:
        return None
    
    num_games = len(historical_values)
    
    # Guardrail A: Minimum 2 games required
    if num_games < 2:
        return None
    
    over_count = sum(1 for value in historical_values if value > betting_line)
    under_count = sum(1 for value in historical_values if value < betting_line)
    
    # Determine required threshold based on number of games
    if num_games == 2:
        required = 2  # 2/2
    elif num_games == 3:
        required = 2  # 2/3
    elif num_games == 4:
        required = 3  # 3/4
    elif num_games == 5:
        required = 4  # 4/5
    elif num_games == 6:
        required = 4  # 4/6 (Guardrail B: fixed from 3/6)
    else:  # 7+ games
        required = 4  # 4/7+
    
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


def get_player_betting_lines(player_name: str, qb_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in qb_lines:
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
    # Quick guard: skip college URLs (e.g., Bryce Young link in example)
    if "/college-football/" in base_url:
        print(f"Skipping (college link): {player_name}")
        return None

    out = {
        "name": player_name,
        "team": team,
        "position": position,
        "opponent": [],
        "pass_attempts": [],
        "pass_completions": [],
        "pass_yards": [],
        "pass_touchdowns": [],
        "interceptions": [],
        "passer_rating": [],
        "completion_pct": [],
        "yards_per_attempt": [],
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

                # Compute indices based on table type for QB stats
                i_opp   = 1
                i_comp  = 4 + offset
                i_att   =  6 + offset
                i_comp_pct = 5 + offset
                i_yards = 7 + offset
                i_avg   = 8 + offset
                i_td    = 9 + offset
                i_int   = 10 + offset
                i_rating = 13 + offset

                needed_max = max(i_opp, i_rating)
                if len(tds) <= needed_max:
                    # Not enough columns for this row; skip safely
                    continue

                # Opponent: "@MIA" / "vs MIA" (same index in both table types)
                opp_raw = tds[i_opp].get_text(" ", strip=True)
                opp_code = normalize_opponent_cell(opp_raw)
                if not opp_code or opp_code not in target_abbrs:
                    continue

                # Parse QB stats (shifted appropriately for postseason)
                pass_completions = parse_int(tds[i_comp].get_text(strip=True))
                pass_attempts = parse_int(tds[i_att].get_text(strip=True))
                completion_pct = parse_float(tds[i_comp_pct].get_text(strip=True))
                pass_yards = parse_int(tds[i_yards].get_text(strip=True))
                yards_per_attempt = parse_float(tds[i_avg].get_text(strip=True))
                pass_touchdowns = parse_int(tds[i_td].get_text(strip=True))
                interceptions = parse_int(tds[i_int].get_text(strip=True))
                passer_rating = parse_float(tds[i_rating].get_text(strip=True))

                # Skip games where the player didn't actually play (all key stats are 0)
                if (pass_attempts == 0 and pass_completions == 0 and pass_yards == 0 and 
                    pass_touchdowns == 0 and interceptions == 0):
                    continue

                out["opponent"].append(opp_code)
                out["pass_completions"].append(pass_completions)
                out["pass_attempts"].append(pass_attempts)
                out["pass_yards"].append(pass_yards)
                out["pass_touchdowns"].append(pass_touchdowns)
                out["interceptions"].append(interceptions)
                out["passer_rating"].append(passer_rating)
                out["completion_pct"].append(completion_pct)
                out["yards_per_attempt"].append(yards_per_attempt)
                out["years"].append(season)

            time.sleep(SLEEP_BETWEEN_REQUESTS)

    return out if out["opponent"] else None



def main():
    players = load_json(PLAYERS_JSON)
    public_bets = load_json(PUBLIC_BETS_JSON)
    qb_lines = load_json(QUARTERBACK_LINES_JSON)
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
            # Guardrail A: Skip players with less than 2 matchups
            if len(stats["opponent"]) < 2:
                print(f"Skipping {player_name}: only {len(stats['opponent'])} matchup(s) (minimum 2 required)")
                continue
            
            # Get betting lines for this player
            betting_lines = get_player_betting_lines(player_name, qb_lines)
            
            if betting_lines:
                # Add betting lines to stats
                stats["completions_line"] = betting_lines.get("completions_line")
                stats["completions_over"] = betting_lines.get("completions_over")
                stats["completions_under"] = betting_lines.get("completions_under")
                stats["pass_attempts_line"] = betting_lines.get("pass_attempts_line")
                stats["pass_attempts_over"] = betting_lines.get("pass_attempts_over")
                stats["pass_attempts_under"] = betting_lines.get("pass_attempts_under")
                stats["pass_yards_line"] = betting_lines.get("pass_yards_line")
                stats["pass_yards_over"] = betting_lines.get("pass_yards_over")
                stats["pass_yards_under"] = betting_lines.get("pass_yards_under")
                stats["pass_touchdowns_line"] = betting_lines.get("pass_touchdowns_line")
                stats["pass_touchdowns_over"] = betting_lines.get("pass_touchdowns_over")
                stats["pass_touchdowns_under"] = betting_lines.get("pass_touchdowns_under")
                stats["interceptions_line"] = betting_lines.get("interceptions_line")
                stats["interceptions_over"] = betting_lines.get("interceptions_over")
                stats["interceptions_under"] = betting_lines.get("interceptions_under")
                
                # Analyze trends for each stat
                stats["completions_trend"] = analyze_trend(stats["pass_completions"], stats["completions_line"])
                stats["pass_attempts_trend"] = analyze_trend(stats["pass_attempts"], stats["pass_attempts_line"])
                stats["pass_yards_trend"] = analyze_trend(stats["pass_yards"], stats["pass_yards_line"])
                stats["pass_touchdowns_trend"] = analyze_trend(stats["pass_touchdowns"], stats["pass_touchdowns_line"])
                stats["interceptions_trend"] = analyze_trend(stats["interceptions"], stats["interceptions_line"])
                
                # Calculate rates for each stat
                stats["completions_rate"] = calculate_rate(stats["pass_completions"], stats["completions_line"])
                stats["pass_attempts_rate"] = calculate_rate(stats["pass_attempts"], stats["pass_attempts_line"])
                stats["pass_yards_rate"] = calculate_rate(stats["pass_yards"], stats["pass_yards_line"])
                stats["pass_touchdowns_rate"] = calculate_rate(stats["pass_touchdowns"], stats["pass_touchdowns_line"])
                stats["interceptions_rate"] = calculate_rate(stats["interceptions"], stats["interceptions_line"])
            else:
                print(f"No betting lines found for {player_name}")
            
            results.append(stats)

    # Save combined results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(results)} players to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
