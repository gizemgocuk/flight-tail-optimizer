"""
Tail Swap Optimizer
Analyzes operational impact and maintenance risk reduction by swapping aircraft assignments.
"""

from typing import List, Dict, Any
from .maintenance_model import calculate_maintenance_risk
from .rotation_engine import validate_rotation


def optimize_tail_swap(
    aircraft_a: Dict[str, Any],
    legs_a: List[Dict[str, Any]],
    aircraft_b: Dict[str, Any],
    legs_b: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Optimize tail swap between two aircraft.
    
    Args:
        aircraft_a: Aircraft A dictionary with keys:
            - tailNumber
            - type
            - ageYears
            - cycles
            - lastMaintenance
            - snagCount
        legs_a: List of flight legs for aircraft A
        aircraft_b: Aircraft B dictionary (same structure as aircraft_a)
        legs_b: List of flight legs for aircraft B
        
    Returns:
        Dictionary with:
            - aircraftA: Original aircraft A data
            - aircraftB: Original aircraft B data
            - riskScoreA: New risk score for aircraft A on new route
            - riskScoreB: New risk score for aircraft B on new route
            - improvement: Risk improvement percentage
            - feasible: Whether swap is feasible
            - recommendation: Recommendation string
    """
    # 1. Calculate Baseline Risk
    base_risk_a = calculate_maintenance_risk(
        age_years=aircraft_a.get("ageYears", 0),
        cycles=aircraft_a.get("cycles", 0),
        last_maintenance=aircraft_a.get("lastMaintenance", ""),
        snag_count=aircraft_a.get("snagCount", 0)
    )
    
    base_risk_b = calculate_maintenance_risk(
        age_years=aircraft_b.get("ageYears", 0),
        cycles=aircraft_b.get("cycles", 0),
        last_maintenance=aircraft_b.get("lastMaintenance", ""),
        snag_count=aircraft_b.get("snagCount", 0)
    )
    
    total_base_risk = base_risk_a + base_risk_b
    
    # 2. Validate Rotation Feasibility for Swapped Tails
    feasibility_a = validate_rotation(legs_b)  # Can AC1 fly AC2's legs?
    feasibility_b = validate_rotation(legs_a)  # Can AC2 fly AC1's legs?
    
    feasible = feasibility_a["isValid"] and feasibility_b["isValid"]
    
    # 3. Calculate New Risk
    # Heuristic: High maintenance risk plane on heavy schedule is bad.
    # If we move high risk plane to lighter schedule, risk drops.
    legs_a_load = len(legs_a)
    legs_b_load = len(legs_b)
    
    new_risk_a = base_risk_a
    new_risk_b = base_risk_b
    
    if base_risk_a > base_risk_b and legs_a_load > legs_b_load:
        # Current: Bad plane on hard route.
        # Swap: Bad plane on easy route (legs_b).
        new_risk_a = base_risk_a * 0.8  # Improvement
        new_risk_b = base_risk_b * 1.1  # Slight increase for good plane on hard route
    elif base_risk_b > base_risk_a and legs_b_load > legs_a_load:
        # Current: Bad plane (ac2) on hard route (legs_b).
        # Swap: Bad plane on easy route (legs_a).
        new_risk_b = base_risk_b * 0.8
        new_risk_a = base_risk_a * 1.1
    
    total_new_risk = new_risk_a + new_risk_b
    improvement = (total_base_risk - total_new_risk) * 100  # Percentage-like score
    
    # 4. Generate Recommendation
    recommendation = "Keep current assignment."
    if not feasible:
        recommendation = "Swap not feasible due to rotation conflicts."
    elif improvement > 5:
        recommendation = "STRONG RECOMMENDATION: Swap tails to mitigate maintenance risk on tight rotation."
    elif improvement > 0:
        recommendation = "Marginal benefit. Swap at discretion."
    
    return {
        "aircraftA": aircraft_a,
        "aircraftB": aircraft_b,
        "riskScoreA": new_risk_a,
        "riskScoreB": new_risk_b,
        "improvement": improvement,
        "feasible": feasible,
        "recommendation": recommendation
    }
