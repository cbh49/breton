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
RUNNING_BACKS_JSON = SCRIPT_DIR.parent / "json-links" / "running-backs.json"
QUARTERBACKS_JSON = SCRIPT_DIR.parent / "json-links" / "quarterbacks.json"
PUBLIC_BETS_JSON = SCRIPT_DIR.parent / "json-data" / "publicBets.json"
TOUCHDOWN_LINES_JSON = SCRIPT_DIR.parent / "json-data" / "touchdown_lines.json"
OUTPUT_JSON = SCRIPT_DIR.parent / "json-data" / "td_vs_opponent_historical.json"

# Seasons to scrape (last 3)
SEASONS = [2024, 2023, 2022]

# Respectful scraping
REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; td-scraper/1.0)"
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


def fetch_html(url: str) -> Optional[str]:
    try:
        r = requests.get(url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT)
        if r.status_code == 200:
            return r.text
        return None
    except requests.RequestException:
        return None


def analyze_recent_trend(historical_values: List[float], years: List[int]) -> Optional[Dict]:
    """
    Analyze trend based on the most recent games against a 0.5 touchdown line.
    Games are analyzed in chronological order (2024 -> 2023 -> 2022).
    
    Trend requirements:
    - 2 games: both games > 0.5
    - 3 games: 2 games > 0.5
    - 4 games: 2 games > 0.5
    - 5 games: 3 games > 0.5
    - 6 games: 3 games > 0.5
    - 7 games: 4 games > 0.5
    
    Returns dict with trend info and indices of games that contributed to the trend,
    or None if no trend found.
    """
    if not historical_values:
        return None
    
    # Fixed line of 0.5 touchdowns
    LINE = 0.5
    
    # Games are already in chronological order (most recent first: 2024->2023->2022)
    # since SEASONS = [2024, 2023, 2022]
    values_chronological = historical_values
    years_chronological = years
    
    # Check for trends starting from the most recent games
    for start_idx in range(len(values_chronological)):
        for end_idx in range(start_idx + 1, len(values_chronological) + 1):
            # Get the subset of games we're analyzing
            subset_values = values_chronological[start_idx:end_idx]
            subset_years = years_chronological[start_idx:end_idx]
            
            num_games = len(subset_values)
            over_count = sum(1 for value in subset_values if value > LINE)
            
            # Determine required threshold based on number of games
            if num_games == 2:
                required = 1
            elif num_games == 3:
                required = 1
            elif num_games == 4:
                required = 2
            elif num_games == 5:
                required = 2
            elif num_games == 6:
                required = 3
            elif num_games == 7:
                required = 3
            else:
                continue  # Skip if more than 7 games
            
            if over_count >= required:
                # Found a trend! Return the games that contributed to this trend
                return {
                    "trend": "OVER",
                    "games_count": num_games,
                    "over_count": over_count,
                    "required": required,
                    "line": LINE,
                    "trend_games_indices": list(range(start_idx, end_idx)),
                    "trend_games_values": subset_values,
                    "trend_games_years": subset_years
                }
    
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


def filter_stats_by_trend(stats: Dict, trend_info: Dict) -> Dict:
    """
    Filter the stats to only include the games that contributed to the trend.
    """
    indices = trend_info["trend_games_indices"]
    
    filtered_stats = {
        "name": stats["name"],
        "team": stats["team"],
        "position": stats["position"],
        "opponent": [stats["opponent"][i] for i in indices],
        "receiving_touchdowns": [stats["receiving_touchdowns"][i] for i in indices],
        "rushing_touchdowns": [stats["rushing_touchdowns"][i] for i in indices],
        "total_touchdowns": [stats["total_touchdowns"][i] for i in indices],
        "years": [stats["years"][i] for i in indices],
        "trend_info": trend_info
    }
    
    return filtered_stats


def get_player_betting_lines(player_name: str, td_lines: List[Dict]) -> Optional[Dict]:
    """Get betting lines for a specific player"""
    for player in td_lines:
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
        "receiving_touchdowns": [],
        "rushing_touchdowns": [],
        "total_touchdowns": [],
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

                # Compute indices based on table type for TD stats
                i_opp = 1
                i_rec_td = 8 + offset  # Receiving touchdowns
                
                # Different rushing TD column based on position
                if position == "QB":
                    i_rush_td = 18 + offset  # Rushing touchdowns for QBs
                else:
                    i_rush_td = 14 + offset  # Rushing touchdowns for WR/TE/RB

                needed_max = max(i_opp, i_rec_td, i_rush_td)
                if len(tds) <= needed_max:
                    # Not enough columns for this row; skip safely
                    continue

                # Opponent: "@MIA" / "vs MIA" (same index in both table types)
                opp_raw = tds[i_opp].get_text(" ", strip=True)
                opp_code = normalize_opponent_cell(opp_raw)
                if not opp_code or opp_code not in target_abbrs:
                    continue

                # Parse TD stats (shifted appropriately for postseason)
                receiving_touchdowns = parse_int(tds[i_rec_td].get_text(strip=True))
                rushing_touchdowns = parse_int(tds[i_rush_td].get_text(strip=True))
                
                # For quarterbacks, only use rushing touchdowns (column 18)
                if position == "QB":
                    receiving_touchdowns = 0
                
                total_touchdowns = receiving_touchdowns + rushing_touchdowns

                # Include ALL games against the opponent, even if 0 touchdowns
                # This is important for accurate trend analysis
                out["opponent"].append(opp_code)
                out["receiving_touchdowns"].append(receiving_touchdowns)
                out["rushing_touchdowns"].append(rushing_touchdowns)
                out["total_touchdowns"].append(total_touchdowns)
                out["years"].append(season)

            time.sleep(SLEEP_BETWEEN_REQUESTS)

    return out if out["opponent"] else None


def main():
    # Load all player data
    receivers = load_json(RECEIVERS_JSON)
    running_backs = load_json(RUNNING_BACKS_JSON)
    quarterbacks = load_json(QUARTERBACKS_JSON)
    
    # Combine all players
    all_players = {}
    all_players.update(receivers)
    all_players.update(running_backs)
    all_players.update(quarterbacks)
    
    public_bets = load_json(PUBLIC_BETS_JSON)
    td_lines = load_json(TOUCHDOWN_LINES_JSON)
    matchup_map = build_matchup_map(public_bets)

    results = []

    for player_name, data in all_players.items():
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
        if stats and len(stats["opponent"]) >= 2:  # Must have at least 2 matchups to qualify
            # Analyze trends for total touchdowns against 0.5 line
            trend_info = analyze_recent_trend(stats["total_touchdowns"], stats["years"])
            if trend_info:
                # Only include players who have a trend
                filtered_stats = filter_stats_by_trend(stats, trend_info)
                
                # Get betting lines for this player
                betting_lines = get_player_betting_lines(player_name, td_lines)
                if betting_lines:
                    # Add betting lines to stats
                    filtered_stats["touchdowns_line"] = betting_lines.get("touchdowns_line")
                    filtered_stats["touchdown_odds"] = betting_lines.get("touchdown_odds")
                    filtered_stats["two_td_line"] = betting_lines.get("two_td_line")
                    filtered_stats["two_td_odds"] = betting_lines.get("two_td_odds")
                    filtered_stats["three_td_line"] = betting_lines.get("three_td_line")
                    filtered_stats["three_td_odds"] = betting_lines.get("three_td_odds")
                    
                    # Calculate rate for touchdowns (using 0.5 line)
                    filtered_stats["touchdowns_rate"] = calculate_rate(filtered_stats["total_touchdowns"], 0.5)
                
                results.append(filtered_stats)
            # If no trend found, don't include this player in results

    # Save combined results
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(results)} players to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
