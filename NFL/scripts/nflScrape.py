import pandas as pd
import requests
from bs4 import BeautifulSoup
import json

# Load team name normalization mapping
def load_team_mapping():
    try:
        with open("../json-links/team-normalization.json", "r") as f:
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


# Get team names from the first scraping operation to initialize the team_stats
def get_team_names_from_web():
    """Get team names from the web to initialize team_stats"""
    url = 'https://www.teamrankings.com/nfl/stat/plays-per-game'
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
                
                # Initialize team stats for each team found (only if not already exists)
                if normalized_team_name not in team_stats:
                    team_stats[normalized_team_name] = {
                    # Traditional stats fields
                    "points_per_game": None,  # Will be filled from web scraping
                    "points_per_game_ranking": None,
                    "points_allowed_per_game": None,  # Will be filled from web scraping
                    "points_allowed_per_game_ranking": None,
                    "pace": None,  # Will be filled from web scraping
                    "pace_ranking": None,
                    "pass_yards_per_game": None,
                    "pass_yards_per_game_ranking": None,
                    "pass_yards_allowed_per_game": None,
                    "pass_yards_allowed_per_game_ranking": None,
                    "rush_yards_per_game": None,
                    "rush_yards_per_game_ranking": None,
                    "rush_yards_allowed_per_game": None,
                    "rush_yards_allowed_per_game_ranking": None,
                    "third_down_offense": None,
                    "third_down_offense_ranking": None,
                    "third_down_defense": None,
                    "third_down_defense_ranking": None,
                    "redzone_offense": None,
                    "redzone_offense_ranking": None,
                    "redzone_defense": None,
                    "redzone_defense_ranking": None,
                    "schedule_strength": None,
                    "schedule_strength_ranking": None,
                    "interceptions_per_game": None,
                    "interceptions_per_game_ranking": None,
                    "completions_allowed_per_game": None,
                    "completions_allowed_per_game_ranking": None,
                    "pass_attempts_allowed_per_game": None,
                    "pass_attempts_allowed_per_game_ranking": None,
                    "pass_touchdowns_allowed_per_game": None,
                    "pass_touchdowns_allowed_per_game_ranking": None,
                    "rush_touchdowns_allowed_per_game": None,
                    "rush_touchdowns_allowed_per_game_ranking": None,
                    "redzone_tds_per_game": None,
                    "redzone_tds_per_game_ranking": None,
                    "touchdowns_per_game": None,
                    "touchdowns_per_game_ranking": None,
                    "turnover_margin": None,
                    "turnover_margin_ranking": None,
                    "penalties_per_game": None,
                    "penalties_per_game_ranking": None,
                    "ats_record": None,  # Will be filled from ATS trends scraping
                    "ats_percentage": None,  # Will be filled from ATS trends scraping
                    "epa_per_play": None,  # Will be filled from SumerSports scraping
                    "play_success_rate": None,  # Will be filled from SumerSports scraping
                    "epa_pass": None,  # Will be filled from SumerSports scraping
                    "epa_rush": None,  # Will be filled from SumerSports scraping
                    "epa_per_play_defense": None,  # Will be filled from SumerSports defensive scraping
                    "play_success_rate_defense": None,  # Will be filled from SumerSports defensive scraping
                    "epa_pass_defense": None,  # Will be filled from SumerSports defensive scraping
                    "epa_rush_defense": None,  # Will be filled from SumerSports defensive scraping
                    "epa_per_play_rank": None,  # Will be calculated after scraping
                    "play_success_rate_rank": None,  # Will be calculated after scraping
                    "epa_pass_rank": None,  # Will be calculated after scraping
                    "epa_rush_rank": None,  # Will be calculated after scraping
                    "epa_per_play_defense_rank": None,  # Will be calculated after scraping
                    "play_success_rate_defense_rank": None,  # Will be calculated after scraping
                    "epa_pass_defense_rank": None,  # Will be calculated after scraping
                    "epa_rush_defense_rank": None,  # Will be calculated after scraping
                    "completions_per_game": None,  # Will be filled from TeamRankings scraping
                    "completions_per_game_ranking": None,
                    "pass_attempts_per_game": None,  # Will be filled from TeamRankings scraping
                    "pass_attempts_per_game_ranking": None,
                    "pass_touchdowns_per_game": None,  # Will be filled from TeamRankings scraping
                    "pass_touchdowns_per_game_ranking": None,
                    "interceptions_thrown_per_game": None,  # Will be filled from TeamRankings scraping
                    "interceptions_thrown_per_game_ranking": None,
                    "rush_touchdowns_per_game": None,  # Will be filled from TeamRankings scraping
                    "rush_touchdowns_per_game_ranking": None,
                    "redzone_touchdowns_per_game_allowed": None,  # Will be filled from TeamRankings scraping
                    "redzone_touchdowns_per_game_allowed_ranking": None,
                    "touchdowns_per_game_allowed": None,  # Will be filled from TeamRankings scraping
                    "touchdowns_per_game_allowed_ranking": None
                    }

# Initialize team_stats with team names from web
get_team_names_from_web()

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

# Scrape pace values
url = 'https://www.teamrankings.com/nfl/stat/plays-per-game'
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
                try:
                    pace_value = right_values[0].get_text(strip=True)
                    pace = float(pace_value) if pace_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['pace'] = pace
                        team_stats[normalized_team_name]['pace_ranking'] = ranking
                except ValueError:
                    # Skip this row if we can't convert the value
                    continue


# Scrape pointsAllowed (opponent points per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-points-per-game'
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
                try:
                    points_allowed_value = right_values[0].get_text(strip=True)
                    pointsAllowed = float(points_allowed_value) if points_allowed_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['points_allowed_per_game'] = pointsAllowed
                        team_stats[normalized_team_name]['points_allowed_per_game_ranking'] = ranking
                except ValueError:
                    # Skip this row if we can't convert the value
                    continue


# Scrape pointsPG (points per game)
url = 'https://www.teamrankings.com/nfl/stat/points-per-game'
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
                try:
                    points_pg_value = right_values[0].get_text(strip=True)
                    pointsPG = float(points_pg_value) if points_pg_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['points_per_game'] = pointsPG
                        team_stats[normalized_team_name]['points_per_game_ranking'] = ranking
                except ValueError:
                    # Skip this row if we can't convert the value
                    continue

# Team Pass Yards per game
url = 'https://www.teamrankings.com/nfl/stat/passing-yards-per-game'
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
                    try:
                        pass_ypg_value = right_values[0].get_text(strip=True)
                        passYPG = float(pass_ypg_value) if pass_ypg_value != '--' else None
                        
                        # Normalize team name AFTER scraping
                        normalized_team_name = normalize_team_name(team_name)
                        
                        if normalized_team_name in team_stats:
                            team_stats[normalized_team_name]['pass_yards_per_game'] = passYPG
                            team_stats[normalized_team_name]['pass_yards_per_game_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue


# Team Pass Yards Allowed per game
url = 'https://www.teamrankings.com/nfl/stat/opponent-passing-yards-per-game'
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
                    try:
                        pass_yards_allowed_value = right_values[0].get_text(strip=True)
                        passYardsAllowed = float(pass_yards_allowed_value) if pass_yards_allowed_value != '--' else None
                        
                        # Normalize team name AFTER scraping
                        normalized_team_name = normalize_team_name(team_name)
                        
                        if normalized_team_name in team_stats:
                            team_stats[normalized_team_name]['pass_yards_allowed_per_game'] = passYardsAllowed
                            team_stats[normalized_team_name]['pass_yards_allowed_per_game_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue


# Rushing Yards Per Game
url = 'https://www.teamrankings.com/nfl/stat/rushing-yards-per-game'
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
                    try:
                        rush_ypg_value = right_values[0].get_text(strip=True)
                        rushYPG = float(rush_ypg_value) if rush_ypg_value != '--' else None
                        
                        # Normalize team name AFTER scraping
                        normalized_team_name = normalize_team_name(team_name)
                        
                        if normalized_team_name in team_stats:
                            team_stats[normalized_team_name]['rush_yards_per_game'] = rushYPG
                            team_stats[normalized_team_name]['rush_yards_per_game_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue


# Rushing Yards Allowed Per Game
url = 'https://www.teamrankings.com/nfl/stat/opponent-rushing-yards-per-game'
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
                    try:
                        rush_yards_allowed_value = right_values[0].get_text(strip=True)
                        rushYardsAllowed = float(rush_yards_allowed_value) if rush_yards_allowed_value != '--' else None
                        
                        # Normalize team name AFTER scraping
                        normalized_team_name = normalize_team_name(team_name)
                        
                        if normalized_team_name in team_stats:
                            team_stats[normalized_team_name]['rush_yards_allowed_per_game'] = rushYardsAllowed
                            team_stats[normalized_team_name]['rush_yards_allowed_per_game_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue


# Third Down Conversion Rate
url = 'https://www.teamrankings.com/nfl/stat/third-down-conversion-pct'
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
                    try:
                        third_o_value = right_values[0].get_text(strip=True)
                        if third_o_value != '--':
                            thirdOffense = third_o_value.rstrip('%')
                            
                            # Normalize team name AFTER scraping
                            normalized_team_name = normalize_team_name(team_name)
                            
                            if normalized_team_name in team_stats:
                                team_stats[normalized_team_name]['third_down_offense'] = float(thirdOffense)
                                team_stats[normalized_team_name]['third_down_offense_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue


# Opponent Third Down Converstion rate 
url = 'https://www.teamrankings.com/nfl/stat/opponent-third-down-conversion-pct'
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
                    try:
                        third_d_value = right_values[0].get_text(strip=True)
                        if third_d_value != '--':
                            thirdDefense = third_d_value.rstrip('%')
                            
                            # Normalize team name AFTER scraping
                            normalized_team_name = normalize_team_name(team_name)
                            
                            if normalized_team_name in team_stats:
                                team_stats[normalized_team_name]['third_down_defense'] = float(thirdDefense)
                                team_stats[normalized_team_name]['third_down_defense_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue

# Redzone Offense
url = 'https://www.teamrankings.com/nfl/stat/red-zone-scoring-pct'
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
                    try:
                        red_o_value = right_values[0].get_text(strip=True)
                        if red_o_value != '--':
                            redzoneOffense = red_o_value.rstrip('%')
                            
                            # Normalize team name AFTER scraping
                            normalized_team_name = normalize_team_name(team_name)
                            
                            if normalized_team_name in team_stats:
                                team_stats[normalized_team_name]['redzone_offense'] = float(redzoneOffense)
                                team_stats[normalized_team_name]['redzone_offense_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue


# Redzone Defense
url = 'https://www.teamrankings.com/nfl/stat/opponent-red-zone-scoring-pct'
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
                    try:
                        red_d_value = right_values[0].get_text(strip=True)
                        if red_d_value != '--':
                            redzoneDefense = red_d_value.rstrip('%')
                            
                            # Normalize team name AFTER scraping
                            normalized_team_name = normalize_team_name(team_name)
                            
                            if normalized_team_name in team_stats:
                                team_stats[normalized_team_name]['redzone_defense'] = float(redzoneDefense)
                                team_stats[normalized_team_name]['redzone_defense_ranking'] = ranking
                    except ValueError:
                        # Skip this row if we can't convert the value
                        continue

# Schedule Strength
url = 'https://www.teamrankings.com/nfl/ranking/schedule-strength-by-other?date=2025-01-21'
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
                            team_stats[normalized_team_name]['schedule_strength'] = scheduleStrength
                            team_stats[normalized_team_name]['schedule_strength_ranking'] = scheduleStrengthRanking
                        else:
                            print(f"Team {normalized_team_name} not found in team_stats")
                    except ValueError as e:
                        print(f"Error parsing schedule strength data for {team_name}: {e}")
else:
    print(f"Failed to get schedule strength data. Status code: {response.status_code}")

# Scrape interceptions per game
url = 'https://www.teamrankings.com/nfl/stat/interceptions-per-game'
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
                try:
                    interceptions_value = right_values[0].get_text(strip=True)
                    interceptions = float(interceptions_value) if interceptions_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['interceptions_per_game'] = interceptions
                        team_stats[normalized_team_name]['interceptions_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape completions allowed (opponent completions per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-completions-per-game'
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
                try:
                    completions_value = right_values[0].get_text(strip=True)
                    completions = float(completions_value) if completions_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['completions_allowed_per_game'] = completions
                        team_stats[normalized_team_name]['completions_allowed_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape pass attempts allowed (opponent pass attempts per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-pass-attempts-per-game'
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
                try:
                    pass_attempts_value = right_values[0].get_text(strip=True)
                    pass_attempts = float(pass_attempts_value) if pass_attempts_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['pass_attempts_allowed_per_game'] = pass_attempts
                        team_stats[normalized_team_name]['pass_attempts_allowed_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape pass touchdowns allowed (opponent passing touchdowns per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-passing-touchdowns-per-game'
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
                try:
                    pass_tds_value = right_values[0].get_text(strip=True)
                    pass_tds = float(pass_tds_value) if pass_tds_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['pass_touchdowns_allowed_per_game'] = pass_tds
                        team_stats[normalized_team_name]['pass_touchdowns_allowed_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape rush touchdowns allowed (opponent rushing touchdowns per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-rushing-touchdowns-per-game'
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
                try:
                    rush_tds_value = right_values[0].get_text(strip=True)
                    rush_tds = float(rush_tds_value) if rush_tds_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['rush_touchdowns_allowed_per_game'] = rush_tds
                        team_stats[normalized_team_name]['rush_touchdowns_allowed_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape red zone TDs per game
url = 'https://www.teamrankings.com/nfl/stat/red-zone-scores-per-game'
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
                try:
                    redzone_tds_value = right_values[0].get_text(strip=True)
                    redzone_tds = float(redzone_tds_value) if redzone_tds_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['redzone_tds_per_game'] = redzone_tds
                        team_stats[normalized_team_name]['redzone_tds_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape touchdowns per game (offensive touchdowns per game)
url = 'https://www.teamrankings.com/nfl/stat/offensive-touchdowns-per-game'
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
                try:
                    touchdowns_value = right_values[0].get_text(strip=True)
                    touchdowns = float(touchdowns_value) if touchdowns_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['touchdowns_per_game'] = touchdowns
                        team_stats[normalized_team_name]['touchdowns_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Scrape turnover margin per game
url = 'https://www.teamrankings.com/nfl/stat/turnover-margin-per-game'
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
                try:
                    turnover_margin_value = right_values[0].get_text(strip=True)
                    turnover_margin = float(turnover_margin_value) if turnover_margin_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['turnover_margin'] = turnover_margin
                        team_stats[normalized_team_name]['turnover_margin_ranking'] = ranking
                except ValueError:
                    continue

# Scrape penalties per game
url = 'https://www.teamrankings.com/nfl/stat/penalties-per-game'
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
                try:
                    penalties_value = right_values[0].get_text(strip=True)
                    penalties = float(penalties_value) if penalties_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['penalties_per_game'] = penalties
                        team_stats[normalized_team_name]['penalties_per_game_ranking'] = ranking
                except ValueError:
                    continue

# ATS (Against The Spread) Trends
url = 'https://www.teamrankings.com/nfl/trends/ats_trends/'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.find_all('tr')
    
    print(f"Found {len(rows)} rows in ATS trends table")
    
    for row in rows:
        # Skip header row
        if row.find('th'):
            continue
            
        # Get all cells in the row
        all_cells = row.find_all('td')
        
        if len(all_cells) >= 3:
            try:
                # Team name is in the first column (index 0)
                team_cell = all_cells[0]
                team_link = team_cell.find('a')
                if team_link:
                    team_name = team_link.get_text(strip=True)
                    
                    # ATS record is in the second column (index 1) - format like "12-1-1"
                    ats_record = all_cells[1].get_text(strip=True)
                    
                    # ATS percentage is in the third column (index 2) - format like "85.7%"
                    ats_percentage_text = all_cells[2].get_text(strip=True)
                    ats_percentage = float(ats_percentage_text.rstrip('%')) if ats_percentage_text else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['ats_record'] = ats_record
                        team_stats[normalized_team_name]['ats_percentage'] = ats_percentage
                    else:
                        print(f"Team {normalized_team_name} not found in team_stats")
                        
            except (ValueError, AttributeError) as e:
                print(f"Error parsing ATS trends data: {e}")
                continue
else:
    print(f"Failed to get ATS trends data. Status code: {response.status_code}")

# Completions per game
url = 'https://www.teamrankings.com/nfl/stat/completions-per-game'
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
                try:
                    completions_value = right_values[0].get_text(strip=True)
                    completions = float(completions_value) if completions_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['completions_per_game'] = completions
                        team_stats[normalized_team_name]['completions_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Pass attempts per game
url = 'https://www.teamrankings.com/nfl/stat/pass-attempts-per-game'
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
                try:
                    pass_attempts_value = right_values[0].get_text(strip=True)
                    pass_attempts = float(pass_attempts_value) if pass_attempts_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['pass_attempts_per_game'] = pass_attempts
                        team_stats[normalized_team_name]['pass_attempts_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Pass touchdowns per game
url = 'https://www.teamrankings.com/nfl/stat/passing-touchdowns-per-game'
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
                try:
                    pass_tds_value = right_values[0].get_text(strip=True)
                    pass_tds = float(pass_tds_value) if pass_tds_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['pass_touchdowns_per_game'] = pass_tds
                        team_stats[normalized_team_name]['pass_touchdowns_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Interceptions thrown per game
url = 'https://www.teamrankings.com/nfl/stat/interceptions-thrown-per-game'
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
                try:
                    interceptions_value = right_values[0].get_text(strip=True)
                    interceptions = float(interceptions_value) if interceptions_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['interceptions_thrown_per_game'] = interceptions
                        team_stats[normalized_team_name]['interceptions_thrown_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Rush touchdowns per game
url = 'https://www.teamrankings.com/nfl/stat/rushing-touchdowns-per-game'
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
                try:
                    rush_tds_value = right_values[0].get_text(strip=True)
                    rush_tds = float(rush_tds_value) if rush_tds_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['rush_touchdowns_per_game'] = rush_tds
                        team_stats[normalized_team_name]['rush_touchdowns_per_game_ranking'] = ranking
                except ValueError:
                    continue

# Red zone touchdowns per game allowed (opponent red zone scores per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-red-zone-scores-per-game'
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
                try:
                    redzone_tds_allowed_value = right_values[0].get_text(strip=True)
                    redzone_tds_allowed = float(redzone_tds_allowed_value) if redzone_tds_allowed_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['redzone_touchdowns_per_game_allowed'] = redzone_tds_allowed
                        team_stats[normalized_team_name]['redzone_touchdowns_per_game_allowed_ranking'] = ranking
                except ValueError:
                    continue

# Touchdowns per game allowed (opponent touchdowns per game)
url = 'https://www.teamrankings.com/nfl/stat/opponent-touchdowns-per-game'
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
                try:
                    tds_allowed_value = right_values[0].get_text(strip=True)
                    tds_allowed = float(tds_allowed_value) if tds_allowed_value != '--' else None
                    
                    # Normalize team name AFTER scraping
                    normalized_team_name = normalize_team_name(original_team_name)
                    
                    if normalized_team_name in team_stats:
                        team_stats[normalized_team_name]['touchdowns_per_game_allowed'] = tds_allowed
                        team_stats[normalized_team_name]['touchdowns_per_game_allowed_ranking'] = ranking
                except ValueError:
                    continue

# SumerSports Offensive Stats
url = 'https://sumersports.com/teams/offensive/'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the table containing the offensive stats
    table = soup.find('table')
    if table:
        rows = table.find_all('tr')
        
        print(f"Found {len(rows)} rows in SumerSports offensive stats table")
        
        for row in rows:
            # Skip header row
            if row.find('th'):
                continue
                
            # Get all cells in the row
            all_cells = row.find_all('td')
            
            if len(all_cells) >= 6:  # Ensure we have enough columns
                try:
                    # Team name is in the first column (index 0)
                    team_cell = all_cells[0]
                    team_div = team_cell.find('div', class_='flex size-full min-w-[210px] items-center gap-2 ml-1 mr-3 font-medium whitespace-nowrap')
                    if team_div:
                        team_p = team_div.find('p', class_='h-min text-left')
                        if team_p:
                            team_name = team_p.get_text(strip=True)
                            
                            # Extract stats from the appropriate columns
                            # Index 2: EPA/Play
                            epa_per_play_cell = all_cells[2]
                            epa_per_play_div = epa_per_play_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if epa_per_play_div:
                                epa_per_play_value = epa_per_play_div.get_text(strip=True)
                                epa_per_play = float(epa_per_play_value) if epa_per_play_value != '--' else None
                            
                            # Index 4: Success % (skip index 3 which is Total EPA)
                            success_rate_cell = all_cells[4]
                            success_rate_div = success_rate_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if success_rate_div:
                                success_rate_value = success_rate_div.get_text(strip=True)
                                if success_rate_value != '--':
                                    # Remove % and convert to float
                                    play_success_rate = float(success_rate_value.rstrip('%'))
                                else:
                                    play_success_rate = None
                            
                            # Index 5: EPA/Pass
                            epa_pass_cell = all_cells[5]
                            epa_pass_div = epa_pass_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if epa_pass_div:
                                epa_pass_value = epa_pass_div.get_text(strip=True)
                                epa_pass = float(epa_pass_value) if epa_pass_value != '--' else None
                            
                            # Index 6: EPA/Rush
                            epa_rush_cell = all_cells[6]
                            epa_rush_div = epa_rush_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if epa_rush_div:
                                epa_rush_value = epa_rush_div.get_text(strip=True)
                                epa_rush = float(epa_rush_value) if epa_rush_value != '--' else None
                            
                            # Normalize team name AFTER scraping
                            normalized_team_name = normalize_team_name(team_name)
                            
                            if normalized_team_name in team_stats:
                                team_stats[normalized_team_name]['epa_per_play'] = epa_per_play
                                team_stats[normalized_team_name]['play_success_rate'] = play_success_rate
                                team_stats[normalized_team_name]['epa_pass'] = epa_pass
                                team_stats[normalized_team_name]['epa_rush'] = epa_rush
                            else:
                                print(f"Team {normalized_team_name} not found in team_stats")
                                
                except (ValueError, AttributeError) as e:
                    print(f"Error parsing SumerSports offensive stats data: {e}")
                    continue
    else:
        print("Could not find table in SumerSports offensive stats page")
else:
    print(f"Failed to get SumerSports offensive stats data. Status code: {response.status_code}")

# SumerSports Defensive Stats
url = 'https://sumersports.com/teams/defensive/'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the table containing the defensive stats
    table = soup.find('table')
    if table:
        rows = table.find_all('tr')
        
        print(f"Found {len(rows)} rows in SumerSports defensive stats table")
        
        for row in rows:
            # Skip header row
            if row.find('th'):
                continue
                
            # Get all cells in the row
            all_cells = row.find_all('td')
            
            if len(all_cells) >= 6:  # Ensure we have enough columns
                try:
                    # Team name is in the first column (index 0)
                    team_cell = all_cells[0]
                    team_div = team_cell.find('div', class_='flex size-full min-w-[210px] items-center gap-2 ml-1 mr-3 font-medium whitespace-nowrap')
                    if team_div:
                        team_p = team_div.find('p', class_='h-min text-left')
                        if team_p:
                            team_name = team_p.get_text(strip=True)
                            
                            # Extract stats from the appropriate columns
                            # Index 2: EPA/Play (defensive)
                            epa_per_play_cell = all_cells[2]
                            epa_per_play_div = epa_per_play_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if epa_per_play_div:
                                epa_per_play_value = epa_per_play_div.get_text(strip=True)
                                epa_per_play_defense = float(epa_per_play_value) if epa_per_play_value != '--' else None
                            
                            # Index 4: Success % (defensive) (skip index 3 which is Total EPA)
                            success_rate_cell = all_cells[4]
                            success_rate_div = success_rate_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if success_rate_div:
                                success_rate_value = success_rate_div.get_text(strip=True)
                                if success_rate_value != '--':
                                    # Remove % and convert to float
                                    play_success_rate_defense = float(success_rate_value.rstrip('%'))
                                else:
                                    play_success_rate_defense = None
                            
                            # Index 5: EPA/Pass (defensive)
                            epa_pass_cell = all_cells[5]
                            epa_pass_div = epa_pass_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if epa_pass_div:
                                epa_pass_value = epa_pass_div.get_text(strip=True)
                                epa_pass_defense = float(epa_pass_value) if epa_pass_value != '--' else None
                            
                            # Index 6: EPA/Rush (defensive)
                            epa_rush_cell = all_cells[6]
                            epa_rush_div = epa_rush_cell.find('div', class_='flex size-full items-center justify-center p-1')
                            if epa_rush_div:
                                epa_rush_value = epa_rush_div.get_text(strip=True)
                                epa_rush_defense = float(epa_rush_value) if epa_rush_value != '--' else None
                            
                            # Normalize team name AFTER scraping
                            normalized_team_name = normalize_team_name(team_name)
                            
                            if normalized_team_name in team_stats:
                                team_stats[normalized_team_name]['epa_per_play_defense'] = epa_per_play_defense
                                team_stats[normalized_team_name]['play_success_rate_defense'] = play_success_rate_defense
                                team_stats[normalized_team_name]['epa_pass_defense'] = epa_pass_defense
                                team_stats[normalized_team_name]['epa_rush_defense'] = epa_rush_defense
                            else:
                                print(f"Team {normalized_team_name} not found in team_stats")
                                
                except (ValueError, AttributeError) as e:
                    print(f"Error parsing SumerSports defensive stats data: {e}")
                    continue
    else:
        print("Could not find table in SumerSports defensive stats page")
else:
    print(f"Failed to get SumerSports defensive stats data. Status code: {response.status_code}")

# Calculate rankings for EPA stats
def calculate_epa_rankings():
    """Calculate rankings for all EPA stats"""
    
    # Offensive stats (higher is better)
    offensive_stats = [
        'epa_per_play',
        'play_success_rate', 
        'epa_pass',
        'epa_rush'
    ]
    
    # Defensive stats (lower is better)
    defensive_stats = [
        'epa_per_play_defense',
        'play_success_rate_defense',
        'epa_pass_defense', 
        'epa_rush_defense'
    ]
    
    # Calculate offensive rankings (higher = better)
    for stat in offensive_stats:
        # Get all non-None values for this stat
        stat_values = []
        for team_name, team_data in team_stats.items():
            if team_data[stat] is not None:
                stat_values.append((team_name, team_data[stat]))
        
        # Sort by value in descending order (highest first)
        stat_values.sort(key=lambda x: x[1], reverse=True)
        
        # Assign rankings
        for rank, (team_name, value) in enumerate(stat_values, 1):
            team_stats[team_name][f"{stat}_rank"] = rank
    
    # Calculate defensive rankings (lower = better)
    for stat in defensive_stats:
        # Get all non-None values for this stat
        stat_values = []
        for team_name, team_data in team_stats.items():
            if team_data[stat] is not None:
                stat_values.append((team_name, team_data[stat]))
        
        # Sort by value in ascending order (lowest first)
        stat_values.sort(key=lambda x: x[1], reverse=False)
        
        # Assign rankings
        for rank, (team_name, value) in enumerate(stat_values, 1):
            team_stats[team_name][f"{stat}_rank"] = rank

# Calculate all EPA rankings
calculate_epa_rankings()

# Save the final data to teamStats.json
output_file_path = '../json-data/teamStats.json'
with open(output_file_path, 'w') as outfile:
    json.dump(team_stats, outfile, indent=4)

print(f"Team stats saved to {output_file_path}")


