#!/usr/bin/env python3
"""
evaluate_nfl_model.py - NFL Model Evaluation and Weight Optimization Script

This script evaluates the performance of the NFL prediction model by comparing
predictions against actual game results, then optimizes model weights based on
the analysis.

Usage:
    python evaluate_nfl_model.py [--predictions PATH] [--scores PATH] [--output PATH] [--update-model]
"""

import argparse
import json
import math
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import re

# =======================
# Data Structures
# =======================

@dataclass
class GameResult:
    """Container for a single game's prediction vs actual result"""
    matchup: str
    team1: str
    team2: str
    
    # Predictions
    pred_margin: float
    pred_total: float
    pred_team1_win_prob: float
    market_spread: float
    market_total: float
    
    # Actual results
    actual_margin: float
    actual_total: float
    actual_team1_won: bool
    
    # Analysis
    spread_error: float
    total_error: float
    spread_edge: float
    total_edge: float
    confidence: float
    
    # Model signals for analysis
    signals: Dict[str, float]

@dataclass
class ModelPerformance:
    """Container for overall model performance metrics"""
    total_games: int
    matched_games: int
    
    # Spread performance
    spread_mae: float
    spread_rmse: float
    spread_accuracy: float  # % of correct ATS picks
    spread_edge_accuracy: float  # % of edge bets that won
    
    # Total performance
    total_mae: float
    total_rmse: float
    total_accuracy: float  # % of correct O/U picks
    
    # Confidence calibration
    confidence_calibration: Dict[str, float]
    
    # Signal analysis
    signal_performance: Dict[str, Dict[str, float]]

# =======================
# Team Name Normalization
# =======================

def load_team_normalization(normalization_file: str = "../json-links/team-normalization.json") -> Dict[str, str]:
    """Load team name normalization mapping"""
    try:
        with open(normalization_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: Normalization file not found at {normalization_file}")
        return {}

def normalize_team_name(team_name: str, mapping: Dict[str, str]) -> str:
    """Normalize team name using mapping"""
    return mapping.get(team_name, team_name)

def create_matchup_key(team1: str, team2: str) -> str:
    """Create standardized matchup key"""
    return f"{team1} vs {team2}"

# =======================
# Data Loading and Matching
# =======================

def load_predictions(predictions_file: str) -> List[Dict]:
    """Load model predictions from JSON file"""
    try:
        with open(predictions_file, 'r') as f:
            data = json.load(f)
        return data.get("predictions", [])
    except FileNotFoundError:
        print(f"Error: Predictions file not found at {predictions_file}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in predictions file: {e}")
        return []

def load_scores(scores_file: str) -> Dict[str, Dict]:
    """Load actual game scores from JSON file"""
    try:
        with open(scores_file, 'r') as f:
            data = json.load(f)
        return {game["MatchupKey"]: game for game in data.get("games", [])}
    except FileNotFoundError:
        print(f"Error: Scores file not found at {scores_file}")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in scores file: {e}")
        return {}

def match_predictions_to_scores(predictions: List[Dict], scores: Dict[str, Dict], 
                               normalization: Dict[str, str]) -> List[GameResult]:
    """Match predictions with actual scores and create GameResult objects"""
    results = []
    
    for pred in predictions:
        # Normalize team names
        team1 = normalize_team_name(pred["team1"], normalization)
        team2 = normalize_team_name(pred["team2"], normalization)
        
        # Try different matchup key formats
        matchup_keys = [
            create_matchup_key(team1, team2),
            create_matchup_key(pred["team1"], pred["team2"]),
            f"{team1} vs {team2}",
            f"{pred['team1']} vs {pred['team2']}"
        ]
        
        # Find matching score
        score_data = None
        for key in matchup_keys:
            if key in scores:
                score_data = scores[key]
                break
        
        if not score_data:
            print(f"Warning: No score found for {pred['matchup']}")
            continue
        
        # Extract prediction data
        pred_margin = pred["model_margin_team1_minus_team2"]
        pred_total = pred["pred_total"]
        pred_win_prob = pred["team1_win_probability"]
        market_spread = float(pred["market"]["spread_team1"])
        market_total = float(pred["market"]["total"])
        
        # Extract actual results
        actual_margin = score_data["Team1Score"] - score_data["Team2Score"]
        actual_total = score_data["Team1Score"] + score_data["Team2Score"]
        actual_team1_won = actual_margin > 0
        
        # Calculate errors and edges
        spread_error = pred_margin - actual_margin
        total_error = pred_total - actual_total
        spread_edge = pred_margin - (-market_spread)  # Convert market spread to margin
        total_edge = pred_total - market_total
        
        # Calculate confidence (simplified)
        confidence = min(0.99, max(0.5, 0.5 + abs(spread_edge) / 20.0))
        
        result = GameResult(
            matchup=pred["matchup"],
            team1=team1,
            team2=team2,
            pred_margin=pred_margin,
            pred_total=pred_total,
            pred_team1_win_prob=pred_win_prob,
            market_spread=market_spread,
            market_total=market_total,
            actual_margin=actual_margin,
            actual_total=actual_total,
            actual_team1_won=actual_team1_won,
            spread_error=spread_error,
            total_error=total_error,
            spread_edge=spread_edge,
            total_edge=total_edge,
            confidence=confidence,
            signals=pred.get("signals", {})
        )
        
        results.append(result)
    
    return results

# =======================
# Performance Analysis
# =======================

def calculate_spread_performance(results: List[GameResult]) -> Dict[str, float]:
    """Calculate spread prediction performance metrics"""
    if not results:
        return {}
    
    # Basic error metrics
    spread_errors = [r.spread_error for r in results]
    mae = np.mean(np.abs(spread_errors))
    rmse = np.sqrt(np.mean(np.array(spread_errors) ** 2))
    
    # ATS accuracy (correct spread picks)
    correct_ats = 0
    total_ats = 0
    
    for r in results:
        # Determine which team covered
        market_favored_team1 = r.market_spread < 0
        actual_team1_covered = r.actual_margin > r.market_spread
        
        if market_favored_team1:
            # Team1 was favored, check if they covered
            if actual_team1_covered:
                correct_ats += 1
        else:
            # Team2 was favored, check if they covered
            if not actual_team1_covered:
                correct_ats += 1
        
        total_ats += 1
    
    ats_accuracy = correct_ats / total_ats if total_ats > 0 else 0
    
    # Edge bet accuracy (bets with significant edge)
    edge_threshold = 3.0  # Minimum edge to consider
    edge_bets = [r for r in results if abs(r.spread_edge) >= edge_threshold]
    
    edge_correct = 0
    for r in edge_bets:
        if (r.spread_edge > 0 and r.actual_team1_won) or (r.spread_edge < 0 and not r.actual_team1_won):
            edge_correct += 1
    
    edge_accuracy = edge_correct / len(edge_bets) if edge_bets else 0
    
    return {
        "mae": mae,
        "rmse": rmse,
        "ats_accuracy": ats_accuracy,
        "edge_accuracy": edge_accuracy,
        "edge_bets_count": len(edge_bets)
    }

def calculate_total_performance(results: List[GameResult]) -> Dict[str, float]:
    """Calculate total prediction performance metrics"""
    if not results:
        return {}
    
    # Basic error metrics
    total_errors = [r.total_error for r in results]
    mae = np.mean(np.abs(total_errors))
    rmse = np.sqrt(np.mean(np.array(total_errors) ** 2))
    
    # O/U accuracy
    correct_ou = 0
    for r in results:
        pred_over = r.pred_total > r.market_total
        actual_over = r.actual_total > r.market_total
        if pred_over == actual_over:
            correct_ou += 1
    
    ou_accuracy = correct_ou / len(results) if results else 0
    
    return {
        "mae": mae,
        "rmse": rmse,
        "ou_accuracy": ou_accuracy
    }

def analyze_signal_performance(results: List[GameResult]) -> Dict[str, Dict[str, float]]:
    """Analyze performance of individual model signals"""
    if not results:
        return {}
    
    # Get all signal names
    all_signals = set()
    for r in results:
        all_signals.update(r.signals.keys())
    
    signal_performance = {}
    
    for signal in all_signals:
        # Calculate correlation between signal strength and prediction accuracy
        signal_values = []
        accuracies = []
        
        for r in results:
            if signal in r.signals:
                signal_values.append(r.signals[signal])
                
                # Calculate accuracy for this game
                spread_error = abs(r.spread_error)
                accuracy = max(0, 1 - spread_error / 20.0)  # Normalize error to 0-1
                accuracies.append(accuracy)
        
        if len(signal_values) > 1:
            correlation = np.corrcoef(signal_values, accuracies)[0, 1]
            signal_performance[signal] = {
                "correlation": correlation,
                "games_count": len(signal_values),
                "avg_signal": np.mean(signal_values),
                "avg_accuracy": np.mean(accuracies)
            }
    
    return signal_performance

def calculate_confidence_calibration(results: List[GameResult]) -> Dict[str, float]:
    """Calculate confidence calibration metrics"""
    if not results:
        return {}
    
    # Bin results by confidence level
    confidence_bins = {
        "low": [r for r in results if r.confidence < 0.6],
        "medium": [r for r in results if 0.6 <= r.confidence < 0.8],
        "high": [r for r in results if r.confidence >= 0.8]
    }
    
    calibration = {}
    for bin_name, bin_results in confidence_bins.items():
        if bin_results:
            # Calculate actual accuracy for this confidence bin
            correct_predictions = 0
            for r in bin_results:
                # Check if prediction was correct (within reasonable margin)
                if abs(r.spread_error) < 7.0:  # Within 1 TD
                    correct_predictions += 1
            
            actual_accuracy = correct_predictions / len(bin_results)
            avg_confidence = np.mean([r.confidence for r in bin_results])
            
            calibration[bin_name] = {
                "actual_accuracy": actual_accuracy,
                "avg_confidence": avg_confidence,
                "games_count": len(bin_results),
                "calibration_error": abs(actual_accuracy - avg_confidence)
            }
    
    return calibration

# =======================
# Weight Optimization
# =======================

def optimize_weights(results: List[GameResult], current_weights: Dict[str, float]) -> Dict[str, float]:
    """Optimize model weights and all tunable parameters based on performance analysis"""
    if not results:
        return current_weights
    
    # Analyze signal performance
    signal_performance = analyze_signal_performance(results)
    
    # Calculate weight adjustments based on signal effectiveness
    optimized_weights = current_weights.copy()
    
    # Optimize signal weights
    for signal, perf in signal_performance.items():
        if signal in current_weights:
            correlation = perf["correlation"]
            games_count = perf["games_count"]
            
            # Only adjust if we have enough data and meaningful correlation
            if games_count >= 5 and abs(correlation) > 0.1:  # Lower threshold for NFL
                # Adjust weight based on correlation strength
                adjustment_factor = 1.0 + (correlation * 0.15)  # Max 15% adjustment for NFL
                optimized_weights[signal] *= adjustment_factor
                # Keep weights within reasonable bounds
                optimized_weights[signal] = max(0.01, min(2.0, optimized_weights[signal]))
    
    # Optimize calibration constants based on error patterns
    spread_errors = [r.spread_error for r in results]
    total_errors = [r.total_error for r in results]
    
    # Adjust STD_SPREAD based on actual error distribution
    actual_spread_std = np.std(spread_errors)
    if actual_spread_std > 0:
        current_std = current_weights.get('STD_SPREAD', 7.2)
        # Blend current estimate with actual data (80% current, 20% actual for NFL)
        optimized_weights['STD_SPREAD'] = 0.8 * current_std + 0.2 * actual_spread_std
        optimized_weights['STD_SPREAD'] = max(5.0, min(12.0, optimized_weights['STD_SPREAD']))
    
    # Adjust STD_TOTAL based on actual error distribution
    actual_total_std = np.std(total_errors)
    if actual_total_std > 0:
        current_std = current_weights.get('STD_TOTAL', 6.0)
        optimized_weights['STD_TOTAL'] = 0.8 * current_std + 0.2 * actual_total_std
        optimized_weights['STD_TOTAL'] = max(4.0, min(10.0, optimized_weights['STD_TOTAL']))
    
    # Optimize INDEX_SCALE_SPREAD based on prediction accuracy
    spread_mae = np.mean(np.abs(spread_errors))
    if spread_mae > 0:
        current_scale = current_weights.get('INDEX_SCALE_SPREAD', 4.8)
        # If MAE is high, reduce scale; if low, increase scale
        scale_adjustment = 1.0 - (spread_mae - 6.0) / 12.0  # Target MAE of 6 for NFL
        optimized_weights['INDEX_SCALE_SPREAD'] = current_scale * scale_adjustment
        optimized_weights['INDEX_SCALE_SPREAD'] = max(3.0, min(7.0, optimized_weights['INDEX_SCALE_SPREAD']))
    
    # Optimize INDEX_SCALE_TOTAL based on total prediction accuracy
    total_mae = np.mean(np.abs(total_errors))
    if total_mae > 0:
        current_scale = current_weights.get('INDEX_SCALE_TOTAL', 3.1)
        scale_adjustment = 1.0 - (total_mae - 5.0) / 10.0  # Target MAE of 5 for NFL
        optimized_weights['INDEX_SCALE_TOTAL'] = current_scale * scale_adjustment
        optimized_weights['INDEX_SCALE_TOTAL'] = max(2.0, min(5.0, optimized_weights['INDEX_SCALE_TOTAL']))
    
    # Optimize LEAGUE_AVG_TOTAL based on actual totals
    actual_totals = [r.actual_total for r in results]
    if actual_totals:
        actual_avg = np.mean(actual_totals)
        current_avg = current_weights.get('LEAGUE_AVG_TOTAL', 45.5)
        # Blend current estimate with actual data
        optimized_weights['LEAGUE_AVG_TOTAL'] = 0.9 * current_avg + 0.1 * actual_avg
        optimized_weights['LEAGUE_AVG_TOTAL'] = max(40.0, min(50.0, optimized_weights['LEAGUE_AVG_TOTAL']))
    
    # Optimize HFA_POINTS based on home team performance
    home_games = [r for r in results if r.team2 in r.matchup]  # Team2 is home
    if home_games:
        home_advantage = np.mean([r.actual_margin for r in home_games])
        current_hfa = current_weights.get('HFA_POINTS', 2.5)
        # Adjust HFA based on actual home advantage
        hfa_adjustment = 1.0 + (home_advantage - current_hfa) / 8.0
        optimized_weights['HFA_POINTS'] = current_hfa * hfa_adjustment
        optimized_weights['HFA_POINTS'] = max(1.0, min(4.0, optimized_weights['HFA_POINTS']))
    
    # Optimize selection thresholds based on edge performance
    edge_bets = [r for r in results if abs(r.spread_edge) >= 2.0]  # Lower threshold for NFL
    if edge_bets:
        edge_accuracy = sum(1 for r in edge_bets if 
                          (r.spread_edge > 0 and r.actual_team1_won) or 
                          (r.spread_edge < 0 and not r.actual_team1_won)) / len(edge_bets)
        
        # If edge accuracy is low, increase thresholds
        if edge_accuracy < 0.5:
            threshold_adjustment = 1.1  # Increase thresholds by 10%
            optimized_weights['FAVORITE_EDGE_MIN'] = min(4.0, 
                current_weights.get('FAVORITE_EDGE_MIN', 2.2) * threshold_adjustment)
            optimized_weights['UNDERDOG_EDGE_MIN'] = min(4.0, 
                current_weights.get('UNDERDOG_EDGE_MIN', 2.2) * threshold_adjustment)
            optimized_weights['TOTAL_EDGE_MIN'] = min(6.0, 
                current_weights.get('TOTAL_EDGE_MIN', 3.3) * threshold_adjustment)
        elif edge_accuracy > 0.6:
            threshold_adjustment = 0.9  # Decrease thresholds by 10%
            optimized_weights['FAVORITE_EDGE_MIN'] = max(1.5, 
                current_weights.get('FAVORITE_EDGE_MIN', 2.2) * threshold_adjustment)
            optimized_weights['UNDERDOG_EDGE_MIN'] = max(1.5, 
                current_weights.get('UNDERDOG_EDGE_MIN', 2.2) * threshold_adjustment)
            optimized_weights['TOTAL_EDGE_MIN'] = max(2.5, 
                current_weights.get('TOTAL_EDGE_MIN', 3.3) * threshold_adjustment)
    
    # Optimize MIN_CONFIDENCE based on confidence calibration
    high_conf_games = [r for r in results if r.confidence >= 0.75]
    if high_conf_games:
        high_conf_accuracy = sum(1 for r in high_conf_games if abs(r.spread_error) < 7.0) / len(high_conf_games)
        current_min_conf = current_weights.get('MIN_CONFIDENCE', 0.650)
        
        # If high confidence games are actually less accurate, increase min confidence
        if high_conf_accuracy < 0.7:
            optimized_weights['MIN_CONFIDENCE'] = min(0.75, current_min_conf + 0.025)
        elif high_conf_accuracy > 0.8:
            optimized_weights['MIN_CONFIDENCE'] = max(0.55, current_min_conf - 0.025)
    
    return optimized_weights

# =======================
# Model Update Functions
# =======================

def extract_current_weights(model_file: str) -> Dict[str, float]:
    """Extract current weights and all tunable parameters from the model file"""
    try:
        with open(model_file, 'r') as f:
            content = f.read()
        
        weights = {}
        
        # Extract weight dictionaries using regex
        w_pattern = r'W\s*=\s*\{([^}]+)\}'
        wt_pattern = r'WT\s*=\s*\{([^}]+)\}'
        
        w_match = re.search(w_pattern, content, re.DOTALL)
        wt_match = re.search(wt_pattern, content, re.DOTALL)
        
        if w_match:
            w_content = w_match.group(1)
            # Parse individual weight assignments
            weight_pattern = r'"([^"]+)":\s*([0-9.]+)'
            for match in re.finditer(weight_pattern, w_content):
                weights[match.group(1)] = float(match.group(2))
        
        if wt_match:
            wt_content = wt_match.group(1)
            weight_pattern = r'"([^"]+)":\s*([0-9.]+)'
            for match in re.finditer(weight_pattern, wt_content):
                weights[f"total_{match.group(1)}"] = float(match.group(2))
        
        # Extract calibration constants
        calibration_patterns = {
            'STD_SPREAD': r'STD_SPREAD\s*=\s*([0-9.]+)',
            'STD_TOTAL': r'STD_TOTAL\s*=\s*([0-9.]+)',
            'INDEX_SCALE_SPREAD': r'INDEX_SCALE_SPREAD\s*=\s*([0-9.]+)',
            'INDEX_SCALE_TOTAL': r'INDEX_SCALE_TOTAL\s*=\s*([0-9.]+)',
            'LEAGUE_AVG_TOTAL': r'LEAGUE_AVG_TOTAL\s*=\s*([0-9.]+)',
            'HFA_POINTS': r'HFA_POINTS\s*=\s*([0-9.]+)',
            'N_TEAMS': r'N_TEAMS\s*=\s*([0-9.]+)'
        }
        
        for param_name, pattern in calibration_patterns.items():
            match = re.search(pattern, content)
            if match:
                weights[param_name] = float(match.group(1))
        
        # Extract selection thresholds
        threshold_patterns = {
            'FAVORITE_EDGE_MIN': r'FAVORITE_EDGE_MIN\s*=\s*([0-9.]+)',
            'UNDERDOG_EDGE_MIN': r'UNDERDOG_EDGE_MIN\s*=\s*([0-9.]+)',
            'TOTAL_EDGE_MIN': r'TOTAL_EDGE_MIN\s*=\s*([0-9.]+)',
            'MIN_CONFIDENCE': r'MIN_CONFIDENCE\s*=\s*([0-9.]+)',
            'MAX_PER_BUCKET': r'MAX_PER_BUCKET\s*=\s*([0-9.]+)'
        }
        
        for param_name, pattern in threshold_patterns.items():
            match = re.search(pattern, content)
            if match:
                weights[param_name] = float(match.group(1))
        
        return weights
    except Exception as e:
        print(f"Error extracting weights: {e}")
        return {}

def update_model_weights(model_file: str, optimized_weights: Dict[str, float]):
    """Update the model file with optimized weights and all tunable parameters"""
    try:
        with open(model_file, 'r') as f:
            content = f.read()
        
        # Update spread weights (W dictionary)
        w_pattern = r'(W\s*=\s*\{)([^}]+)(\})'
        
        def replace_w_weights(match):
            prefix = match.group(1)
            suffix = match.group(3)
            
            new_content = prefix + "\n"
            for signal, weight in optimized_weights.items():
                if not signal.startswith("total_") and signal not in [
                    'STD_SPREAD', 'STD_TOTAL', 'INDEX_SCALE_SPREAD', 'INDEX_SCALE_TOTAL',
                    'LEAGUE_AVG_TOTAL', 'HFA_POINTS', 'N_TEAMS', 'FAVORITE_EDGE_MIN',
                    'UNDERDOG_EDGE_MIN', 'TOTAL_EDGE_MIN', 'MIN_CONFIDENCE', 'MAX_PER_BUCKET'
                ]:
                    new_content += f'        "{signal}": {weight:.3f},\n'
            new_content = new_content.rstrip(",\n") + "\n    " + suffix
            return new_content
        
        content = re.sub(w_pattern, replace_w_weights, content, flags=re.DOTALL)
        
        # Update total weights (WT dictionary)
        wt_pattern = r'(WT\s*=\s*\{)([^}]+)(\})'
        
        def replace_wt_weights(match):
            prefix = match.group(1)
            suffix = match.group(3)
            
            new_content = prefix + "\n"
            for signal, weight in optimized_weights.items():
                if signal.startswith("total_"):
                    clean_signal = signal.replace("total_", "")
                    new_content += f'        "{clean_signal}": {weight:.3f},\n'
            new_content = new_content.rstrip(",\n") + "\n    " + suffix
            return new_content
        
        content = re.sub(wt_pattern, replace_wt_weights, content, flags=re.DOTALL)
        
        # Update calibration constants
        calibration_updates = {
            'STD_SPREAD': r'(STD_SPREAD\s*=\s*)([0-9.]+)',
            'STD_TOTAL': r'(STD_TOTAL\s*=\s*)([0-9.]+)',
            'INDEX_SCALE_SPREAD': r'(INDEX_SCALE_SPREAD\s*=\s*)([0-9.]+)',
            'INDEX_SCALE_TOTAL': r'(INDEX_SCALE_TOTAL\s*=\s*)([0-9.]+)',
            'LEAGUE_AVG_TOTAL': r'(LEAGUE_AVG_TOTAL\s*=\s*)([0-9.]+)',
            'HFA_POINTS': r'(HFA_POINTS\s*=\s*)([0-9.]+)',
            'N_TEAMS': r'(N_TEAMS\s*=\s*)([0-9.]+)'
        }
        
        for param_name, pattern in calibration_updates.items():
            if param_name in optimized_weights:
                old_value = optimized_weights[param_name]
                new_value = f"{old_value:.1f}"
                content = re.sub(pattern, lambda m: m.group(1) + new_value, content)
        
        # Update selection thresholds
        threshold_updates = {
            'FAVORITE_EDGE_MIN': r'(FAVORITE_EDGE_MIN\s*=\s*)([0-9.]+)',
            'UNDERDOG_EDGE_MIN': r'(UNDERDOG_EDGE_MIN\s*=\s*)([0-9.]+)',
            'TOTAL_EDGE_MIN': r'(TOTAL_EDGE_MIN\s*=\s*)([0-9.]+)',
            'MIN_CONFIDENCE': r'(MIN_CONFIDENCE\s*=\s*)([0-9.]+)',
            'MAX_PER_BUCKET': r'(MAX_PER_BUCKET\s*=\s*)([0-9.]+)'
        }
        
        for param_name, pattern in threshold_updates.items():
            if param_name in optimized_weights:
                old_value = optimized_weights[param_name]
                if param_name == 'MIN_CONFIDENCE':
                    new_value = f"{old_value:.3f}"
                else:
                    new_value = f"{old_value:.1f}"
                content = re.sub(pattern, lambda m: m.group(1) + new_value, content)
        
        # Write updated content
        with open(model_file, 'w') as f:
            f.write(content)
        
        print(f"Successfully updated weights and parameters in {model_file}")
        
    except Exception as e:
        print(f"Error updating model file: {e}")

# =======================
# Main Evaluation Function
# =======================

def evaluate_model(predictions_file: str, scores_file: str, 
                  normalization_file: str = "../json-links/team-normalization.json",
                  model_file: str = "nfl_model.py") -> Tuple[ModelPerformance, List[GameResult]]:
    """Main evaluation function"""
    
    # Load data
    predictions = load_predictions(predictions_file)
    scores = load_scores(scores_file)
    normalization = load_team_normalization(normalization_file)
    
    print(f"Loaded {len(predictions)} predictions and {len(scores)} scores")
    
    # Match predictions to scores
    results = match_predictions_to_scores(predictions, scores, normalization)
    
    print(f"Successfully matched {len(results)} games")
    
    if not results:
        print("No matched games found. Cannot evaluate model.")
        return ModelPerformance(0, 0, 0, 0, 0, 0, 0, 0, 0, {}, {}), []
    
    # Calculate performance metrics
    spread_perf = calculate_spread_performance(results)
    total_perf = calculate_total_performance(results)
    signal_perf = analyze_signal_performance(results)
    confidence_cal = calculate_confidence_calibration(results)
    
    # Create performance summary
    performance = ModelPerformance(
        total_games=len(predictions),
        matched_games=len(results),
        spread_mae=spread_perf.get("mae", 0),
        spread_rmse=spread_perf.get("rmse", 0),
        spread_accuracy=spread_perf.get("ats_accuracy", 0),
        spread_edge_accuracy=spread_perf.get("edge_accuracy", 0),
        total_mae=total_perf.get("mae", 0),
        total_rmse=total_perf.get("rmse", 0),
        total_accuracy=total_perf.get("ou_accuracy", 0),
        confidence_calibration=confidence_cal,
        signal_performance=signal_perf
    )
    
    return performance, results

# =======================
# CLI
# =======================

def main():
    parser = argparse.ArgumentParser(description="Evaluate NFL Model Performance and Optimize Weights")
    parser.add_argument("--predictions", default="nfl_best_bets.json",
                        help="Path to model predictions JSON file")
    parser.add_argument("--scores", default="../json-data/nfl_scores.json",
                        help="Path to actual scores JSON file")
    parser.add_argument("--normalization", default="../json-links/team-normalization.json",
                        help="Path to team name normalization file")
    parser.add_argument("--model", default="nfl_model.py",
                        help="Path to model file to update")
    parser.add_argument("--output", default="nfl_evaluation_results.json",
                        help="Output file for evaluation results")
    parser.add_argument("--update-model", action="store_true",
                        help="Update model weights based on evaluation")
    parser.add_argument("--pretty", action="store_true",
                        help="Print detailed results to console")

    args = parser.parse_args()

    # Run evaluation
    performance, results = evaluate_model(
        args.predictions, 
        args.scores, 
        args.normalization,
        args.model
    )

    # Print results
    if args.pretty:
        print(f"\n{'='*60}")
        print(f"NFL MODEL EVALUATION RESULTS")
        print(f"{'='*60}")
        print(f"Total predictions: {performance.total_games}")
        print(f"Matched games: {performance.matched_games}")
        print(f"\nSPREAD PERFORMANCE:")
        print(f"  MAE: {performance.spread_mae:.2f}")
        print(f"  RMSE: {performance.spread_rmse:.2f}")
        print(f"  ATS Accuracy: {performance.spread_accuracy:.1%}")
        print(f"  Edge Accuracy: {performance.spread_edge_accuracy:.1%}")
        print(f"\nTOTAL PERFORMANCE:")
        print(f"  MAE: {performance.total_mae:.2f}")
        print(f"  RMSE: {performance.total_rmse:.2f}")
        print(f"  O/U Accuracy: {performance.total_accuracy:.1%}")
        
        if performance.signal_performance:
            print(f"\nSIGNAL PERFORMANCE:")
            for signal, perf in performance.signal_performance.items():
                print(f"  {signal}: correlation={perf['correlation']:.3f}, "
                      f"games={perf['games_count']}, avg_accuracy={perf['avg_accuracy']:.3f}")

    # Save results
    if args.output:
        output_data = {
            "performance": {
                "total_games": performance.total_games,
                "matched_games": performance.matched_games,
                "spread_mae": performance.spread_mae,
                "spread_rmse": performance.spread_rmse,
                "spread_accuracy": performance.spread_accuracy,
                "spread_edge_accuracy": performance.spread_edge_accuracy,
                "total_mae": performance.total_mae,
                "total_rmse": performance.total_rmse,
                "total_accuracy": performance.total_accuracy,
                "confidence_calibration": performance.confidence_calibration,
                "signal_performance": performance.signal_performance
            },
            "detailed_results": [
                {
                    "matchup": r.matchup,
                    "pred_margin": r.pred_margin,
                    "actual_margin": r.actual_margin,
                    "spread_error": r.spread_error,
                    "pred_total": r.pred_total,
                    "actual_total": r.actual_total,
                    "total_error": r.total_error,
                    "confidence": r.confidence
                } for r in results
            ]
        }
        
        with open(args.output, 'w') as f:
            json.dump(output_data, f, indent=2)
        print(f"\nEvaluation results saved to {args.output}")

    # Update model weights if requested
    if args.update_model and results:
        current_weights = extract_current_weights(args.model)
        if current_weights:
            optimized_weights = optimize_weights(results, current_weights)
            update_model_weights(args.model, optimized_weights)
            print(f"\nModel weights updated based on evaluation results")
        else:
            print(f"\nCould not extract current weights from model file")

if __name__ == "__main__":
    main()


