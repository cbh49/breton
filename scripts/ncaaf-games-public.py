import requests
from bs4 import BeautifulSoup
import json
import re

# Load team name normalization mapping
def load_team_mapping():
    try:
        with open("../json/team-normalization.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: team-normalization.json not found, using empty mapping")
        return {}

# Normalize team names function
def normalize_team_name(team_name, team_mapping):
    return team_mapping.get(team_name, team_name)

# Load the team mapping
team_mapping = load_team_mapping()
url = "https://data.vsin.com/college-football/betting-splits/?_gl=1*1eb8i94*_ga*MTE1MTUxNDE5OS4xNzU1MjkyNzE3*_ga_9JYMWSCRCK*czE3NTU0NDM1ODUkbzQkZzEkdDE3NTU0NDM1OTMkajUyJGwwJGgw"
headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
}
response = requests.get(url, headers=headers)
if response.status_code == 200:
    print("Response 200")
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')
    betting_data = []
    for row in rows[2:]:
        try:
            # Extract team names
            teams = row.find_all('a', class_='txt-color-vsinred')[:2]
            if len(teams) >= 2:
                team1_raw = teams[0].get_text(strip=True)
                team2_raw = teams[1].get_text(strip=True)
                # Normalize team names
                team1 = normalize_team_name(team1_raw, team_mapping)
                team2 = normalize_team_name(team2_raw, team_mapping)
            else:
                continue  # Skip this row if teams are missing
            # Extract spreads
            spreads = row.find_all('div', class_='scorebox_highlight')
            if len(spreads) >= 2:
                team1_spread = spreads[0].get_text(strip=True)
                team2_spread = spreads[1].get_text(strip=True)
            else:
                continue  # Skip this row if spreads are missing
            # Extract spread handles
            spread_handles = row.find_all('div', class_=re.compile(r'(box_highlight_even1|text-center box_highlight_for1 fw-bold)'))
            if len(spread_handles) >= 4:
                team1_spread_handle = spread_handles[0].get_text(strip=True)
                team1_spread_bets = spread_handles[2].get_text(strip=True)
                team2_spread_handle = spread_handles[1].get_text(strip=True)
                team2_spread_bets = spread_handles[3].get_text(strip=True)
            else:
                continue  # Skip this row if spread handles are missing
            # Extract totals
            totals = row.find_all('div', class_='scorebox_highlight')
            if len(totals) >= 2:
                total = totals[2].get_text(strip=True)
            else:
                total = "N/A"
            # Extract handles and bets
            handles_bets = row.find_all('div', class_=re.compile(r'(box_highlight_even1|text-center box_highlight_for1 fw-bold)'))
            if len(handles_bets) >= 4:
                team1_total_handle = handles_bets[4].get_text(strip=True)
                team2_total_handle = handles_bets[5].get_text(strip=True)
                team1_total_bets = handles_bets[6].get_text(strip=True)
                team2_total_bets = handles_bets[7].get_text(strip=True)
            else:
                team1_total_handle = team2_total_handle = team1_total_bets = team2_total_bets = "N/A"
            
            # Extract moneyline values (Money column)
            money_cells = row.find_all('div', class_='scorebox_highlight')
            
            if len(money_cells) >= 6:
                # Based on the debug output, moneyline values are at indices 4 and 5
                # These are values like +114, -135, -270, +220, etc.
                team1_ml = money_cells[4].get_text(strip=True)
                team2_ml = money_cells[5].get_text(strip=True)
            else:
                team1_ml = team2_ml = "N/A"
            # Append data to betting_data
            betting_data.append({
                "Team1": team1,
                "Team2": team2,
                "Team1Spread": team1_spread,
                "Team2Spread": team2_spread,
                "Team1SpreadHandle": team1_spread_handle,
                "Team1SpreadBets": team1_spread_bets,
                "Team2SpreadHandle": team2_spread_handle,
                "Team2SpreadBets": team2_spread_bets,
                "Total": total,
                "Team1TotalHandle": team1_total_handle,
                "Team1TotalBets": team1_total_bets,
                "Team2TotalHandle": team2_total_handle,
                "Team2TotalBets": team2_total_bets,
                "Team1ML": team1_ml,
                "Team2ML": team2_ml,
            })
        except Exception as e:
            print(f"Error processing row: {e}")
    # Save data to JSON
    if betting_data:
        with open("../json-data/publicBets.json", "w") as f:
            json.dump(betting_data, f, indent=4)
        print("Data saved to publicBets.json")
    else:
        print("No data to save")