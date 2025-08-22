import json
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    # Fallback for systems where PIL might not be available
    print("PIL/Pillow not found. Please install with: pip install Pillow")
    exit(1)
import os
try:
    import requests
except ImportError:
    print("requests not found. Please install with: pip install requests")
    exit(1)
from io import BytesIO

# Load JSON data
with open('../json-data/publicBets.json', 'r') as f:
    public_bets_data = json.load(f)

with open('../teamStats.json', 'r') as f:
    team_stats_data = json.load(f)

# Load logo mapping from CSV and download logos
logo_mapping = {}
logo_cache = {}

def download_logo(url, team_name):
    """Download and cache team logo"""
    if not url or url == "" or not url.startswith('http'):
        return None
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            logo = Image.open(BytesIO(response.content)).convert("RGBA")
            logo_cache[team_name] = logo
            return logo
        else:
            print(f"❌ Failed to download logo for {team_name}: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to download logo for {team_name}: {e}")
    
    return None

# Load logo mapping from CSV - use the correct file path
try:
    with open('../cfb-logos/logos', 'r') as f:
        line_count = 0
        for line in f:
                line_count += 1
                if line.strip() and not line.startswith('id,'):
                    parts = line.strip().split(',')
                    if len(parts) >= 12:
                        school_name = parts[1]
                        logo_url = parts[11] if len(parts) > 11 else ""  # Column 12 (index 11) has the logo URL
                        # Only add if it's a valid URL (starts with http)
                        if logo_url.startswith('http'):
                            logo_mapping[school_name] = logo_url
        
except Exception as e:
    print(f"❌ Error reading logos file: {e}")

# Load existing base image
try:
    base_img = Image.open('../cfb-texas-wallpaper.jpeg').convert('RGB')
    img_width, img_height = base_img.size
except Exception as e:
    print(f"❌ Failed to load base image: {e}")
    # Fallback to creating new image
    img_width = 1400
    img_height = 1000
    base_img = Image.new('RGB', (img_width, img_height), (255, 255, 255))

draw = ImageDraw.Draw(base_img)

# Prepare fonts
try:
    font_path = "../VTFRedzone-Classic.ttf"
    if os.path.exists(font_path):
        font_xsmall = ImageFont.truetype(font_path, 10)
        font_small = ImageFont.truetype(font_path, 14)
        font_medium = ImageFont.truetype(font_path, 18)
        font_large = ImageFont.truetype(font_path, 22)
        font_header = ImageFont.truetype(font_path, 16)
    else:
        raise Exception("Font file not found")
except:
    font_xsmall = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_large = ImageFont.load_default()
    font_header = ImageFont.load_default()

# Colors - adjusted for dark background
bg_color = (255, 255, 255)
text_color = (255, 255, 255)  # White text for dark background
highlight_color = (255, 255, 0)  # Bright yellow for highlights
green_color = (0, 255, 0)  # Bright green
red_color = (255, 100, 100)  # Bright red
gray_color = (200, 200, 200)  # Light gray
box_bg = (0, 0, 0, 180)  # Semi-transparent black for text boxes

# Geometry
start_x = 20
start_y = 20
row_height = 100  # Slightly reduced for better spacing
# Single odds column to replace spread, total, ML columns
odds_col_width = 130    # Slightly smaller
# Regular size for other columns
col_width = 140         # Slightly smaller
logo_size = (35, 35)
team_col_width = 200    # Slightly smaller
table_width = team_col_width + odds_col_width + 5 * col_width + col_width // 2

# Headers
headers = [
    "Spread",
    "Total", 
    "ML",
    "Scoring",
    "Pass Game",
    "Run Game",
    "Third Down",
    "Redzone",
    "Lean"
]

# Title and subtitle positions (will be drawn AFTER table background)
title_y = start_y - 100  # Position above the table
subtitle_y = start_y - 70

# Draw headers with proper positioning for different column widths
header_positions = [
    (start_x + team_col_width, "ODDS"),
    (start_x + team_col_width + odds_col_width, "SCORING"),
    (start_x + team_col_width + odds_col_width + col_width, "PASS GAME"),
    (start_x + team_col_width + odds_col_width + 2 * col_width, "RUN GAME"),
    (start_x + team_col_width + odds_col_width + 3 * col_width, "THIRD DOWN"),
    (start_x + team_col_width + odds_col_width + 4 * col_width, "REDZONE"),
    (start_x + team_col_width + odds_col_width + 4 * col_width + col_width // 2, "LEAN")
]

for x_pos, header in header_positions:
    draw.text((x_pos, start_y), header, fill=text_color, font=font_header)

# Main loop over matchups
current_y = start_y + 50
for matchup in public_bets_data[:8]:  # Limit to first 8 for better layout
    try:
        team1 = matchup["Team1"]
        team2 = matchup["Team2"]
        team1_spread = float(matchup["Team1Spread"])
        team2_spread = float(matchup["Team2Spread"])
        total = matchup["Total"]
        team1_ml = matchup["Team1ML"]
        team2_ml = matchup["Team2ML"]
        
        # Determine favorite (negative spread)
        if team1_spread < 0:
            favorite_team = team1
            favorite_spread = team1_spread
        else:
            favorite_team = team2
            favorite_spread = team2_spread
            
    except Exception as e:
        print(f"Error processing matchup: {e}")
        continue

    # Individual column backgrounds - semi-transparent for better readability on wallpaper
    # Team column background
    draw.rounded_rectangle(
        (start_x, current_y, start_x + team_col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Odds column background
    draw.rounded_rectangle(
        (start_x + team_col_width, current_y, start_x + team_col_width + odds_col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Scoring column background
    draw.rounded_rectangle(
        (start_x + team_col_width + odds_col_width, current_y, start_x + team_col_width + odds_col_width + col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Pass Game column background
    draw.rounded_rectangle(
        (start_x + team_col_width + odds_col_width + col_width, current_y, start_x + team_col_width + odds_col_width + 2 * col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Run Game column background
    draw.rounded_rectangle(
        (start_x + team_col_width + odds_col_width + 2 * col_width, current_y, start_x + team_col_width + odds_col_width + 3 * col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Third Down column background
    draw.rounded_rectangle(
        (start_x + team_col_width + odds_col_width + 3 * col_width, current_y, start_x + team_col_width + odds_col_width + 4 * col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Redzone column background
    draw.rounded_rectangle(
        (start_x + team_col_width + odds_col_width + 4 * col_width, current_y, start_x + team_col_width + odds_col_width + 5 * col_width, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Lean column background (half width)
    draw.rounded_rectangle(
        (start_x + team_col_width + odds_col_width + 5 * col_width, current_y, start_x + team_col_width + odds_col_width + 5 * col_width + col_width // 2, current_y + row_height),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )

    # Column lines - updated for new column widths
    column_positions = [
        start_x + team_col_width,  # After team column
        start_x + team_col_width + odds_col_width,  # After odds
        start_x + team_col_width + odds_col_width + col_width,  # After scoring
        start_x + team_col_width + odds_col_width + 2 * col_width,  # After pass game
        start_x + team_col_width + odds_col_width + 3 * col_width,  # After run game
        start_x + team_col_width + odds_col_width + 4 * col_width,  # After third down
    ]
    
    for lx in column_positions:
        draw.line((lx, current_y, lx, current_y + row_height),
                  fill=(200, 200, 200), width=1)
    
    # Add horizontal lines to separate top and bottom teams in each stat column
    # Horizontal line for Team column
    team_mid_y = current_y + row_height // 2
    draw.line((start_x, team_mid_y, start_x + team_col_width, team_mid_y),
              fill=(200, 200, 200), width=1)
    
    # Horizontal line for Scoring column
    scoring_mid_y = current_y + row_height // 2
    draw.line((start_x + team_col_width + odds_col_width, scoring_mid_y, 
               start_x + team_col_width + odds_col_width + col_width, scoring_mid_y),
              fill=(200, 200, 200), width=1)
    
    # Horizontal line for Pass Game column
    pass_mid_y = current_y + row_height // 2
    draw.line((start_x + team_col_width + odds_col_width + col_width, pass_mid_y, 
               start_x + team_col_width + odds_col_width + 2 * col_width, pass_mid_y),
              fill=(200, 200, 200), width=1)
    
    # Horizontal line for Run Game column
    run_mid_y = current_y + row_height // 2
    draw.line((start_x + team_col_width + odds_col_width + 2 * col_width, run_mid_y, 
               start_x + team_col_width + odds_col_width + 3 * col_width, run_mid_y),
              fill=(200, 200, 200), width=1)
    
    # Horizontal line for Third Down column
    third_mid_y = current_y + row_height // 2
    draw.line((start_x + team_col_width + odds_col_width + 3 * col_width, third_mid_y, 
               start_x + team_col_width + odds_col_width + 4 * col_width, third_mid_y),
              fill=(200, 200, 200), width=1)
    
    # Horizontal line for Redzone column
    redzone_mid_y = current_y + row_height // 2
    draw.line((start_x + team_col_width + odds_col_width + 4 * col_width, redzone_mid_y, 
               start_x + team_col_width + odds_col_width + 5 * col_width, redzone_mid_y),
              fill=(200, 200, 200), width=1)
    
    # Horizontal line for Lean column (half width)
    lean_mid_y = current_y + row_height // 2
    draw.line((start_x + team_col_width + odds_col_width + 5 * col_width, lean_mid_y, 
               start_x + team_col_width + odds_col_width + 5 * col_width + col_width // 2, lean_mid_y),
              fill=(200, 200, 200), width=1)

    # Team logos and names (top row: Team1, bottom row: Team2)
    # Team1 logo and name
    if team1 in logo_mapping and team1 not in logo_cache:
        download_logo(logo_mapping[team1], team1)
    
    if team1 in logo_cache:
        logo = logo_cache[team1].resize(logo_size, Image.Resampling.LANCZOS)
        base_img.paste(logo, (start_x + 5, current_y + 5), logo)
    
    draw.text((start_x + 50, current_y + 8), team1, fill=text_color, font=font_medium)
    
    # Team2 logo and name  
    if team2 in logo_mapping and team2 not in logo_cache:
        download_logo(logo_mapping[team2], team2)
    
    if team2 in logo_cache:
        logo = logo_cache[team2].resize(logo_size, Image.Resampling.LANCZOS)
        base_img.paste(logo, (start_x + 5, current_y + 60), logo)
    
    draw.text((start_x + 50, current_y + 63), team2, fill=text_color, font=font_medium)

    # Odds column - consolidated spread, total, and ML information
    odds_x = start_x + team_col_width
    
    # Spread: Favorite team logo + spread value (horizontal layout with better spacing)
    draw.text((odds_x + 5, current_y + 2), "Spread:", fill=highlight_color, font=font_small)
    if favorite_team in logo_cache:
        logo = logo_cache[favorite_team].resize((20, 20), Image.Resampling.LANCZOS)
        base_img.paste(logo, (odds_x + 55, current_y + 2), logo)
    draw.text((odds_x + 80, current_y + 2), f"{favorite_spread}", 
              fill=text_color, font=font_medium)
    
    # Total: total value (horizontal layout with better spacing)
    draw.text((odds_x + 5, current_y + 32), "Total:", fill=highlight_color, font=font_small)
    draw.text((odds_x + 45, current_y + 30), str(total), 
              fill=text_color, font=font_medium)
    
    # Away ML: Team1 ML (horizontal layout with better spacing)
    draw.text((odds_x + 5, current_y + 52), "Away ML:", fill=highlight_color, font=font_small)
    team1_ml_color = green_color if team1_ml.startswith('+') else red_color
    draw.text((odds_x + 70, current_y + 50), str(team1_ml), 
              fill=team1_ml_color, font=font_medium)
    
    # Home ML: Team2 ML (horizontal layout with better spacing)
    draw.text((odds_x + 5, current_y + 72), "Home ML:", fill=highlight_color, font=font_small)
    team2_ml_color = green_color if team2_ml.startswith('+') else red_color
    draw.text((odds_x + 70, current_y + 70), str(team2_ml), 
              fill=team2_ml_color, font=font_medium)

    # Scoring column
    scoring_x = start_x + team_col_width + odds_col_width
    if team1 in team_stats_data and team2 in team_stats_data:
        t1_stats = team_stats_data[team1]
        t2_stats = team_stats_data[team2]
        
        # Team1 scoring stats
        t1_ppg = t1_stats.get("pointsPG", "N/A")
        t1_ppg_rank = t1_stats.get("pointsPG_ranking", "N/A")
        t1_pa = t1_stats.get("pointsAllowed", "N/A")
        t1_pa_rank = t1_stats.get("pointsAllowed_ranking", "N/A")
        
        # Team2 scoring stats
        t2_ppg = t2_stats.get("pointsPG", "N/A")
        t2_ppg_rank = t2_stats.get("pointsPG_ranking", "N/A")
        t2_pa = t2_stats.get("pointsAllowed", "N/A")
        t2_pa_rank = t2_stats.get("pointsAllowed_ranking", "N/A")
        
        # Display stats in 2x2 grid format - Team1 left, Team2 right
        # Top row: Team1 PPG (left) | Team1 PAL (right)
        draw.text((scoring_x + 5, current_y + 2), "PPG", fill=highlight_color, font=font_small)
        t1_ppg_color = green_color if t1_ppg_rank != "N/A" and int(t1_ppg_rank) <= 45 else (red_color if t1_ppg_rank != "N/A" and int(t1_ppg_rank) >= 85 else text_color)
        draw.text((scoring_x + 5, current_y + 15), f"{t1_ppg} ({t1_ppg_rank})", 
                  fill=t1_ppg_color, font=font_small)
        draw.text((scoring_x + 70, current_y + 2), "PPG All.", fill=highlight_color, font=font_small)
        t1_pa_color = green_color if t1_pa_rank != "N/A" and int(t1_pa_rank) <= 45 else (red_color if t1_pa_rank != "N/A" and int(t1_pa_rank) >= 85 else text_color)
        draw.text((scoring_x + 70, current_y + 15), f"{t1_pa} ({t1_pa_rank})", 
                  fill=t1_pa_color, font=font_small)
        
        # Bottom row: Team2 PPG (left) | Team2 PAL (right)
        draw.text((scoring_x + 5, current_y + 62), "PPG", fill=highlight_color, font=font_small)
        t2_ppg_color = green_color if t2_ppg_rank != "N/A" and int(t2_ppg_rank) <= 45 else (red_color if t2_ppg_rank != "N/A" and int(t2_ppg_rank) >= 85 else text_color)
        draw.text((scoring_x + 5, current_y + 75), f"{t2_ppg} ({t2_ppg_rank})", 
                  fill=t2_ppg_color, font=font_small)
        draw.text((scoring_x + 70, current_y + 62), "PPG All.", fill=highlight_color, font=font_small)
        t2_pa_color = green_color if t2_pa_rank != "N/A" and int(t2_pa_rank) <= 45 else (red_color if t2_pa_rank != "N/A" and int(t2_pa_rank) >= 85 else text_color)
        draw.text((scoring_x + 70, current_y + 75), f"{t2_pa} ({t2_pa_rank})", 
                  fill=t2_pa_color, font=font_small)
        


    # Pass Game column
    pass_x = start_x + team_col_width + odds_col_width + col_width
    if team1 in team_stats_data and team2 in team_stats_data:
        t1_stats = team_stats_data[team1]
        t2_stats = team_stats_data[team2]
        
        # Team1 pass stats
        t1_py = t1_stats.get("passYards", "N/A")
        t1_py_rank = t1_stats.get("passYards_ranking", "N/A")
        t1_pya = t1_stats.get("passYardsAllowed", "N/A")
        t1_pya_rank = t1_stats.get("passYardsAllowed_ranking", "N/A")
        
        # Team2 pass stats
        t2_py = t2_stats.get("passYards", "N/A")
        t2_py_rank = t2_stats.get("passYards_ranking", "N/A")
        t2_pya = t2_stats.get("passYardsAllowed", "N/A")
        t2_pya_rank = t2_stats.get("passYardsAllowed_ranking", "N/A")
        
        # Display stats in 2x2 grid format - Team1 left, Team2 right
        # Top row: Team1 PY (left) | Team1 PYA (right)
        draw.text((pass_x + 5, current_y + 2), "PassYPG", fill=highlight_color, font=font_small)
        t1_py_color = green_color if t1_py_rank != "N/A" and int(t1_py_rank) <= 45 else (red_color if t1_py_rank != "N/A" and int(t1_py_rank) >= 85 else text_color)
        draw.text((pass_x + 5, current_y + 15), f"{t1_py} ({t1_py_rank})", 
                  fill=t1_py_color, font=font_small)
        draw.text((pass_x + 70, current_y + 2), "Pass YPG All.", fill=highlight_color, font=font_small)
        t1_pya_color = green_color if t1_pya_rank != "N/A" and int(t1_pya_rank) <= 45 else (red_color if t1_pya_rank != "N/A" and int(t1_pya_rank) >= 85 else text_color)
        draw.text((pass_x + 70, current_y + 15), f"{t1_pya} ({t1_pya_rank})", 
                  fill=t1_pya_color, font=font_small)
        
        # Bottom row: Team2 PY (left) | Team2 PYA (right)
        draw.text((pass_x + 5, current_y + 62), "Pass YPG", fill=highlight_color, font=font_small)
        t2_py_color = green_color if t2_py_rank != "N/A" and int(t2_py_rank) <= 45 else (red_color if t2_py_rank != "N/A" and int(t2_py_rank) >= 85 else text_color)
        draw.text((pass_x + 5, current_y + 75), f"{t2_py} ({t2_py_rank})", 
                  fill=t2_py_color, font=font_small)
        draw.text((pass_x + 70, current_y + 62), "Pass YPG All.", fill=highlight_color, font=font_small)
        t2_pya_color = green_color if t2_pya_rank != "N/A" and int(t2_pya_rank) <= 45 else (red_color if t2_pya_rank != "N/A" and int(t2_pya_rank) >= 85 else text_color)
        draw.text((pass_x + 70, current_y + 75), f"{t2_pya} ({t2_pya_rank})", 
                  fill=t2_pya_color, font=font_small)
        


    # Run Game column
    run_x = start_x + team_col_width + odds_col_width + 2 * col_width
    if team1 in team_stats_data and team2 in team_stats_data:
        t1_stats = team_stats_data[team1]
        t2_stats = team_stats_data[team2]
        
        # Team1 run stats
        t1_ry = t1_stats.get("rushYards", "N/A")
        t1_ry_rank = t1_stats.get("rushYards_ranking", "N/A")
        t1_rya = t1_stats.get("rushYardsAllowed", "N/A")
        t1_rya_rank = t1_stats.get("rushYardsAllowed_ranking", "N/A")
        
        # Team2 run stats
        t2_ry = t2_stats.get("rushYards", "N/A")
        t2_ry_rank = t2_stats.get("rushYards_ranking", "N/A")
        t2_rya = t2_stats.get("rushYardsAllowed", "N/A")
        t2_rya_rank = t2_stats.get("rushYardsAllowed_ranking", "N/A")
        
        # Display stats in 2x2 grid format - Team1 left, Team2 right
        # Top row: Team1 RY (left) | Team1 RYA (right)
        draw.text((run_x + 5, current_y + 2), "Run YPG", fill=highlight_color, font=font_small)
        t1_ry_color = green_color if t1_ry_rank != "N/A" and int(t1_ry_rank) <= 45 else (red_color if t1_ry_rank != "N/A" and int(t1_ry_rank) >= 85 else text_color)
        draw.text((run_x + 5, current_y + 15), f"{t1_ry} ({t1_ry_rank})", 
                  fill=t1_ry_color, font=font_small)
        draw.text((run_x + 70, current_y + 2), "Run YPG All.", fill=highlight_color, font=font_small)
        t1_rya_color = green_color if t1_rya_rank != "N/A" and int(t1_rya_rank) <= 45 else (red_color if t1_rya_rank != "N/A" and int(t1_rya_rank) >= 85 else text_color)
        draw.text((run_x + 70, current_y + 15), f"{t1_rya} ({t1_rya_rank})", 
                  fill=t1_rya_color, font=font_small)
        
        # Bottom row: Team2 RY (left) | Team2 RYA (right)
        draw.text((run_x + 5, current_y + 62), "Run YPG", fill=highlight_color, font=font_small)
        t2_ry_color = green_color if t2_ry_rank != "N/A" and int(t2_ry_rank) <= 45 else (red_color if t2_ry_rank != "N/A" and int(t2_ry_rank) >= 85 else text_color)
        draw.text((run_x + 5, current_y + 75), f"{t2_ry} ({t2_ry_rank})", 
                  fill=t2_ry_color, font=font_small)
        draw.text((run_x + 70, current_y + 62), "Run YPG All.", fill=highlight_color, font=font_small)
        t2_rya_color = green_color if t2_rya_rank != "N/A" and int(t2_rya_rank) <= 45 else (red_color if t2_rya_rank != "N/A" and int(t2_rya_rank) >= 85 else text_color)
        draw.text((run_x + 70, current_y + 75), f"{t2_rya} ({t2_rya_rank})", 
                  fill=t2_rya_color, font=font_small)
        


    # Third Down column
    third_x = start_x + team_col_width + odds_col_width + 3 * col_width
    if team1 in team_stats_data and team2 in team_stats_data:
        t1_stats = team_stats_data[team1]
        t2_stats = team_stats_data[team2]
        
        # Team1 third down stats
        t1_3o = t1_stats.get("thirdOffense", "N/A")
        t1_3o_rank = t1_stats.get("thirdOffense_ranking", "N/A")
        t1_3d = t1_stats.get("thirdDefense", "N/A")
        t1_3d_rank = t1_stats.get("thirdDefense_ranking", "N/A")
        
        # Team2 third down stats
        t2_3o = t2_stats.get("thirdOffense", "N/A")
        t2_3o_rank = t2_stats.get("thirdOffense_ranking", "N/A")
        t2_3d = t2_stats.get("thirdDefense", "N/A")
        t2_3d_rank = t2_stats.get("thirdDefense_ranking", "N/A")
        
        # Display stats in 2x2 grid format - Team1 left, Team2 right
        # Top row: Team1 3O (left) | Team1 3D (right)
        draw.text((third_x + 5, current_y + 2), "3rd Off.", fill=highlight_color, font=font_small)
        t1_3o_color = green_color if t1_3o_rank != "N/A" and int(t1_3o_rank) <= 45 else (red_color if t1_3o_rank != "N/A" and int(t1_3o_rank) >= 85 else text_color)
        draw.text((third_x + 5, current_y + 15), f"{t1_3o:.1f}% ({t1_3o_rank})", 
                  fill=t1_3o_color, font=font_small)
        draw.text((third_x + 70, current_y + 2), "3rd Def.", fill=highlight_color, font=font_small)
        t1_3d_color = green_color if t1_3d_rank != "N/A" and int(t1_3d_rank) <= 45 else (red_color if t1_3d_rank != "N/A" and int(t1_3d_rank) >= 85 else text_color)
        draw.text((third_x + 70, current_y + 15), f"{t1_3d:.1f}% ({t1_3d_rank})", 
                  fill=t1_3d_color, font=font_small)
        
        # Bottom row: Team2 3O (left) | Team2 3D (right)
        draw.text((third_x + 5, current_y + 62), "3rd Off.", fill=highlight_color, font=font_small)
        t2_3o_color = green_color if t2_3o_rank != "N/A" and int(t2_3o_rank) <= 45 else (red_color if t2_3o_rank != "N/A" and int(t2_3o_rank) >= 85 else text_color)
        draw.text((third_x + 5, current_y + 75), f"{t2_3o:.1f}% ({t2_3o_rank})", 
                  fill=t2_3o_color, font=font_small)
        draw.text((third_x + 70, current_y + 62), "3rd Def.", fill=highlight_color, font=font_small)
        t2_3d_color = green_color if t2_3d_rank != "N/A" and int(t2_3d_rank) <= 45 else (red_color if t2_3d_rank != "N/A" and int(t2_3d_rank) >= 85 else text_color)
        draw.text((third_x + 70, current_y + 75), f"{t2_3d:.1f}% ({t2_3d_rank})", 
                  fill=t2_3d_color, font=font_small)
        


    # Redzone column
    redzone_x = start_x + team_col_width + odds_col_width + 4 * col_width
    if team1 in team_stats_data and team2 in team_stats_data:
        t1_stats = team_stats_data[team1]
        t2_stats = team_stats_data[team2]
        
        # Team1 redzone stats
        t1_rz = t1_stats.get("redzoneOffense", "N/A")
        t1_rz_rank = t1_stats.get("redzoneOffense_ranking", "N/A")
        t1_rzd = t1_stats.get("redzoneDefense", "N/A")
        t1_rzd_rank = t1_stats.get("redzoneDefense_ranking", "N/A")
        
        # Team2 redzone stats
        t2_rz = t2_stats.get("redzoneOffense", "N/A")
        t2_rz_rank = t2_stats.get("redzoneOffense_ranking", "N/A")
        t2_rzd = t2_stats.get("redzoneDefense", "N/A")
        t2_rzd_rank = t2_stats.get("redzoneDefense_ranking", "N/A")
        
        # Display stats in 2x2 grid format - Team1 left, Team2 right
        # Top row: Team1 RZO (left) | Team1 RZD (right)
        draw.text((redzone_x + 5, current_y + 2), "RZ Off.", fill=highlight_color, font=font_small)
        t1_rz_color = green_color if t1_rz_rank != "N/A" and int(t1_rz_rank) <= 45 else (red_color if t1_rz_rank != "N/A" and int(t1_rz_rank) >= 85 else text_color)
        draw.text((redzone_x + 5, current_y + 15), f"{t1_rz:.1f}% ({t1_rz_rank})", 
                  fill=t1_rz_color, font=font_small)
        draw.text((redzone_x + 70, current_y + 2), "RZ Def.", fill=highlight_color, font=font_small)
        t1_rzd_color = green_color if t1_rzd_rank != "N/A" and int(t1_rzd_rank) <= 45 else (red_color if t1_rzd_rank != "N/A" and int(t1_rzd_rank) >= 85 else text_color)
        draw.text((redzone_x + 70, current_y + 15), f"{t1_rzd:.1f}% ({t1_rzd_rank})", 
                  fill=t1_rzd_color, font=font_small)
        
        # Bottom row: Team2 RZO (left) | Team2 RZD (right)
        draw.text((redzone_x + 5, current_y + 62), "RZ Off.", fill=highlight_color, font=font_small)
        t2_rz_color = green_color if t2_rz_rank != "N/A" and int(t2_rz_rank) <= 45 else (red_color if t2_rz_rank != "N/A" and int(t2_rz_rank) >= 85 else text_color)
        draw.text((redzone_x + 5, current_y + 75), f"{t2_rz:.1f}% ({t2_rz_rank})", 
                  fill=t2_rz_color, font=font_small)
        draw.text((redzone_x + 70, current_y + 62), "RZ Def.", fill=highlight_color, font=font_small)
        t2_rzd_color = green_color if t2_rzd_rank != "N/A" and int(t2_rzd_rank) <= 45 else (red_color if t2_rzd_rank != "N/A" and int(t2_rzd_rank) >= 85 else text_color)
        draw.text((redzone_x + 70, current_y + 75), f"{t2_rzd:.1f}% ({t2_rzd_rank})", 
                  fill=t2_rzd_color, font=font_small)
        


    # Lean column (empty for now)
    lean_x = start_x + team_col_width + odds_col_width + 4 * col_width + col_width // 2
    # Leave empty as requested
    
    # Add advantage rows below the main stats (separate rows with connecting lines)
    advantage_y = current_y + row_height
    
    # Horizontal line above advantage rows (connects to main row)
    draw.line((start_x, advantage_y, start_x + table_width, advantage_y),
              fill=(200, 200, 200), width=1)
    
    # Advantage row background
    draw.rounded_rectangle(
        (start_x, advantage_y, start_x + table_width, advantage_y + 30),
        fill=(0, 0, 0, 120),  # Semi-transparent black
        radius=5,
    )
    
    # Scoring Column Advantage
    if t1_ppg != "N/A" and t1_pa != "N/A" and t2_ppg != "N/A" and t2_pa != "N/A":
        t1_total = float(t1_ppg) + float(t1_pa)
        t2_total = float(t2_ppg) + float(t2_pa)
        advantage_team = team1 if t1_total < t2_total else team2
        advantage_logo = logo_cache.get(advantage_team)
        
        draw.text((scoring_x + 5, advantage_y + 8), "Advantage:", fill=highlight_color, font=font_small)
        if advantage_logo:
            logo = advantage_logo.resize((20, 20), Image.Resampling.LANCZOS)
            base_img.paste(logo, (scoring_x + 90, advantage_y + 8), logo)
    
    # Pass Game Column Advantage
    if t1_py != "N/A" and t1_pya != "N/A" and t2_py != "N/A" and t2_pya != "N/A":
        t1_total = float(t1_py) + float(t1_pya)
        t2_total = float(t2_py) + float(t2_pya)
        advantage_team = team1 if t1_total < t2_total else team2
        advantage_logo = logo_cache.get(advantage_team)
        
        draw.text((pass_x + 5, advantage_y + 8), "Advantage:", fill=highlight_color, font=font_small)
        if advantage_logo:
            logo = advantage_logo.resize((20, 20), Image.Resampling.LANCZOS)
            base_img.paste(logo, (pass_x + 90, advantage_y + 8), logo)
    
    # Run Game Column Advantage
    if t1_ry != "N/A" and t1_rya != "N/A" and t2_ry != "N/A" and t2_rya != "N/A":
        t1_total = float(t1_ry) + float(t1_rya)
        t2_total = float(t2_ry) + float(t2_rya)
        advantage_team = team1 if t1_total < t2_total else team2
        advantage_logo = logo_cache.get(advantage_team)
        
        draw.text((run_x + 5, advantage_y + 8), "Advantage:", fill=highlight_color, font=font_small)
        if advantage_logo:
            logo = advantage_logo.resize((20, 20), Image.Resampling.LANCZOS)
            base_img.paste(logo, (run_x + 90, advantage_y + 8), logo)
    
    # Third Down Column Advantage
    if t1_3o != "N/A" and t1_3d != "N/A" and t2_3o != "N/A" and t2_3d != "N/A":
        t1_total = float(t1_3o) + float(t1_3d)
        t2_total = float(t2_3o) + float(t2_3d)
        advantage_team = team1 if t1_total < t2_total else team2
        advantage_logo = logo_cache.get(advantage_team)
        
        draw.text((third_x + 5, advantage_y + 8), "Advantage:", fill=highlight_color, font=font_small)
        if advantage_logo:
            logo = advantage_logo.resize((20, 20), Image.Resampling.LANCZOS)
            base_img.paste(logo, (third_x + 90, advantage_y + 8), logo)
    
    # Redzone Column Advantage
    if t1_rz != "N/A" and t1_rzd != "N/A" and t2_rz != "N/A" and t2_rzd != "N/A":
        t1_total = float(t1_rz) + float(t1_rzd)
        t2_total = float(t2_rz) + float(t2_rzd)
        advantage_team = team1 if t1_total < t2_total else team2
        advantage_logo = logo_cache.get(advantage_team)
        
        draw.text((redzone_x + 5, advantage_y + 8), "Advantage:", fill=highlight_color, font=font_small)
        if advantage_logo:
            logo = advantage_logo.resize((20, 20), Image.Resampling.LANCZOS)
            base_img.paste(logo, (redzone_x + 90, advantage_y + 8), logo)

    # Horizontal separator
    draw.line((start_x, current_y + row_height, start_x + table_width, current_y + row_height),
              fill=(150, 150, 150), width=1)

    # Advance to next matchup (including advantage row)
    current_y += row_height + 30 + 10  # Main row + advantage row + spacing

# Draw title and subtitle AFTER the table background (so they're visible on top)
title_text = "College Football Week 0 Stat Comparison"
title_bbox = draw.textbbox((0, 0), title_text, font=font_large)
title_width = title_bbox[2] - title_bbox[0]
title_x = start_x + (table_width // 2) - (title_width // 2)
draw.text((title_x, title_y), title_text, fill=text_color, font=font_large)

# Subtitle
subtitle_text = "2024 Team Stats Comparison & Prediction"
subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=font_medium)
subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
subtitle_x = start_x + (table_width // 2) - (subtitle_width // 2)
draw.text((subtitle_x, subtitle_y), subtitle_text, fill=highlight_color, font=font_medium)

# Add legend at the bottom to explain abbreviations
legend_y = current_y + 20
legend_x = start_x + 20

# Legend title
draw.text((legend_x, legend_y), "STATS LEGEND:", fill=highlight_color, font=font_medium)

# Legend items
legend_items = [
    ("PPG", "Points Per Game"),
    ("PAL", "Points Allowed"),
    ("PY", "Pass Yards"),
    ("PYA", "Pass Yards Allowed"),
    ("RY", "Rush Yards"),
    ("RYA", "Rush Yards Allowed"),
    ("3O", "3rd Down Offense %"),
    ("3D", "3rd Down Defense %"),
    ("RZO", "Redzone Offense %"),
    ("RZD", "Redzone Defense %")
]

legend_spacing = 25
for i, (abbr, desc) in enumerate(legend_items):
    y_pos = legend_y + 30 + (i * legend_spacing)
    draw.text((legend_x, y_pos), f"{abbr}: {desc}", fill=text_color, font=font_small)

# Save the image as a new file
out_path = "../cfb-ou-image.jpeg"
base_img.save(out_path, "JPEG", quality=95)
print(f"✅ NCAAF graphic saved as {out_path}")
base_img.show()
