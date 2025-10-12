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

def convert_float_line(value):
    try:
        float_val = float(value)
        return float_val
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
    receptions_data = extract_prop_data("recs", response.text)
    rec_yards_data = extract_prop_data("recyds", response.text)

    reciever_lines = {}

    # Parse Completions
    for item in receptions_data:
        name = item.get("name")
        if not name:
            continue
        reciever_lines[name] = {
            "name": name,
            "team": normalize_team_name(item.get("team")),
            "opponent": normalize_team_name(item.get("opp", "").replace("@", "").strip()),
            "receptions_line": convert_float_line(item.get("mgm_recs")),
            "receptions_under": convert_int(item.get("mgm_recsUnder")),
            "receptions_over": convert_int(item.get("mgm_recsOver")),
        }

    # Parse Pass Attempts and add to quarterback records
    for item in rec_yards_data:
        name = item.get("name")
        if not name:
            continue
        if name not in reciever_lines:
            reciever_lines[name] = {
                "name": name,
                "team": normalize_team_name(item.get("team")),
                "opponent": normalize_team_name(item.get("opp", "").replace("@", "").strip()),
            }
        reciever_lines[name]["rec_yards_line"] = convert_float_line(item.get("mgm_recyds"))
        reciever_lines[name]["rec_yards_under"] = convert_int(item.get("mgm_recydsUnder"))
        reciever_lines[name]["rec_yards_over"] = convert_int(item.get("mgm_recydsOver"))

    os.makedirs("../json-data", exist_ok=True)
    with open("../json-data/reciever_lines.json", "w") as f:
        json.dump(list(reciever_lines.values()), f, indent=4)

    print(f"[SUCCESS] Saved {len(reciever_lines)} reciever lines with receiving props.")

if __name__ == "__main__":
    main()
