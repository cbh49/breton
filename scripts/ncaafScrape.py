import pandas as pd
import requests
from bs4 import BeautifulSoup
import json

# Load the CSV files for Offensive and Defensive Scores
# file_path = 'C:/Users/charl/Documents/Python_Code/NCAAF/Offensive Beta_Rank_Page 1_Table.csv'
# file_path2 = 'C:/Users/charl/Documents/Python_Code/NCAAF/Defensive Beta_Rank_Page 1_Table.csv'

# df = pd.read_csv(file_path)
# df2 = pd.read_csv(file_path2)

# Extract 'School', 'O_Score' from df and 'School', 'D_Score' from df2
# school_and_score = df[['School', 'O_Score']]
# school_and_scoreD = df2[['School', 'D_Score']]

# Load team name normalization mapping
def load_team_mapping():
    try:
        with open("../json/team-normalization.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("Warning: team-normalization.json not found, using empty mapping")
        return {}

# Load the team mapping
team_name_mapping = load_team_mapping()

# Normalize team names function
def normalize_team_name(team_name):
    return team_name_mapping.get(team_name, team_name)

# Initialize team_stats dictionary to store all scraped data
team_stats = {}

# Add O_Score and D_Score from the CSVs into the team_stats dictionary
# for index, row in school_and_score.iterrows():
#     team_name = normalize_team_name(row['School'])
#     O_Score = row['O_Score']
#     
#     # Find corresponding D_Score in the defensive dataframe
#     D_Score = school_and_scoreD.loc[school_and_scoreD['School'] == row['School'], 'D_Score'].values
#     D_Score = D_Score[0] if len(D_Score) > 0 else None
#     
#     # Initialize team stats with O_Score and D_Score
#     team_stats[team_name] = {
#         "O_Score": O_Score,
#         "D_Score": D_Score,
#         "pointsPG": None,  # Will be filled from web scraping
#         "pointsAllowed": None,  # Will be filled from web scraping
#         "pace": None,  # Will be filled from web scraping
#     }

# Get team names from the first scraping operation to initialize the team_stats
def get_team_names_from_web():
    """Get team names from the web to initialize team_stats"""
    url = 'https://www.teamrankings.com/college-football/stat/plays-per-game'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.find_all('tr')
        
        for row in rows:
            team = row.find('td', class_='text-left nowrap')
            if team:
                original_team_name = team.get_text(strip=True)
                normalized_team_name = normalize_team_name(original_team_name)
                
                # Initialize team stats for each team found
                team_stats[normalized_team_name] = {
                    "O_Score": None,  # No longer available from CSV
                    "D_Score": None,  # No longer available from CSV
                    "pointsPG": None,  # Will be filled from web scraping
                    "pointsAllowed": None,  # Will be filled from web scraping
                    "pace": None,  # Will be filled from web scraping
                    "pace_ranking": None,
                    "passYards": None,
                    "passYards_ranking": None,
                    "passYardsAllowed": None,
                    "passYardsAllowed_ranking": None,
                    "rushYards": None,
                    "rushYards_ranking": None,
                    "rushYardsAllowed": None,
                    "rushYardsAllowed_ranking": None,
                    "thirdOffense": None,
                    "thirdOffense_ranking": None,
                    "thirdDefense": None,
                    "thirdDefense_ranking": None,
                    "redzoneOffense": None,
                    "redzoneOffense_ranking": None,
                    "redzoneDefense": None,
                    "redzoneDefense_ranking": None,
                    "pointsPG_ranking": None,
                    "pointsAllowed_ranking": None,
                    "scheduleStrength": None,
                    "scheduleStrength_ranking": None
                }

# Initialize team_stats with team names from web
get_team_names_from_web()

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

# Scrape pace values
url = 'https://www.teamrankings.com/college-football/stat/plays-per-game'
response = requests.get(url, headers=headers)
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            original_team_name = team.get_text(strip=True)  # Keep original team name from the website
            right_values = row.find_all('td', class_='text-right')
            if len(right_values) > 1:
                pace = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(original_team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['pace'] = pace
                    team_stats[normalized_team_name]['pace_ranking'] = ranking


# Scrape pointsAllowed (opponent points per game)
url = 'https://www.teamrankings.com/college-football/stat/opponent-points-per-game'
response = requests.get(url, headers=headers)
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            original_team_name = team.get_text(strip=True)
            right_values = row.find_all('td', class_='text-right')
            if len(right_values) > 1:
                pointsAllowed = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(original_team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['pointsAllowed'] = pointsAllowed
                    team_stats[normalized_team_name]['pointsAllowed_ranking'] = ranking


# Scrape pointsPG (points per game)
url = 'https://www.teamrankings.com/college-football/stat/points-per-game'
response = requests.get(url, headers=headers)
if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            original_team_name = team.get_text(strip=True)
            right_values = row.find_all('td', class_='text-right')
            if len(right_values) > 1:
                pointsPG = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(original_team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['pointsPG'] = pointsPG
                    team_stats[normalized_team_name]['pointsPG_ranking'] = ranking

# Team Pass Yards per game
url = 'https://www.teamrankings.com/college-football/stat/passing-yards-per-game'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    passYPG = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['passYards'] = passYPG
                    team_stats[normalized_team_name]['passYards_ranking'] = ranking


# Team Pass Yards Allowed per game
url = 'https://www.teamrankings.com/college-football/stat/opponent-passing-yards-per-game'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    passYardsAllowed = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['passYardsAllowed'] = passYardsAllowed
                    team_stats[normalized_team_name]['passYardsAllowed_ranking'] = ranking


# Rushing Yards Per Game
url = 'https://www.teamrankings.com/college-football/stat/rushing-yards-per-game'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    rushYPG = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['rushYards'] = rushYPG
                    team_stats[normalized_team_name]['rushYards_ranking'] = ranking


# Rushing Yards Allowed Per Game
url = 'https://www.teamrankings.com/college-football/stat/opponent-rushing-yards-per-game'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    rushYardsAllowed = float(right_values[0].get_text(strip=True))
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['rushYardsAllowed'] = rushYardsAllowed
                    team_stats[normalized_team_name]['rushYardsAllowed_ranking'] = ranking


# Third Down Conversion Rate
url = 'https://www.teamrankings.com/college-football/stat/third-down-conversion-pct'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    thirdO = (right_values[0].get_text(strip=True))

                thirdOffense = thirdO.rstrip('%')
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['thirdOffense'] = float(thirdOffense)
                    team_stats[normalized_team_name]['thirdOffense_ranking'] = ranking


# Opponent Third Down Converstion rate 
url = 'https://www.teamrankings.com/college-football/stat/opponent-third-down-conversion-pct'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    thirdD = (right_values[0].get_text(strip=True))
                
                thirdDefense = thirdD.rstrip('%')
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['thirdDefense'] = float(thirdDefense)
                    team_stats[normalized_team_name]['thirdDefense_ranking'] = ranking

# Redzone Offense
url = 'https://www.teamrankings.com/college-football/stat/red-zone-scoring-pct'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    redO = (right_values[0].get_text(strip=True))
                
                redzoneOffense = redO.rstrip('%')
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['redzoneOffense'] = float(redzoneOffense)
                    team_stats[normalized_team_name]['redzoneOffense_ranking'] = ranking


# Redzone Defense
url = 'https://www.teamrankings.com/college-football/stat/opponent-red-zone-scoring-pct'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')

    for row in rows:
        team = row.find('td', class_='text-left nowrap')
        if team:
            # Get ranking from first column
            rank_cell = row.find('td', class_='rank text-center')
            ranking = int(rank_cell.get_text(strip=True)) if rank_cell else None
            
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                right_values = row.find_all('td', class_='text-right')
                if len(right_values) > 1:
                    redD = (right_values[0].get_text(strip=True))
                
                redzoneDefense = redD.rstrip('%')
                
                # Normalize team name AFTER scraping
                normalized_team_name = normalize_team_name(team_name)
                
                if normalized_team_name in team_stats:
                    team_stats[normalized_team_name]['redzoneDefense'] = float(redzoneDefense)
                    team_stats[normalized_team_name]['redzoneDefense_ranking'] = ranking

# Schedule Strength
url = 'https://www.teamrankings.com/college-football/ranking/schedule-strength-by-other?date=2025-01-21'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')
    
    print(f"Found {len(rows)} rows in schedule strength table")
    
    for row in rows:
        # Skip header row
        if row.find('th'):
            continue
            
        # Look for team cell with class 'nowrap' (different from other stats pages)
        team = row.find('td', class_='nowrap')
        if team:
            nextLevel = team.find('a')
            if nextLevel:
                team_name = nextLevel.get_text(strip=True)
                
                # Get all cells in the row
                all_cells = row.find_all('td')
                
                if len(all_cells) > 5:
                    try:
                        # Schedule strength value is in the 6th column (index 5)
                        scheduleStrength = float(all_cells[5].get_text(strip=True))
                        
                        # Schedule strength ranking is in the 3rd column (index 2)
                        # The ranking column contains decimal values, so we need to parse it as float first
                        rankingValue = all_cells[2].get_text(strip=True)
                        scheduleStrengthRanking = int(float(rankingValue)) if rankingValue else None
                        
                        # Normalize team name AFTER scraping
                        normalized_team_name = normalize_team_name(team_name)
                        
                        if normalized_team_name in team_stats:
                            team_stats[normalized_team_name]['scheduleStrength'] = scheduleStrength
                            team_stats[normalized_team_name]['scheduleStrength_ranking'] = scheduleStrengthRanking
                        else:
                            print(f"Team {normalized_team_name} not found in team_stats")
                    except ValueError as e:
                        print(f"Error parsing schedule strength data for {team_name}: {e}")
else:
    print(f"Failed to get schedule strength data. Status code: {response.status_code}")

# Save the final data to teamStats.json
output_file_path = 'teamStats.json'
with open(output_file_path, 'w') as outfile:
    json.dump(team_stats, outfile, indent=4)

print(f"Team stats saved to {output_file_path}")
