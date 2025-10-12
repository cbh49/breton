import requests
import re
import json
import os

url = "https://www.rotowire.com/betting/nfl/player-props.php"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
}

team_name_mapping = {
    "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs", "LV": "Las Vegas Raiders", "LAC": "Los Angeles Chargers",
    "LAR": "Los Angeles Rams", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
    "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
    "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks", "SF": "San Francisco 49ers", "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans", "WAS": "Washington Commanders"
}

def normalize_team_name(team_name):
    return team_name_mapping.get(team_name, team_name)

def convert_float(value):
    try:
        float_val = float(value)
        if float_val > 0:
            return f"+{float_val}"
        return float_val
    except (ValueError, TypeError):
        return None

def convert_int(value):
    try:
        int_val = int(value)
        if int_val > 0:
            return f"+{int_val}"
        return int_val
    except (ValueError, TypeError):
        return None

def extract_prop_data(prop_name, html):
    match = re.search(
        rf'prop\s*=\s*"{prop_name}".*?settings\s*=\s*\{{[^}}]*data\s*:\s*(\[\{{.*?\}}\])',
        html,
        re.DOTALL
    )
    if not match:
        print(f"[ERROR] Could not find data for prop = '{prop_name}'.")
        return []
    try:
        json_text = match.group(1)
        json_text = json_text[:json_text.rfind("]") + 1]
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON decode failed for '{prop_name}': {e}")
        return []

def main():
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        print(f"[ERROR] Failed to fetch page: {response.status_code}")
        return

    # Extract individual passing props data
    td_data = extract_prop_data("anytd", response.text)
    twotd_data = extract_prop_data("twotd", response.text)
    threetd_data = extract_prop_data("threetd", response.text)

    touchdown_lines = {}

    # Parse Completions
    for item in td_data:
        name = item.get("name")
        if not name:
            continue
        touchdown_lines[name] = {
            "name": name,
            "team": normalize_team_name(item.get("team")),
            "opponent": normalize_team_name(item.get("opp", "").replace("@", "").strip()),
            "touchdowns_line": 0.5,
            "touchdown_odds": convert_int(item.get("fanduel_anytd")),
        }

    # Parse Pass Attempts and add to quarterback records
    for item in twotd_data:
        name = item.get("name")
        if not name:
            continue
        if name not in touchdown_lines:
            touchdown_lines[name] = {
                "name": name,
                "team": normalize_team_name(item.get("team")),
                "opponent": normalize_team_name(item.get("opp", "").replace("@", "").strip()),
            }
        touchdown_lines[name]["two_td_line"] = 1.5
        touchdown_lines[name]["two_td_odds"] = convert_int(item.get("fanduel_twotd"))

    # Parse Pass Yards and add to quarterback records
    for item in threetd_data:
        name = item.get("name")
        if not name:
            continue
        if name not in touchdown_lines:
            touchdown_lines[name] = {
                "name": name,
                "team": normalize_team_name(item.get("team")),
                "opponent": normalize_team_name(item.get("opp", "").replace("@", "").strip()),
            }
        touchdown_lines[name]["three_td_line"] = 2.5
        touchdown_lines[name]["three_td_odds"] = convert_int(item.get("fanduel_threetd"))

    os.makedirs("../json-data", exist_ok=True)
    with open("../json-data/touchdown_lines.json", "w") as f:
        json.dump(list(touchdown_lines.values()), f, indent=4)

    print(f"[SUCCESS] Saved {len(touchdown_lines)} touchdown lines.")

if __name__ == "__main__":
    main()
