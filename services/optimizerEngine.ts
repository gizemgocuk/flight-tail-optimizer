import { Aircraft, FlightLeg, RotationConflict, DelayInput, SwapScenario } from '../types';

// --- Constants ---
const MCT_MINUTES = 45; // Minimum Connection Time

// --- Helpers ---
const parseTime = (timeStr: string): number => {
  const [hh, mm] = timeStr.split(':').map(Number);
  return hh * 60 + mm;
};

// --- Logic Engines ---

/**
 * Simulates XGBoost Delay Risk Model
 * Input: scheduled_dep_time, prev_delay, aircraft_type, weather
 * Output: 0–1 risk score
 */
export const calculateDelayRisk = (input: DelayInput): number => {
  let score = 0.1; // Base risk

  // 1. Time of day impact (later in day = higher risk)
  const minutes = parseTime(input.schedDepTime);
  if (minutes > 1000) score += 0.2; 
  else if (minutes > 720) score += 0.1;

  // 2. Previous Delay (Cascading effect)
  if (input.prevDelayMinutes > 60) score += 0.4;
  else if (input.prevDelayMinutes > 15) score += 0.2;

  // 3. Weather
  switch (input.weatherCondition) {
    case 'STORM': score += 0.5; break;
    case 'SNOW': score += 0.4; break;
    case 'FOG': score += 0.3; break;
    case 'RAIN': score += 0.1; break;
    default: break;
  }

  // 4. Aircraft Type (Simulation)
  if (input.aircraftType === 'B737-MAX' || input.aircraftType === 'A321neo') {
    score -= 0.05; // Newer planes slightly more reliable
  }

  return Math.min(Math.max(score, 0), 0.99);
};

/**
 * Simulates Maintenance Risk Predictor
 * Aircraft age, cycles, last maintenance, snag count → risk
 */
export const calculateMaintenanceRisk = (ac: Aircraft): number => {
  let risk = 0.05;

  risk += ac.ageYears * 0.015;
  risk += (ac.cycles / 10000) * 0.1;
  risk += ac.snagCount * 0.08;
  
  // Last maintenance factor
  const daysSinceMaint = (new Date().getTime() - new Date(ac.lastMaintenance).getTime()) / (1000 * 3600 * 24);
  if (daysSinceMaint > 30) risk += 0.15;

  return Math.min(Math.max(risk, 0), 1);
};

/**
 * Rotation Engine
 * Checks feasibility, MCT, overlaps
 */
export const validateRotation = (legs: FlightLeg[]): { isValid: boolean; conflicts: RotationConflict[] } => {
  const conflicts: RotationConflict[] = [];
  const sortedLegs = [...legs].sort((a, b) => parseTime(a.schedDep) - parseTime(b.schedDep));

  for (let i = 0; i < sortedLegs.length - 1; i++) {
    const current = sortedLegs[i];
    const next = sortedLegs[i + 1];

    const arrTime = parseTime(current.schedArr);
    const nextDepTime = parseTime(next.schedDep);

    // Check 1: Geographic continuity
    if (current.destination !== next.origin) {
      conflicts.push({
        legId: next.id,
        reason: `Location mismatch: Arr ${current.destination} != Dep ${next.origin}`,
        severity: 'ERROR'
      });
    }

    // Check 2: Overlap or Negative Turnaround
    if (arrTime > nextDepTime) {
      conflicts.push({
        legId: next.id,
        reason: `Schedule Overlap: Arrives ${current.schedArr}, Departs ${next.schedDep}`,
        severity: 'ERROR'
      });
      continue;
    }

    // Check 3: Minimum Connection Time
    if (nextDepTime - arrTime < MCT_MINUTES) {
      conflicts.push({
        legId: next.id,
        reason: `MCT Violation: Only ${nextDepTime - arrTime} min available (Req: ${MCT_MINUTES})`,
        severity: 'WARNING'
      });
    }
  }

  return { isValid: conflicts.length === 0, conflicts };
};

/**
 * Tail Swap Optimizer
 * Compares current assignments vs swapped assignments
 */
export const optimizeTailSwap = (
  ac1: Aircraft, 
  legs1: FlightLeg[], 
  ac2: Aircraft, 
  legs2: FlightLeg[]
): SwapScenario => {
  // 1. Calculate Baseline Risk
  const baseRisk1 = calculateMaintenanceRisk(ac1);
  const baseRisk2 = calculateMaintenanceRisk(ac2);
  const totalBaseRisk = baseRisk1 + baseRisk2;

  // 2. Validate Rotation Feasibility for Swapped Tails
  // (In a real app, this would check if the aircraft type matches the gate/route capacity)
  const feasibility1 = validateRotation(legs2); // Can AC1 fly AC2's legs?
  const feasibility2 = validateRotation(legs1); // Can AC2 fly AC1's legs?

  const feasible = feasibility1.isValid && feasibility2.isValid;

  // 3. Calculate New Risk (Simulated logic: swapping a high snag plane to a lighter schedule reduces risk)
  // Assume legs1 is a "Heavy" schedule and legs2 is "Light"
  const legs1Load = legs1.length;
  const legs2Load = legs2.length;

  let newRisk1 = baseRisk1;
  let newRisk2 = baseRisk2;

  // Heuristic: High maintenance risk plane on heavy schedule is bad.
  // If we move high risk plane to lighter schedule, risk drops.
  if (baseRisk1 > baseRisk2 && legs1Load > legs2Load) {
    // Current: Bad plane on hard route.
    // Swap: Bad plane on easy route (legs2).
    newRisk1 = baseRisk1 * 0.8; // Improvement
    newRisk2 = baseRisk2 * 1.1; // Slight increase for good plane on hard route
  } else if (baseRisk2 > baseRisk1 && legs2Load > legs1Load) {
     // Current: Bad plane (ac2) on hard route (legs2).
     // Swap: Bad plane on easy route (legs1).
     newRisk2 = baseRisk2 * 0.8;
     newRisk1 = baseRisk1 * 1.1;
  }

  const totalNewRisk = newRisk1 + newRisk2;
  const improvement = (totalBaseRisk - totalNewRisk) * 100; // Percentageish score

  let recommendation = "Keep current assignment.";
  if (!feasible) {
    recommendation = "Swap not feasible due to rotation conflicts.";
  } else if (improvement > 5) {
    recommendation = "STRONG RECOMMENDATION: Swap tails to mitigate maintenance risk on tight rotation.";
  } else if (improvement > 0) {
    recommendation = "Marginal benefit. Swap at discretion.";
  }

  return {
    aircraftA: ac1,
    aircraftB: ac2,
    riskScoreA: newRisk1,
    riskScoreB: newRisk2,
    improvement,
    feasible,
    recommendation
  };
};