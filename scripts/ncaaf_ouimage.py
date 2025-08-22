import json
try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
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
    img_width = 1600
    img_height = 1200
    base_img = Image.new('RGB', (img_width, img_height), (255, 255, 255))

draw = ImageDraw.Draw(base_img)

# Prepare fonts
try:
    font_path = "../VTFRedzone-Classic.ttf"
    if os.path.exists(font_path):
        font_xsmall = ImageFont.truetype(font_path, 12)
        font_small = ImageFont.truetype(font_path, 16)
        font_medium = ImageFont.truetype(font_path, 20)
        font_large = ImageFont.truetype(font_path, 24)
        font_header = ImageFont.truetype(font_path, 18)
        font_title = ImageFont.truetype(font_path, 32)
        font_subtitle = ImageFont.truetype(font_path, 20)
    else:
        raise Exception("Font file not found")
except:
    font_xsmall = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_large = ImageFont.load_default()
    font_header = ImageFont.load_default()
    font_title = ImageFont.load_default()
    font_subtitle = ImageFont.load_default()

# Colors - modern color scheme
bg_color = (255, 255, 255)
text_color = (255, 255, 255)  # White text for dark background
highlight_color = (255, 255, 0)  # Bright yellow for highlights
green_color = (0, 255, 0)  # Bright green
red_color = (255, 100, 100)  # Bright red
gray_color = (200, 200, 200)  # Light gray
card_bg = (40, 40, 40, 200)  # Dark semi-transparent for cards
card_border = (80, 80, 80)  # Border color for cards
shadow_color = (0, 0, 0, 100)  # Shadow color

# New Geometry for wider, modern layout
start_x = 40
start_y = 120
row_height = int(180 * 2 * 0.67)  # DOUBLE then shrink by 1/3 (keep 2/3) = ~241px
row_spacing = int(220 * 2 * 0.67)  # DOUBLE then shrink by 1/3 (keep 2/3) = ~295px
card_padding = 20
logo_size = (80, 80)  # Much bigger logos

# Card dimensions
team_card_width = 300
odds_card_width = 280  # Increased width to accommodate larger text
stats_card_width = 200
advantage_card_width = 150

# Title and subtitle positions
title_y = start_y - 80
subtitle_y = start_y - 40

# Draw title and subtitle
draw.text((start_x, title_y), "College Football Week 0 Stat Comparison", 
          fill=text_color, font=font_title)
draw.text((start_x, subtitle_y), "2024 Team Stats Comparison & Prediction", 
          fill=text_color, font=font_subtitle)

# Main loop over matchups - limit to 5 for better layout
current_y = start_y
for i, matchup in enumerate(public_bets_data[:5]):  # Limit to first 5 matchups
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

    # Create main row container with shadow effect
    row_x = start_x
    row_y = current_y
    row_width = int((team_card_width + odds_card_width + 3 * stats_card_width + 3 * advantage_card_width + 100) * 2 * 0.67)  # DOUBLE then shrink by 1/3 (keep 2/3)
    
    # Draw shadow first
    shadow_offset = 8
    draw.rounded_rectangle(
        (row_x + shadow_offset, row_y + shadow_offset, 
         row_x + row_width + shadow_offset, row_y + row_height + shadow_offset),
        fill=shadow_color,
        radius=15
    )
    
    # Draw main row background
    draw.rounded_rectangle(
        (row_x, row_y, row_x + row_width, row_y + row_height),
        fill=card_bg,
        outline=card_border,
        width=2,
        radius=15
    )

    # 1. TEAM MATCHUP SECTION (Top of row)
    team_section_y = row_y + 20
    team_section_height = 80  # Increased height for bigger logos
    
    # Calculate positions for left third and right third layout, moved 150px left
    left_third_x = row_x + (row_width // 3) - 150  # Left third of the component, moved left
    right_third_x = row_x + (2 * row_width // 3) - 150  # Right third of the component, moved left
    
    # Team 1 (Left) - positioned in left third
    team1_x = left_third_x - logo_size[0] - 50
    if team1 in logo_mapping and team1 not in logo_cache:
        download_logo(logo_mapping[team1], team1)
    
    if team1 in logo_cache:
        logo = logo_cache[team1].resize(logo_size, Image.Resampling.LANCZOS)
        base_img.paste(logo, (team1_x, team_section_y), logo)
    
    # Team 1 name - positioned to the left of the logo
    draw.text((team1_x - 120, team_section_y + (logo_size[1] // 2) - 10), team1, 
              fill=text_color, font=font_medium)
    
    # VS symbol - positioned between the teams in left third
    vs_x = left_third_x - 20
    draw.text((vs_x, team_section_y + (logo_size[1] // 2) - 10), "VS", fill=highlight_color, font=font_large)
    
    # Team 2 (Right) - positioned in left third
    team2_x = left_third_x + 50
    if team2 in logo_mapping and team2 not in logo_cache:
        download_logo(logo_mapping[team2], team2)
    
    if team2 in logo_cache:
        logo = logo_cache[team2].resize(logo_size, Image.Resampling.LANCZOS)
        base_img.paste(logo, (team2_x, team_section_y), logo)
    
    # Team 2 name - positioned to the right of the logo
    draw.text((team2_x + logo_size[0] + 20, team_section_y + (logo_size[1] // 2) - 10), team2, 
              fill=text_color, font=font_medium)

    # 2. ODDS SECTION (Vertically aligned with team matchup, moved far right and enlarged)
    odds_section_y = team_section_y  # Same vertical position as team section
    odds_section_height = 80  # Increased height to accommodate larger text
    odds_x = right_third_x - 200  # Moved far to the right
    
    # Odds card background
    draw.rounded_rectangle(
        (odds_x, odds_section_y, odds_x + odds_card_width, odds_section_y + odds_section_height),
        fill=(60, 60, 60, 180),
        outline=card_border,
        width=1,
        radius=10
    )
    
    # Spread and Total only
    # Spread
    draw.text((odds_x + 20, odds_section_y + 15), "Spread:", fill=highlight_color, font=font_large)
    if favorite_team in logo_cache:
        logo = logo_cache[favorite_team].resize((30, 30), Image.Resampling.LANCZOS)
        base_img.paste(logo, (odds_x + 120, odds_section_y + 12), logo)
    draw.text((odds_x + 160, odds_section_y + 15), f"{favorite_spread}", 
              fill=text_color, font=font_large)
    
    # Total
    draw.text((odds_x + 20, odds_section_y + 45), "Total:", fill=highlight_color, font=font_large)
    draw.text((odds_x + 90, odds_section_y + 45), str(total), 
              fill=text_color, font=font_large)
    
    # Commented out Away ML and Home ML
    # # Right side: Away ML and Home ML (vertically aligned with Spread and Total)
    # # Away ML (in line with Spread)
    # draw.text((odds_x + 200, odds_section_y + 10), "Away ML:", fill=highlight_color, font=font_small)
    # draw.text((odds_x + 270, odds_section_y + 10), str(team1_ml), 
    #           fill=text_color, font=font_medium)  # White text, no color coding
    # 
    # # Home ML (in line with Total)
    # draw.text((odds_x + 200, odds_section_y + 25), "Home ML:", fill=highlight_color, font=font_small)
    # draw.text((odds_x + 200, odds_section_y + 25), str(team2_ml), 
    #           fill=text_color, font=font_medium)  # White text, no color coding

    # 3. STATS SECTIONS (Below team section) - Rebuilt with individual cards
    stats_section_y = team_section_y + team_section_height + 20
    stats_section_height = int(80 * 2 * 0.5)  # DOUBLE then shrink by 1/2 (keep 1/2) = ~80px
    
    # Get team stats
    if team1 in team_stats_data and team2 in team_stats_data:
        t1_stats = team_stats_data[team1]
        t2_stats = team_stats_data[team2]
        
        # SCORING ROW - Individual cards for each stat (positioned from left side)
        scoring_start_x = row_x + 50  # Start from left side of the row
        
        # Team 1 PPG Card - DOUBLED SIZE
        t1_ppg = t1_stats.get("pointsPG", "N/A")
        t1_ppg_rank = t1_stats.get("pointsPG_ranking", "N/A")
        
        card_width = int(120 * 2 * 0.5)  # DOUBLE then shrink by 1/2 (keep 1/2) = ~120px
        
        draw.rounded_rectangle(
            (scoring_start_x, stats_section_y, scoring_start_x + card_width, stats_section_y + stats_section_height),
            fill=(60, 60, 60, 180),
            outline=card_border,
            width=1,
            radius=10
        )
        # Center the title text
        title_bbox = draw.textbbox((0, 0), "Team 1 PPG:", font=font_small)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = scoring_start_x + (card_width - title_width) // 2
        draw.text((title_x, stats_section_y + 10), "Team 1 PPG:", 
                  fill=highlight_color, font=font_small)
        
        # Center the value text
        value_bbox = draw.textbbox((0, 0), f"{t1_ppg}", font=font_large)
        value_width = value_bbox[2] - value_bbox[0]
        value_x = scoring_start_x + (card_width - value_width) // 2
        draw.text((value_x, stats_section_y + 35), f"{t1_ppg}", 
                  fill=text_color, font=font_large)
        
        # Center the rank text
        if t1_ppg_rank != "N/A":
            rank_color = green_color if int(t1_ppg_rank) <= 45 else (red_color if int(t1_ppg_rank) >= 85 else text_color)
            rank_text = f"Rank: {t1_ppg_rank}"
            rank_bbox = draw.textbbox((0, 0), rank_text, font=font_small)
            rank_width = rank_bbox[2] - rank_bbox[0]
            rank_x = scoring_start_x + (card_width - rank_width) // 2
            draw.text((rank_x, stats_section_y + 60), rank_text, 
                      fill=rank_color, font=font_small)
        
        # Team 1 Points Allowed Card - DOUBLED SIZE
        t1_pa = t1_stats.get("pointsAllowed", "N/A")
        t1_pa_rank = t1_stats.get("pointsAllowed_ranking", "N/A")
        
        card2_start_x = scoring_start_x + card_width + 20  # 20px gap between cards
        
        draw.rounded_rectangle(
            (card2_start_x, stats_section_y, card2_start_x + card_width, stats_section_y + stats_section_height),
            fill=(60, 60, 60, 180),
            outline=card_border,
            width=1,
            radius=10
        )
        # Center the title text
        title_bbox = draw.textbbox((0, 0), "Team 1 Pts Allowed:", font=font_small)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = card2_start_x + (card_width - title_width) // 2
        draw.text((title_x, stats_section_y + 10), "Team 1 Pts Allowed:", 
                  fill=highlight_color, font=font_small)
        
        # Center the value text
        value_bbox = draw.textbbox((0, 0), f"{t1_pa}", font=font_large)
        value_width = value_bbox[2] - value_bbox[0]
        value_x = card2_start_x + (card_width - value_width) // 2
        draw.text((value_x, stats_section_y + 35), f"{t1_pa}", 
                  fill=text_color, font=font_large)
        
        # Center the rank text
        if t1_pa_rank != "N/A":
            rank_color = green_color if int(t1_pa_rank) <= 45 else (red_color if int(t1_pa_rank) >= 85 else text_color)
            rank_text = f"Rank: {t1_pa_rank}"
            rank_bbox = draw.textbbox((0, 0), rank_text, font=font_small)
            rank_width = rank_bbox[2] - rank_bbox[0]
            rank_x = card2_start_x + (card_width - rank_width) // 2
            draw.text((rank_x, stats_section_y + 60), rank_text, 
                      fill=rank_color, font=font_small)
        
        # Team 2 PPG Card - DOUBLED SIZE
        t2_ppg = t2_stats.get("pointsPG", "N/A")
        t2_ppg_rank = t2_stats.get("pointsPG_ranking", "N/A")
        
        card3_start_x = card2_start_x + card_width + 20  # 20px gap between cards
        
        draw.rounded_rectangle(
            (card3_start_x, stats_section_y, card3_start_x + card_width, stats_section_y + stats_section_height),
            fill=(60, 60, 60, 180),
            outline=card_border,
            width=1,
            radius=10
        )
        # Center the title text
        title_bbox = draw.textbbox((0, 0), "Team 2 PPG:", font=font_small)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = card3_start_x + (card_width - title_width) // 2
        draw.text((title_x, stats_section_y + 10), "Team 2 PPG:", 
                  fill=highlight_color, font=font_small)
        
        # Center the value text
        value_bbox = draw.textbbox((0, 0), f"{t2_ppg}", font=font_large)
        value_width = value_bbox[2] - value_bbox[0]
        value_x = card3_start_x + (card_width - value_width) // 2
        draw.text((value_x, stats_section_y + 35), f"{t2_ppg}", 
                  fill=text_color, font=font_large)
        
        # Center the rank text
        if t2_ppg_rank != "N/A":
            rank_color = green_color if int(t2_ppg_rank) <= 45 else (red_color if int(t2_ppg_rank) >= 85 else text_color)
            rank_text = f"Rank: {t2_ppg_rank}"
            rank_bbox = draw.textbbox((0, 0), rank_text, font=font_small)
            rank_width = rank_bbox[2] - rank_bbox[0]
            rank_x = card3_start_x + (card_width - rank_width) // 2
            draw.text((rank_x, stats_section_y + 60), rank_text, 
                      fill=rank_color, font=font_small)
        
        # Team 2 Points Allowed Card - DOUBLED SIZE
        t2_pa = t2_stats.get("pointsAllowed", "N/A")
        t2_pa_rank = t2_stats.get("pointsAllowed_ranking", "N/A")
        
        card4_start_x = card3_start_x + card_width + 20  # 20px gap between cards
        
        draw.rounded_rectangle(
            (card4_start_x, stats_section_y, card4_start_x + card_width, stats_section_y + stats_section_height),
            fill=(60, 60, 60, 180),
            outline=card_border,
            width=1,
            radius=10
        )
        # Center the title text
        title_bbox = draw.textbbox((0, 0), "Team 2 Pts Allowed:", font=font_small)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = card4_start_x + (card_width - title_width) // 2
        draw.text((title_x, stats_section_y + 10), "Team 2 Pts Allowed:", 
                  fill=highlight_color, font=font_small)
        
        # Center the value text
        value_bbox = draw.textbbox((0, 0), f"{t2_pa}", font=font_large)
        value_width = value_bbox[2] - value_bbox[0]
        value_x = card4_start_x + (card_width - value_width) // 2
        draw.text((value_x, stats_section_y + 35), f"{t2_pa}", 
                  fill=text_color, font=font_large)
        
        # Center the rank text
        if t2_pa_rank != "N/A":
            rank_color = green_color if int(t2_pa_rank) <= 45 else (red_color if int(t2_pa_rank) >= 85 else text_color)
            rank_text = f"Rank: {t2_pa_rank}"
            rank_bbox = draw.textbbox((0, 0), rank_text, font=font_small)
            rank_width = rank_bbox[2] - rank_bbox[0]
            rank_x = card4_start_x + (card_width - rank_width) // 2
            draw.text((rank_x, stats_section_y + 60), rank_text, 
                      fill=rank_color, font=font_small)
        
        # Scoring Advantage Card - DOUBLED SIZE
        card5_start_x = card4_start_x + card_width + 20  # 20px gap between cards
        
        draw.rounded_rectangle(
            (card5_start_x, stats_section_y, card5_start_x + card_width, stats_section_y + stats_section_height),
            fill=(60, 60, 60, 180),
            outline=card_border,
            width=1,
            radius=10
        )
        
        # Center the title text
        title_bbox = draw.textbbox((0, 0), "Advantage:", font=font_small)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = card5_start_x + (card_width - title_width) // 2
        draw.text((title_x, stats_section_y + 10), "Advantage:", 
                  fill=highlight_color, font=font_small)
        
        # Calculate advantage
        if t1_ppg != "N/A" and t1_pa != "N/A" and t2_ppg != "N/A" and t2_pa != "N/A":
            t1_total = float(t1_ppg) + float(t1_pa)
            t2_total = float(t2_ppg) + float(t2_pa)
            advantage_team = team1 if t1_total < t2_total else team2
            advantage_logo = logo_cache.get(advantage_team)
            
            if advantage_logo:
                # Center the logo in the card
                logo = advantage_logo.resize((40, 40), Image.Resampling.LANCZOS)  # Smaller logo for better fit in smaller card
                logo_x = card5_start_x + (card_width - 40) // 2
                logo_y = stats_section_y + 35
                base_img.paste(logo, (logo_x, logo_y), logo)

    # Move to next row
    current_y += row_spacing

# Add legend at the bottom
legend_y = current_y + 20
legend_x = start_x

# Legend background
legend_width = 600
legend_height = 80
draw.rounded_rectangle(
    (legend_x, legend_y, legend_x + legend_width, legend_y + legend_height),
    fill=card_bg,
    outline=card_border,
    width=2,
    radius=10
)

# Legend title
draw.text((legend_x + 20, legend_y + 10), "STATS LEGEND:", 
          fill=highlight_color, font=font_header)

# Legend items
legend_items = [
    ("PPG: POINTS PER GAME", legend_x + 20, legend_y + 35),
    ("PAL: POINTS ALLOWED", legend_x + 20, legend_y + 55),
    ("PY: PASS YARDS", legend_x + 250, legend_y + 35),
    ("PYA: PASS YARDS ALLOWED", legend_x + 250, legend_y + 55),
    ("RY: RUSH YARDS", legend_x + 450, legend_y + 35),
    ("RYA: RUSH YARDS ALLOWED", legend_x + 450, legend_y + 55)
]

for text, x, y in legend_items:
    draw.text((x, y), text, fill=text_color, font=font_small)

# Save the image
try:
    base_img.save('../cfb-ou-image.jpeg', 'JPEG', quality=95)
    print("✅ NCAAF graphic saved as ../cfb-ou-image.jpeg")
    
    # Auto-open the generated image
    base_img.show()
    print("🖼️ Image opened automatically!")
    
except Exception as e:
    print(f"❌ Failed to save image: {e}")
