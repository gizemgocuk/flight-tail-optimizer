"""
Rotation Engine
Validates flight rotation feasibility, minimum connection times, and station continuity.
"""

from typing import List, Dict, Any, Literal


MCT_MINUTES = 45  # Minimum Connection Time


def parse_time(time_str: str) -> int:
    """Parse time string (HH:mm) to minutes since midnight."""
    try:
        parts = time_str.split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError):
        return 0


def validate_rotation(legs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validate a flight rotation for feasibility.
    
    Args:
        legs: List of flight leg dictionaries with keys:
            - id
            - flightNumber
            - origin
            - destination
            - schedDep (HH:mm format)
            - schedArr (HH:mm format)
            - status
            
    Returns:
        Dictionary with:
            - isValid: bool
            - conflicts: List of conflict dictionaries with:
                - legId: str
                - reason: str
                - severity: 'WARNING' | 'ERROR'
    """
    conflicts = []
    
    if not legs:
        return {"isValid": True, "conflicts": []}
    
    # Sort legs by scheduled departure time
    sorted_legs = sorted(legs, key=lambda x: parse_time(x.get("schedDep", "00:00")))
    
    for i in range(len(sorted_legs) - 1):
        current = sorted_legs[i]
        next_leg = sorted_legs[i + 1]
        
        current_dest = current.get("destination", "")
        next_origin = next_leg.get("origin", "")
        current_arr = current.get("schedArr", "00:00")
        next_dep = next_leg.get("schedDep", "00:00")
        
        arr_time = parse_time(current_arr)
        next_dep_time = parse_time(next_dep)
        
        # Check 1: Geographic continuity
        if current_dest != next_origin:
            conflicts.append({
                "legId": next_leg.get("id", ""),
                "reason": f"Location mismatch: Arr {current_dest} != Dep {next_origin}",
                "severity": "ERROR"
            })
        
        # Check 2: Overlap or Negative Turnaround
        if arr_time > next_dep_time:
            conflicts.append({
                "legId": next_leg.get("id", ""),
                "reason": f"Schedule Overlap: Arrives {current_arr}, Departs {next_dep}",
                "severity": "ERROR"
            })
            continue
        
        # Check 3: Minimum Connection Time
        turnaround_time = next_dep_time - arr_time
        if turnaround_time < MCT_MINUTES:
            conflicts.append({
                "legId": next_leg.get("id", ""),
                "reason": f"MCT Violation: Only {turnaround_time} min available (Req: {MCT_MINUTES})",
                "severity": "WARNING"
            })
    
    return {
        "isValid": len(conflicts) == 0,
        "conflicts": conflicts
    }

