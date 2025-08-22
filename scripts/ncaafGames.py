import requests
import os
import json


# Get matchups API Call
def fetch_matchups():
    url = "https://sportsbook-api2.p.rapidapi.com/v0/competitions/ei8e-xitw-a3B6/events"

    querystring = {"startTimeFrom": "2025-01-03", "eventType": "MATCH", "startTimeTo": "2025-01-05"}

    headers = {
        "x-rapidapi-key": "a8ed549ce9mshb049aa91c2828b7p18cd9cjsn9c98863495f7",
        "x-rapidapi-host": "sportsbook-api2.p.rapidapi.com"
    }

    # Fetch the response
    response = requests.get(url, headers=headers, params=querystring)

    if response.status_code == 200:
        data = response.json()
        matchups = []  # Empty array for matchups

        for event in data['events']:
            team_1 = event['participants'][0]['name'] if len(event['participants']) > 0 else "Team not found"
            team_2 = event['participants'][1]['name'] if len(event['participants']) > 1 else "Team not found"

            # Skip events with no markets
            if not event.get('markets'):
                continue

            total = None
            spread = None
            moneyline = None

            for market in event['markets']:
                if market['segment'] == "FULL_MATCH":
                    if market['type'] == "POINT_TOTAL":
                        total = market['key']  # key for total to use in next API Call
                        print("We getting the total key?", total)
                    elif market['type'] == "POINT_SPREAD":
                        spread = market['key']  # key for spread to use in next API Call
                        print("We getting the spread key?", spread)
                    elif market['type'] == "MONEYLINE":
                        moneyline = market['key']  # key for ML to use in next API Call
                        print("We getting the ML key?", moneyline)

            matchups.append({
                "team_1": team_1,
                "team_2": team_2,
                "point_total": total,
                "point_spread": spread,
                "moneyline": moneyline
            })
        return matchups
    else:
        print(f"Error fetching matchups.")


def get_lines(market_key):
    if not market_key:
        return []

    url = f"https://sportsbook-api2.p.rapidapi.com/v0/markets/{market_key}/outcomes"
    querystring = {"isLive": "false"}
    headers = {
        "x-rapidapi-key": "a8ed549ce9mshb049aa91c2828b7p18cd9cjsn9c98863495f7",
        "x-rapidapi-host": "sportsbook-api2.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)
    if response.status_code == 200:
        # Filter outcomes where source == "BET_MGM"
        outcomes = response.json().get('outcomes', [])
        bet_mgm_outcomes = [outcome for outcome in outcomes if outcome.get('source') == "DRAFT_KINGS"]
        return bet_mgm_outcomes
    else:
        print(f"Error fetching outcomes for market key {market_key}: {response.status_code}")
        return []


def process_matchup(matchup):
    point_total = None
    point_spread = None
    favorite = None

    # Fetch point total modifier
    if matchup["point_total"]:
        outcomes = get_lines(matchup["point_total"])
        for outcome in outcomes:
            if outcome.get('type') == "UNDER":  # Assuming UNDER for point_total
                point_total = outcome.get('modifier')

    # Fetch point spread and favorite
    if matchup["point_spread"]:
        outcomes = get_lines(matchup["point_spread"])
        print("We getting outcomes?" , outcomes)
        for outcome in outcomes:
            if outcome.get('modifier') is not None:
                # Find the team with the negative spread, which is the favorite
                if outcome['modifier'] < 0:
                    point_spread = outcome['modifier']
                    favorite = outcome['participant']['name'] if outcome.get('participant') else "Unknown"

    return {
        "team_1": matchup["team_1"],
        "team_2": matchup["team_2"],
        "point_total": point_total,
        "point_spread": point_spread,
        "favorite": favorite
    }


def save_data(file_path, data):
    try:
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
        print(f"Matchups data saved to {file_path}")
    except IOError as e:
        print(f"Error saving data to {file_path}: {e}")


# Define file paths
save_path_1 = os.path.join("C:\\Users\\charl\\Documents\\Python_Code\\NCAAF", "ncaafMatchups.json")
save_path_2 = os.path.join("C:\\Users\\charl\\Documents\\Python_Code\\breton\\public", "ncaafMatchups.json")
save_path_3 = os.path.join("C:\\Users\\charl\\Documents\\Python_Code\\breton\\gitclone\\public", "ncaafMatchups.json")

# Main script flow
matchups = fetch_matchups()  # Fetch matchups and market keys

if matchups:
    detailed_matchups = [process_matchup(matchup) for matchup in matchups]  # Process each matchup
    save_data(save_path_1, detailed_matchups)  # Save data to all defined paths
    save_data(save_path_2, detailed_matchups)
    save_data(save_path_3, detailed_matchups)
