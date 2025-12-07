export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Aircraft {
  tailNumber: string;
  type: string;
  ageYears: number;
  cycles: number;
  lastMaintenance: string; // ISO date
  snagCount: number;
}

export interface FlightLeg {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  schedDep: string; // HH:mm
  schedArr: string; // HH:mm
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED';
}

export interface RotationConflict {
  legId: string;
  reason: string;
  severity: 'WARNING' | 'ERROR';
}

export interface SwapScenario {
  aircraftA: Aircraft;
  aircraftB: Aircraft;
  riskScoreA: number;
  riskScoreB: number;
  improvement: number;
  feasible: boolean;
  recommendation: string;
}

export interface DelayInput {
  schedDepTime: string;
  prevDelayMinutes: number;
  aircraftType: string;
  weatherCondition: 'CLEAR' | 'RAIN' | 'SNOW' | 'STORM' | 'FOG';
}
