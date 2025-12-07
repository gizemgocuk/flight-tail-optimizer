"""
Maintenance Risk Prediction Model
Calculates maintenance risk based on aircraft age, cycles, last maintenance, and snag count.
"""

from datetime import datetime
from typing import Dict, Any


def calculate_maintenance_risk(
    age_years: int,
    cycles: int,
    last_maintenance: str,
    snag_count: int
) -> float:
    """
    Calculate maintenance risk score (0-1) based on aircraft parameters.
    
    Args:
        age_years: Aircraft age in years
        cycles: Number of flight cycles
        last_maintenance: Last maintenance date in ISO format (YYYY-MM-DD)
        snag_count: Number of open snags
        
    Returns:
        Risk score between 0 and 1
    """
    risk = 0.05  # Base risk
    
    # Age factor
    risk += age_years * 0.015
    
    # Cycles factor
    risk += (cycles / 10000) * 0.1
    
    # Snag count factor
    risk += snag_count * 0.08
    
    # Last maintenance factor
    try:
        maint_date = datetime.fromisoformat(last_maintenance)
        days_since_maint = (datetime.now() - maint_date).days
        
        if days_since_maint > 30:
            risk += 0.15
    except (ValueError, TypeError):
        pass  # Invalid date format, skip maintenance factor
    
    # Clamp between 0 and 1
    return min(max(risk, 0.0), 1.0)


def calculate_fleet_risks(fleet: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
    """
    Calculate maintenance risks for a fleet of aircraft.
    
    Args:
        fleet: List of aircraft dictionaries with keys:
            - tailNumber
            - type
            - ageYears
            - cycles
            - lastMaintenance
            - snagCount
            
    Returns:
        List of aircraft dictionaries with added 'riskScore' field
    """
    results = []
    for aircraft in fleet:
        risk_score = calculate_maintenance_risk(
            age_years=aircraft.get("ageYears", 0),
            cycles=aircraft.get("cycles", 0),
            last_maintenance=aircraft.get("lastMaintenance", ""),
            snag_count=aircraft.get("snagCount", 0)
        )
        
        result = aircraft.copy()
        result["riskScore"] = risk_score
        results.append(result)
    
    return results

