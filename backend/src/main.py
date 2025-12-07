"""
FastAPI Backend for Senior Tail Optimizer
Provides REST API endpoints for delay risk, maintenance risk, rotation validation, and tail swap optimization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Literal, Optional

from models.delay_risk_model import calculate_delay_risk
from models.maintenance_model import calculate_maintenance_risk, calculate_fleet_risks
from models.rotation_engine import validate_rotation
from models.tail_swap_optimizer import optimize_tail_swap

app = FastAPI(
    title="Senior Tail Optimizer API",
    description="API for aircraft delay risk prediction, maintenance risk assessment, rotation validation, and tail swap optimization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Models
class DelayInput(BaseModel):
    schedDepTime: str
    prevDelayMinutes: int
    aircraftType: str
    weatherCondition: Literal["CLEAR", "RAIN", "SNOW", "STORM", "FOG"]


class DelayRiskResponse(BaseModel):
    riskScore: float
    riskLevel: Literal["low", "medium", "high"]


class Aircraft(BaseModel):
    tailNumber: str
    type: str
    ageYears: int
    cycles: int
    lastMaintenance: str
    snagCount: int


class MaintenanceRiskRequest(BaseModel):
    ageYears: int
    cycles: int
    lastMaintenance: str
    snagCount: int


class MaintenanceRiskResponse(BaseModel):
    riskScore: float


class FleetRiskRequest(BaseModel):
    fleet: List[Aircraft]


class AircraftWithRisk(Aircraft):
    riskScore: float


class FleetRiskResponse(BaseModel):
    fleet: List[AircraftWithRisk]


class FlightLeg(BaseModel):
    id: str
    flightNumber: str
    origin: str
    destination: str
    schedDep: str
    schedArr: str
    status: Literal["ON_TIME", "DELAYED", "CANCELLED"]


class RotationValidationRequest(BaseModel):
    legs: List[FlightLeg]


class RotationConflict(BaseModel):
    legId: str
    reason: str
    severity: Literal["WARNING", "ERROR"]


class RotationValidationResponse(BaseModel):
    isValid: bool
    conflicts: List[RotationConflict]


class TailSwapRequest(BaseModel):
    aircraftA: Aircraft
    legsA: List[FlightLeg]
    aircraftB: Aircraft
    legsB: List[FlightLeg]


class SwapScenario(BaseModel):
    aircraftA: Aircraft
    aircraftB: Aircraft
    riskScoreA: float
    riskScoreB: float
    improvement: float
    feasible: bool
    recommendation: str


class DashboardMetricsResponse(BaseModel):
    fleetAvailability: float
    onTimePerformance: float
    openSnags: int
    criticalSnags: int
    swapsToday: int


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Senior Tail Optimizer API",
        "version": "1.0.0",
        "endpoints": {
            "/api/delay-risk": "POST - Calculate delay risk",
            "/api/maintenance-risk": "POST - Calculate maintenance risk",
            "/api/fleet-risk": "POST - Calculate risks for entire fleet",
            "/api/rotation/validate": "POST - Validate flight rotation",
            "/api/tail-swap/optimize": "POST - Optimize tail swap",
            "/api/dashboard/metrics": "GET - Get dashboard metrics"
        }
    }


@app.post("/api/delay-risk", response_model=DelayRiskResponse)
async def calculate_delay_risk_endpoint(input_data: DelayInput):
    """
    Calculate delay risk score and level based on flight parameters using XGBoost model.
    """
    try:
        logger.info(
            f"Delay risk prediction request - Time: {input_data.schedDepTime}, "
            f"Prev Delay: {input_data.prevDelayMinutes}min, "
            f"Aircraft: {input_data.aircraftType}, Weather: {input_data.weatherCondition}"
        )
        
        risk_score, risk_level = calculate_delay_risk(
            sched_dep_time=input_data.schedDepTime,
            prev_delay_minutes=input_data.prevDelayMinutes,
            aircraft_type=input_data.aircraftType,
            weather_condition=input_data.weatherCondition
        )
        
        logger.info(f"Prediction result - Risk Score: {risk_score:.4f}, Risk Level: {risk_level}")
        
        return DelayRiskResponse(riskScore=risk_score, riskLevel=risk_level)
    except FileNotFoundError as e:
        logger.error(f"Model or data file not found: {e}")
        raise HTTPException(status_code=500, detail="Model not available. Please check backend configuration.")
    except Exception as e:
        logger.error(f"Error in delay risk calculation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/maintenance-risk", response_model=MaintenanceRiskResponse)
async def calculate_maintenance_risk_endpoint(request: MaintenanceRiskRequest):
    """
    Calculate maintenance risk score for a single aircraft.
    """
    risk_score = calculate_maintenance_risk(
        age_years=request.ageYears,
        cycles=request.cycles,
        last_maintenance=request.lastMaintenance,
        snag_count=request.snagCount
    )
    return MaintenanceRiskResponse(riskScore=risk_score)


@app.post("/api/fleet-risk", response_model=FleetRiskResponse)
async def calculate_fleet_risk_endpoint(request: FleetRiskRequest):
    """
    Calculate maintenance risk scores for an entire fleet.
    """
    fleet_dicts = [ac.model_dump() for ac in request.fleet]
    results = calculate_fleet_risks(fleet_dicts)
    
    fleet_with_risks = [AircraftWithRisk(**ac) for ac in results]
    return FleetRiskResponse(fleet=fleet_with_risks)


@app.post("/api/rotation/validate", response_model=RotationValidationResponse)
async def validate_rotation_endpoint(request: RotationValidationRequest):
    """
    Validate a flight rotation for feasibility, MCT, and station continuity.
    """
    legs_dicts = [leg.model_dump() for leg in request.legs]
    result = validate_rotation(legs_dicts)
    
    conflicts = [RotationConflict(**conflict) for conflict in result["conflicts"]]
    return RotationValidationResponse(
        isValid=result["isValid"],
        conflicts=conflicts
    )


@app.post("/api/tail-swap/optimize", response_model=SwapScenario)
async def optimize_tail_swap_endpoint(request: TailSwapRequest):
    """
    Optimize tail swap between two aircraft and their assigned rotations.
    """
    aircraft_a_dict = request.aircraftA.model_dump()
    aircraft_b_dict = request.aircraftB.model_dump()
    legs_a_dicts = [leg.model_dump() for leg in request.legsA]
    legs_b_dicts = [leg.model_dump() for leg in request.legsB]
    
    result = optimize_tail_swap(
        aircraft_a=aircraft_a_dict,
        legs_a=legs_a_dicts,
        aircraft_b=aircraft_b_dict,
        legs_b=legs_b_dicts
    )
    
    return SwapScenario(
        aircraftA=Aircraft(**result["aircraftA"]),
        aircraftB=Aircraft(**result["aircraftB"]),
        riskScoreA=result["riskScoreA"],
        riskScoreB=result["riskScoreB"],
        improvement=result["improvement"],
        feasible=result["feasible"],
        recommendation=result["recommendation"]
    )


@app.get("/api/dashboard/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics():
    """
    Get dashboard metrics including fleet availability, on-time performance, snags, and swaps.
    """
    # In a real application, these would be calculated from actual data
    # For now, returning mock data that matches the frontend expectations
    return DashboardMetricsResponse(
        fleetAvailability=0.94,
        onTimePerformance=0.875,
        openSnags=12,
        criticalSnags=3,
        swapsToday=4
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

