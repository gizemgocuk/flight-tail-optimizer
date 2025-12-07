import axios from 'axios';
import { DelayInput, Aircraft, FlightLeg, SwapScenario, RotationConflict } from '../types';

// Create Axios client with base URL
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Response Types
interface DelayRiskResponse {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface MaintenanceRiskResponse {
  riskScore: number;
}

interface RotationValidationResponse {
  isValid: boolean;
  conflicts: RotationConflict[];
}

export interface AircraftWithRisk extends Aircraft {
  riskScore: number;
}

export interface FleetRiskResponse {
  fleet: AircraftWithRisk[];
}

export interface DashboardMetricsResponse {
  fleetAvailability: number;
  onTimePerformance: number;
  openSnags: number;
  criticalSnags: number;
  swapsToday: number;
}

// API Functions

export const postDelayRisk = async (body: DelayInput): Promise<DelayRiskResponse> => {
  try {
    console.log('[API] Making POST request to /api/delay-risk with body:', body);
    const response = await apiClient.post<DelayRiskResponse>('/api/delay-risk', body);
    console.log('[API] Response received:', response.data);

    // Validate response structure
    if (!response.data || typeof response.data.riskScore !== 'number') {
      console.error('[API] Invalid response structure:', response.data);
      throw new Error('Invalid response from API: riskScore is missing or not a number');
    }

    return response.data;
  } catch (error: any) {
    console.error('[API] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      request: error.request
    });

    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Backend server is not responding. Please make sure the backend is running on http://localhost:8000');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

export const postMaintenanceRisk = async (body: {
  ageYears: number;
  cycles: number;
  lastMaintenance: string;
  snagCount: number;
}): Promise<MaintenanceRiskResponse> => {
  try {
    const response = await apiClient.post<MaintenanceRiskResponse>('/api/maintenance-risk', body);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Backend server is not responding. Please make sure the backend is running on http://localhost:8000');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

export const postFleetRisk = async (body: {
  fleet: Aircraft[];
}): Promise<FleetRiskResponse> => {
  try {
    const response = await apiClient.post<FleetRiskResponse>('/api/fleet-risk', body);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Backend server is not responding. Please make sure the backend is running on http://localhost:8000');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

export const postRotationValidate = async (body: {
  legs: FlightLeg[];
}): Promise<RotationValidationResponse> => {
  const response = await apiClient.post<RotationValidationResponse>('/api/rotation/validate', body);
  return response.data;
};

export const postTailSwapOptimize = async (body: {
  aircraftA: Aircraft;
  legsA: FlightLeg[];
  aircraftB: Aircraft;
  legsB: FlightLeg[];
}): Promise<SwapScenario> => {
  const response = await apiClient.post<SwapScenario>('/api/tail-swap/optimize', body);
  return response.data;
};

export const getDashboardMetrics = async (): Promise<DashboardMetricsResponse> => {
  try {
    const response = await apiClient.get<DashboardMetricsResponse>('/api/dashboard/metrics');
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Backend server is not responding. Please make sure the backend is running on http://localhost:8000');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

