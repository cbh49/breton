#!/usr/bin/env python3
"""
nfl_model.py - NFL Prediction Model (RANKS-ONLY VERSION)

This script loads team statistics and betting data, then generates predictions
for all games using ONLY ranking-based features. Lower rank number = better.

Usage:
    python nfl_model.py [--team-stats PATH] [--public-bets PATH] [--output PATH]
"""

import argparse
import math
import json
import sys

# =======================
# Tunables / Calibration
# =======================
# Error scales (tune via backtests)
STD_SPREAD = 8.6      # stdev of margin error (NFL typically lower variance)
STD_TOTAL  = 6.8      # stdev of total error

# Selection thresholds
FAVORITE_EDGE_MIN = 2.0    # min pts edge to flag favorite
UNDERDOG_EDGE_MIN = 2.0    # min pts edge to flag dog
TOTAL_EDGE_MIN    = 3.0    # min pts edge to flag O/U

MIN_CONFIDENCE    = 0.675   # drop picks below this
MAX_PER_BUCKET    = 2.0      # cap per bucket

# Model scales (map rank-index → points)
INDEX_SCALE_SPREAD = 3.0   # spread index → points
INDEX_SCALE_TOTAL  = 2.0    # total index → points around league avg
LEAGUE_AVG_TOTAL   = 45.9   # center for totals (adjust weekly)

# Home Field Advantage (points to HOME / Team2)
HFA_POINTS = 2.7            # NFL home field advantage

# Team count for rank normalization
N_TEAMS = 32.0               # NFL has 32 teams

MAX_PER_BUCKET = 10


# =======================
# Helpers
# =======================
def rank_to_score(rank: float, n=N_TEAMS) -> float:
    """
    Convert rank (1 = best, n = worst) to [0,1] score (1 = best).
    Missing/invalid ranks return 0.5 (neutral).
    """
    try:
        r = float(rank)
        if not (1 <= r <= n):
            return 0.5
        return 1.0 - (r - 1.0) / max(1.0, (n - 1.0))
    except Exception:
        return 0.5


def safe_get(d, key, default=None):
    v = d.get(key, default)
    return v


def model_spread_string(team1, team2, margin):
    # margin>0 => Team1 by margin; margin<0 => Team2 by |margin|
    if margin >= 0:
        return f"{team1} -{round(margin,1)}"
    else:
        return f"{team2} -{round(abs(margin),1)}"


def market_spread_string(team1, team2, team1_spread):
    s = float(team1_spread)
    if s < 0:
        return f"{team1} {s}"
    elif s > 0:
        return f"{team2} {round(-s,1)}"
    else:
        return "PK"


def spread_confidence(edge_points):
    z = abs(edge_points) / max(1e-6, STD_SPREAD)
    conf = max(0.0, min(1.0, 0.5 + 0.34 * z))  # simple monotone ramp
    return round(min(conf, 0.99), 3)


def total_confidence(edge_points):
    z = abs(edge_points) / max(1e-6, STD_TOTAL)
    conf = max(0.0, min(1.0, 0.5 + 0.34 * z))
    return round(min(conf, 0.99), 3)


def reason_for_spread(team1, team2, model_margin, market_team1_spread):
    ms = model_spread_string(team1, team2, model_margin)
    mk = market_spread_string(team1, team2, market_team1_spread)
    return f"Model projects {ms} vs market {mk}"


def reason_for_total(pred_total, market_total, side):
    return f"Model projects {round(pred_total,1)} vs market {round(float(market_total),1)} → {side}"


def load_data(team_stats_path, public_bets_path):
    """Load team statistics and public betting data from JSON files."""
    try:
        with open(team_stats_path, 'r') as f:
            team_stats = json.load(f)
        print(f"Loaded team stats for {len(team_stats)} teams from {team_stats_path}")
    except FileNotFoundError:
        print(f"Error: Team stats file not found at {team_stats_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in team stats file: {e}")
        sys.exit(1)
    
    try:
        with open(public_bets_path, 'r') as f:
            public_bets = json.load(f)
        print(f"Loaded betting data for {len(public_bets)} games from {public_bets_path}")
    except FileNotFoundError:
        print(f"Error: Public bets file not found at {public_bets_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in public bets file: {e}")
        sys.exit(1)
    
    return team_stats, public_bets


# =======================
# NFL-Specific Feature Blocks
# =======================
def offense_defense_core_index(t1, t2):
    """
    Core index based on scoring ranks: (Off1 vs Def2) - (Off2 vs Def1)
    Higher positive → Team1 advantage; negative → Team2 advantage.
    """
    off1 = rank_to_score(safe_get(t1, "points_per_game_ranking"))
    def2 = rank_to_score(safe_get(t2, "points_allowed_per_game_ranking"))
    off2 = rank_to_score(safe_get(t2, "points_per_game_ranking"))
    def1 = rank_to_score(safe_get(t1, "points_allowed_per_game_ranking"))
    return (off1 - def2) - (off2 - def1)


def pass_mismatch_index(t1, t2):
    """
    Passing mismatch using ranks only:
    (Team1 pass offense rank score - Team2 pass defense-allowed rank score)
    minus the reverse.
    """
    off1_pass = rank_to_score(safe_get(t1, "pass_yards_per_game_ranking"))
    def2_pass = rank_to_score(safe_get(t2, "pass_yards_allowed_per_game_ranking"))
    off2_pass = rank_to_score(safe_get(t2, "pass_yards_per_game_ranking"))
    def1_pass = rank_to_score(safe_get(t1, "pass_yards_allowed_per_game_ranking"))
    return (off1_pass - def2_pass) - (off2_pass - def1_pass)


def rush_mismatch_index(t1, t2):
    off1_rush = rank_to_score(safe_get(t1, "rush_yards_per_game_ranking"))
    def2_rush = rank_to_score(safe_get(t2, "rush_yards_allowed_per_game_ranking"))
    off2_rush = rank_to_score(safe_get(t2, "rush_yards_per_game_ranking"))
    def1_rush = rank_to_score(safe_get(t1, "rush_yards_allowed_per_game_ranking"))
    return (off1_rush - def2_rush) - (off2_rush - def1_rush)


def third_down_index(t1, t2):
    off1 = rank_to_score(safe_get(t1, "third_down_offense_ranking"))
    def2 = rank_to_score(safe_get(t2, "third_down_defense_ranking"))
    off2 = rank_to_score(safe_get(t2, "third_down_offense_ranking"))
    def1 = rank_to_score(safe_get(t1, "third_down_defense_ranking"))
    return (off1 - def2) - (off2 - def1)


def redzone_index(t1, t2):
    off1 = rank_to_score(safe_get(t1, "redzone_offense_ranking"))
    def2 = rank_to_score(safe_get(t2, "redzone_defense_ranking"))
    off2 = rank_to_score(safe_get(t2, "redzone_offense_ranking"))
    def1 = rank_to_score(safe_get(t1, "redzone_defense_ranking"))
    return (off1 - def2) - (off2 - def1)


def epa_index(t1, t2):
    """
    EPA (Expected Points Added) mismatch - NFL-specific advanced metric
    """
    off1_epa = rank_to_score(safe_get(t1, "epa_per_play_rank"))
    def2_epa = rank_to_score(safe_get(t2, "epa_per_play_defense_rank"))
    off2_epa = rank_to_score(safe_get(t2, "epa_per_play_rank"))
    def1_epa = rank_to_score(safe_get(t1, "epa_per_play_defense_rank"))
    return (off1_epa - def2_epa) - (off2_epa - def1_epa)


def epa_pass_index(t1, t2):
    """
    EPA passing mismatch
    """
    off1_epa_pass = rank_to_score(safe_get(t1, "epa_pass_rank"))
    def2_epa_pass = rank_to_score(safe_get(t2, "epa_pass_defense_rank"))
    off2_epa_pass = rank_to_score(safe_get(t2, "epa_pass_rank"))
    def1_epa_pass = rank_to_score(safe_get(t1, "epa_pass_defense_rank"))
    return (off1_epa_pass - def2_epa_pass) - (off2_epa_pass - def1_epa_pass)


def epa_rush_index(t1, t2):
    """
    EPA rushing mismatch
    """
    off1_epa_rush = rank_to_score(safe_get(t1, "epa_rush_rank"))
    def2_epa_rush = rank_to_score(safe_get(t2, "epa_rush_defense_rank"))
    off2_epa_rush = rank_to_score(safe_get(t2, "epa_rush_rank"))
    def1_epa_rush = rank_to_score(safe_get(t1, "epa_rush_defense_rank"))
    return (off1_epa_rush - def2_epa_rush) - (off2_epa_rush - def1_epa_rush)


def play_success_rate_index(t1, t2):
    """
    Play success rate mismatch
    """
    off1_sr = rank_to_score(safe_get(t1, "play_success_rate_rank"))
    def2_sr = rank_to_score(safe_get(t2, "play_success_rate_defense_rank"))
    off2_sr = rank_to_score(safe_get(t2, "play_success_rate_rank"))
    def1_sr = rank_to_score(safe_get(t1, "play_success_rate_defense_rank"))
    return (off1_sr - def2_sr) - (off2_sr - def1_sr)


def turnover_index(t1, t2):
    # Higher score = better (more favorable turnover margin rank)
    tm1 = rank_to_score(safe_get(t1, "turnover_margin_ranking"))
    tm2 = rank_to_score(safe_get(t2, "turnover_margin_ranking"))
    return tm1 - tm2


def penalties_index(t1, t2):
    # Lower penalties per game rank is better (fewer penalties).
    p1 = rank_to_score(safe_get(t1, "penalties_per_game_ranking"))
    p2 = rank_to_score(safe_get(t2, "penalties_per_game_ranking"))
    return p1 - p2


def pace_pair_score(t1, t2):
    # For totals: faster + faster → higher; slower + slower → lower
    p1 = rank_to_score(safe_get(t1, "pace_ranking"))
    p2 = rank_to_score(safe_get(t2, "pace_ranking"))
    return (p1 + p2) / 2.0  # average pace score


def touchdown_efficiency_index(t1, t2):
    """
    Touchdown efficiency mismatch (TDs per game vs TDs allowed)
    """
    off1_td = rank_to_score(safe_get(t1, "touchdowns_per_game_ranking"))
    def2_td = rank_to_score(safe_get(t2, "touchdowns_per_game_allowed_ranking"))
    off2_td = rank_to_score(safe_get(t2, "touchdowns_per_game_ranking"))
    def1_td = rank_to_score(safe_get(t1, "touchdowns_per_game_allowed_ranking"))
    return (off1_td - def2_td) - (off2_td - def1_td)


def redzone_td_index(t1, t2):
    """
    Red zone touchdown efficiency
    """
    off1_rz_td = rank_to_score(safe_get(t1, "redzone_tds_per_game_ranking"))
    def2_rz_td = rank_to_score(safe_get(t2, "redzone_touchdowns_per_game_allowed_ranking"))
    off2_rz_td = rank_to_score(safe_get(t2, "redzone_tds_per_game_ranking"))
    def1_rz_td = rank_to_score(safe_get(t1, "redzone_touchdowns_per_game_allowed_ranking"))
    return (off1_rz_td - def2_rz_td) - (off2_rz_td - def1_rz_td)


def completion_efficiency_index(t1, t2):
    """
    Completion efficiency (completions per game vs completions allowed)
    """
    off1_comp = rank_to_score(safe_get(t1, "completions_per_game_ranking"))
    def2_comp = rank_to_score(safe_get(t2, "completions_allowed_per_game_ranking"))
    off2_comp = rank_to_score(safe_get(t2, "completions_per_game_ranking"))
    def1_comp = rank_to_score(safe_get(t1, "completions_allowed_per_game_ranking"))
    return (off1_comp - def2_comp) - (off2_comp - def1_comp)


def interception_index(t1, t2):
    """
    Interception efficiency (interceptions thrown vs interceptions per game)
    """
    off1_int = rank_to_score(safe_get(t1, "interceptions_thrown_per_game_ranking"))
    def2_int = rank_to_score(safe_get(t2, "interceptions_per_game_ranking"))
    off2_int = rank_to_score(safe_get(t2, "interceptions_thrown_per_game_ranking"))
    def1_int = rank_to_score(safe_get(t1, "interceptions_per_game_ranking"))
    return (off1_int - def2_int) - (off2_int - def1_int)


# =======================
# Prediction Core
# =======================
def predict_games(team_stats, public_bets):
    """
    Generate predictions for all games using rank-only indices.
    """
    results = []
    missing_teams = set()

    # Component weights for spread index (unitless → then scaled to points)
    W = {
        "core": 1.032,
        "pass": 0.600,
        "rush": 0.400,
        "third": 0.300,
        "redzone": 0.250,
        "epa": 0.800,
        "epa_pass": 0.522,
        "epa_rush": 0.285,
        "play_success": 0.389,
        "turnovers": 0.250,
        "penalties": 0.102,
        "pace_spread": 0.050,
        "td_efficiency": 0.366,
        "redzone_td": 0.200,
        "completion_eff": 0.197,
        "interception": 0.146
    }

    # Component weights for totals index (unitless → then scaled to points)
    WT = {
        "offdef_sum": 1.200,
        "pass_mix": 0.500,
        "rush_mix": 0.300,
        "third": 0.250,
        "redzone": 0.300,
        "epa": 0.600,
        "play_success": 0.400,
        "pace": 0.800,
        "turnovers": 0.100,
        "penalties": 0.050,
        "td_efficiency": 0.400,
        "redzone_td": 0.250
    }

    for game in public_bets:
        team1 = game["Team1"]  # away
        team2 = game["Team2"]  # home

        if team1 not in team_stats:
            missing_teams.add(team1); continue
        if team2 not in team_stats:
            missing_teams.add(team2); continue

        t1 = team_stats[team1]
        t2 = team_stats[team2]

        # --- Spread index (Team1 - Team2) ---
        core    = offense_defense_core_index(t1, t2)
        pmix    = pass_mismatch_index(t1, t2)
        rmix    = rush_mismatch_index(t1, t2)
        tdown   = third_down_index(t1, t2)
        rz      = redzone_index(t1, t2)
        epa     = epa_index(t1, t2)
        epa_pass = epa_pass_index(t1, t2)
        epa_rush = epa_rush_index(t1, t2)
        play_sr = play_success_rate_index(t1, t2)
        tovr    = turnover_index(t1, t2)
        pen     = penalties_index(t1, t2)
        pace_s  = pace_pair_score(t1, t2)
        td_eff  = touchdown_efficiency_index(t1, t2)
        rz_td   = redzone_td_index(t1, t2)
        comp_eff = completion_efficiency_index(t1, t2)
        int_eff = interception_index(t1, t2)

        spread_index = (
            W["core"]  * core  +
            W["pass"]  * pmix  +
            W["rush"]  * rmix  +
            W["third"] * tdown +
            W["redzone"]* rz   +
            W["epa"]   * epa   +
            W["epa_pass"] * epa_pass +
            W["epa_rush"] * epa_rush +
            W["play_success"] * play_sr +
            W["turnovers"] * tovr +
            W["penalties"] * pen +
            W["pace_spread"] * (pace_s - 0.5) +
            W["td_efficiency"] * td_eff +
            W["redzone_td"] * rz_td +
            W["completion_eff"] * comp_eff +
            W["interception"] * int_eff
        )

        predicted_margin = INDEX_SCALE_SPREAD * spread_index

        # Home field (Team2 = home): subtract HFA from Team1 margin
        predicted_margin -= HFA_POINTS

        # --- Totals index ---
        # Off/Def aggregate: (off1 + off2) - (def1 + def2)
        off1 = rank_to_score(safe_get(t1, "points_per_game_ranking"))
        off2 = rank_to_score(safe_get(t2, "points_per_game_ranking"))
        def1 = rank_to_score(safe_get(t1, "points_allowed_per_game_ranking"))
        def2 = rank_to_score(safe_get(t2, "points_allowed_per_game_ranking"))
        offdef_sum = (off1 + off2) - (def1 + def2)

        totals_index = (
            WT["offdef_sum"] * offdef_sum +
            WT["pass_mix"]   * (pmix + epa_pass) +
            WT["rush_mix"]   * (rmix + epa_rush) +
            WT["third"]      * tdown +
            WT["redzone"]    * rz +
            WT["epa"]        * epa +
            WT["play_success"] * play_sr +
            WT["pace"]       * (pace_s - 0.5) * 2.0 +  # stretch [-1,1] effect
            WT["turnovers"]  * tovr +
            WT["penalties"]  * pen +
            WT["td_efficiency"] * td_eff +
            WT["redzone_td"] * rz_td
        )

        predicted_total = LEAGUE_AVG_TOTAL + INDEX_SCALE_TOTAL * totals_index

        # --- Market, edges, diagnostics ---
        market_spread_t1 = float(game["Team1Spread"])   # Team1 line
        market_total     = float(game["Total"])
        market_margin_t1 = -market_spread_t1            # + => Team1 favored by that many

        edge_spread = predicted_margin - market_margin_t1
        edge_total  = predicted_total - market_total

        # Win probability for Team1 (normal assumption over margin)
        team1_win_prob = 0.5 * (1 + math.erf(predicted_margin / (STD_SPREAD * math.sqrt(2))))

        # Signals for transparency - individual components for better weight optimization
        signals = {
            "core": round(core,3),
            "pass_mismatch": round(pmix,3),
            "rush_mismatch": round(rmix,3),
            "third_down": round(tdown,3),
            "redzone": round(rz,3),
            "epa": round(epa,3),
            "epa_pass": round(epa_pass,3),
            "epa_rush": round(epa_rush,3),
            "play_success": round(play_sr,3),
            "turnovers": round(tovr,3),
            "penalties": round(pen,3),
            "pace": round(pace_s,3),
            "td_efficiency": round(td_eff,3),
            "redzone_td": round(rz_td,3),
            "completion_eff": round(comp_eff,3),
            "interception": round(int_eff,3)
        }

        results.append({
            "matchup": f"{team1} vs {team2}",
            "team1": team1,
            "team2": team2,
            "model_margin_team1_minus_team2": round(predicted_margin, 2),
            "pred_total": round(predicted_total, 1),
            "team1_win_probability": round(team1_win_prob, 3),
            "edge_spread": round(edge_spread, 2),
            "edge_total": round(edge_total, 2),
            "market": {
                "spread_team1": market_spread_t1,
                "total": market_total
            },
            "signals": signals,
            "original_game_data": game
        })

    if missing_teams:
        print(f"Warning: Missing team stats for {len(missing_teams)} teams: {sorted(missing_teams)}")

    # --------------- Categorize ---------------
    best_favorites, best_underdogs, best_overs, best_unders = [], [], [], []

    for gp in results:
        game = gp["original_game_data"]
        team1, team2 = gp["team1"], gp["team2"]
        pred_margin  = gp["model_margin_team1_minus_team2"]
        pred_total   = gp["pred_total"]

        market_team1_spread = float(game["Team1Spread"])
        market_total        = float(game["Total"])
        market_margin_t1    = -market_team1_spread

        edge_spread = gp["edge_spread"]
        edge_total  = gp["edge_total"]

        # Best Favorites
        if market_team1_spread < 0 and pred_margin > market_margin_t1 + FAVORITE_EDGE_MIN:
            conf = spread_confidence(edge_spread)
            if conf >= MIN_CONFIDENCE:
                best_favorites.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"{team1} {market_team1_spread}",
                    "spread_value": f"{market_team1_spread}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_spread), 2),
                    "reason": reason_for_spread(team1, team2, pred_margin, market_team1_spread),
                    "confidence": conf
                })
        elif market_team1_spread > 0 and pred_margin < market_margin_t1 - FAVORITE_EDGE_MIN:
            conf = spread_confidence(abs(edge_spread))
            if conf >= MIN_CONFIDENCE:
                best_favorites.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"{team2} {round(-market_team1_spread, 1)}",
                    "spread_value": f"{round(-market_team1_spread, 1)}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_spread), 2),
                    "reason": reason_for_spread(team1, team2, pred_margin, market_team1_spread),
                    "confidence": conf
                })

        # Best Underdogs (including upsets - market dog projected to win)
        # Upset alerts (market dog projected to win)
        if market_team1_spread > 0 and pred_margin > 0:
            conf = spread_confidence(abs(edge_spread))
            if conf >= MIN_CONFIDENCE:
                best_underdogs.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"{team1} ML",
                    "spread_value": f"+{round(market_team1_spread, 1)}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_spread), 2),
                    "reason": reason_for_spread(team1, team2, pred_margin, market_team1_spread),
                    "confidence": conf,
                    "ml_value": game.get("Team1ML")
                })
        elif market_team1_spread < 0 and pred_margin < 0:
            conf = spread_confidence(abs(edge_spread))
            if conf >= MIN_CONFIDENCE:
                best_underdogs.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"{team2} ML",
                    "spread_value": f"+{round(abs(market_team1_spread), 1)}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_spread), 2),
                    "reason": reason_for_spread(team1, team2, pred_margin, market_team1_spread),
                    "confidence": conf,
                    "ml_value": game.get("Team2ML")
                })
        # Regular underdog picks
        elif market_team1_spread > 0 and pred_margin > market_margin_t1 - UNDERDOG_EDGE_MIN:
            conf = spread_confidence(abs(edge_spread))
            if conf >= MIN_CONFIDENCE:
                best_underdogs.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"{team1} +{round(market_team1_spread, 1)}",
                    "spread_value": f"+{round(market_team1_spread, 1)}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_spread), 2),
                    "reason": reason_for_spread(team1, team2, pred_margin, market_team1_spread),
                    "confidence": conf
                })
        elif market_team1_spread < 0 and pred_margin < market_margin_t1 + UNDERDOG_EDGE_MIN:
            conf = spread_confidence(abs(edge_spread))
            if conf >= MIN_CONFIDENCE:
                best_underdogs.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"{team2} +{round(abs(market_team1_spread), 1)}",
                    "spread_value": f"+{round(abs(market_team1_spread), 1)}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_spread), 2),
                    "reason": reason_for_spread(team1, team2, pred_margin, market_team1_spread),
                    "confidence": conf
                })

        # Best Overs
        if edge_total >= TOTAL_EDGE_MIN:
            conf = total_confidence(edge_total)
            if conf >= MIN_CONFIDENCE:
                best_overs.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"Over {market_total}",
                    "total_value": f"{market_total}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_total), 2),
                    "reason": reason_for_total(pred_total, market_total, "Over"),
                    "confidence": conf
                })

        # Best Unders
        if edge_total <= -TOTAL_EDGE_MIN:
            conf = total_confidence(abs(edge_total))
            if conf >= MIN_CONFIDENCE:
                best_unders.append({
                    "matchup": f"{team1} vs {team2}",
                    "team1Spread": float(game["Team1Spread"]),
                    "team2Spread": float(game["Team2Spread"]),
                    "homeTeam": team2,
                    "model_pick": f"Under {market_total}",
                    "total_value": f"{market_total}",
                    "model_spread": model_spread_string(team1, team2, pred_margin),
                    "model_total": round(pred_total, 1),
                    "difference": round(abs(edge_total), 2),
                    "reason": reason_for_total(pred_total, market_total, "Under"),
                    "confidence": conf
                })

    # Sort and cap buckets
    for bucket in (best_favorites, best_underdogs, best_overs, best_unders):
        bucket.sort(key=lambda x: x["difference"], reverse=True)

    best_favorites = best_favorites[:MAX_PER_BUCKET]
    best_underdogs = best_underdogs[:MAX_PER_BUCKET]
    best_overs     = best_overs[:MAX_PER_BUCKET]
    best_unders    = best_unders[:MAX_PER_BUCKET]

    return results, best_favorites, best_underdogs, best_overs, best_unders


# =======================
# CLI
# =======================
def main():
    parser = argparse.ArgumentParser(description="NFL Prediction Model (Ranks Only)")
    parser.add_argument("--team-stats", default="../json-data/teamStats.json",
                        help="Path to team statistics JSON file")
    parser.add_argument("--public-bets", default="../json-data/publicBets.json",
                        help="Path to public betting data JSON file")
    parser.add_argument("--output", default="nfl_best_bets.json",
                        help="Output file path (default: nfl_best_bets.json)")
    parser.add_argument("--pretty", action="store_true",
                        help="Pretty print summary to console")

    args = parser.parse_args()

    team_stats, public_bets = load_data(args.team_stats, args.public_bets)

    results, best_favorites, best_underdogs, best_overs, best_unders = predict_games(team_stats, public_bets)

    output = {
        "metadata": {
            "games_count": len(results),
            "thresholds": {
                "FAVORITE_EDGE_MIN": FAVORITE_EDGE_MIN,
                "UNDERDOG_EDGE_MIN": UNDERDOG_EDGE_MIN,
                "TOTAL_EDGE_MIN": TOTAL_EDGE_MIN,
                "MIN_CONFIDENCE": MIN_CONFIDENCE
            },
            "calibration": {
                "STD_SPREAD": STD_SPREAD,
                "STD_TOTAL": STD_TOTAL,
                "INDEX_SCALE_SPREAD": INDEX_SCALE_SPREAD,
                "INDEX_SCALE_TOTAL": INDEX_SCALE_TOTAL,
                "LEAGUE_AVG_TOTAL": LEAGUE_AVG_TOTAL,
                "HFA_POINTS": HFA_POINTS
            }
        },
        "predictions": results,
        "best_favorites": best_favorites,
        "best_underdogs": best_underdogs,
        "best_overs": best_overs,
        "best_unders": best_unders
    }

    if args.output:
        with open(args.output, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"Predictions saved to {args.output}")
    else:
        print(json.dumps(output, indent=2))

    if args.pretty:
        print(f"\n{'='*60}")
        print(f"NFL MODEL PREDICTIONS SUMMARY (Ranks Only)")
        print(f"{'='*60}")
        print(f"Total games analyzed: {len(results)}")
        print(f"\nBest Favorites ({len(best_favorites)}):")
        for i, pick in enumerate(best_favorites, 1):
            print(f"{i}. {pick['model_pick']} - {pick['matchup']}")
            print(f"   Confidence: {pick['confidence']:.3f} | Edge: {pick['difference']:.1f}")
            print(f"   {pick['reason']}\n")
        print(f"\nBest Underdogs ({len(best_underdogs)}):")
        for i, pick in enumerate(best_underdogs, 1):
            print(f"{i}. {pick['model_pick']} - {pick['matchup']}")
            print(f"   Confidence: {pick['confidence']:.3f} | Edge: {pick['difference']:.1f}")
            print(f"   {pick['reason']}\n")
        print(f"\nBest Overs ({len(best_overs)}):")
        for i, pick in enumerate(best_overs, 1):
            print(f"{i}. {pick['model_pick']} - {pick['matchup']}")
            print(f"   Confidence: {pick['confidence']:.3f} | Edge: {pick['difference']:.1f}")
            print(f"   {pick['reason']}\n")
        print(f"\nBest Unders ({len(best_unders)}):")
        for i, pick in enumerate(best_unders, 1):
            print(f"{i}. {pick['model_pick']} - {pick['matchup']}")
            print(f"   Confidence: {pick['confidence']:.3f} | Edge: {pick['difference']:.1f}")
            print(f"   {pick['reason']}\n")

if __name__ == "__main__":
    main()
