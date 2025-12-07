import React, { useState } from 'react';
import { Aircraft, FlightLeg, SwapScenario } from '../types';
import { optimizeTailSwap } from '../services/optimizerEngine';
import { postTailSwapOptimize } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { ArrowLeftRight, Plane, CheckCircle, AlertTriangle, Server } from 'lucide-react';

// Mock Data
const AC_A: Aircraft = { tailNumber: 'TC-JNA', type: 'B737-800', ageYears: 12, cycles: 14500, lastMaintenance: '2023-10-01', snagCount: 3 };
const LEGS_A: FlightLeg[] = [
    { id: 'a1', flightNumber: 'TK101', origin: 'IST', destination: 'LHR', schedDep: '08:00', schedArr: '10:00', status: 'ON_TIME' },
    { id: 'a2', flightNumber: 'TK102', origin: 'LHR', destination: 'IST', schedDep: '11:00', schedArr: '15:00', status: 'ON_TIME' },
    { id: 'a3', flightNumber: 'TK103', origin: 'IST', destination: 'DXB', schedDep: '17:00', schedArr: '22:00', status: 'ON_TIME' }
];

const AC_B: Aircraft = { tailNumber: 'TC-JNB', type: 'B737-800', ageYears: 2, cycles: 1200, lastMaintenance: '2023-11-01', snagCount: 0 };
const LEGS_B: FlightLeg[] = [
    { id: 'b1', flightNumber: 'TK201', origin: 'IST', destination: 'ESB', schedDep: '09:00', schedArr: '10:00', status: 'ON_TIME' },
    { id: 'b2', flightNumber: 'TK202', origin: 'ESB', destination: 'IST', schedDep: '11:00', schedArr: '12:00', status: 'ON_TIME' }
];

const TailSwapPage: React.FC = () => {
  const [result, setResult] = useState<SwapScenario | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOptimize = () => {
    const res = optimizeTailSwap(AC_A, LEGS_A, AC_B, LEGS_B);
    setResult(res);
  };

  const handleOptimizeAPI = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      const response = await postTailSwapOptimize({
        aircraftA: AC_A,
        legsA: LEGS_A,
        aircraftB: AC_B,
        legsB: LEGS_B
      });
      setApiResponse(response);
      setResult(response);
    } catch (error: any) {
      setApiResponse({ error: error.message || 'Failed to optimize tail swap' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Tail Swap Optimizer</h2>
        <p className="text-slate-500">Analyze operational impact and maintenance risk reduction by swapping aircraft.</p>
      </header>

      {/* Comparison View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        
        {/* Swap Button (Floating in center for large screens) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-10 flex flex-col gap-2">
            <button 
                onClick={handleOptimize}
                className="bg-sky-600 hover:bg-sky-500 text-white p-4 rounded-full shadow-xl transition-transform active:scale-95 border-4 border-slate-50"
                title="Optimize (Local)"
            >
                <ArrowLeftRight size={24} />
            </button>
            <button 
                onClick={handleOptimizeAPI}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white p-4 rounded-full shadow-xl transition-transform active:scale-95 border-4 border-slate-50"
                title="Optimize (API)"
            >
                <Server size={24} />
            </button>
        </div>

        {/* Aircraft A */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Plane className="text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{AC_A.tailNumber}</h3>
                        <p className="text-xs text-slate-500">{AC_A.type} • {AC_A.snagCount} Snags</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xs text-slate-400 uppercase tracking-wider">Schedule Load</span>
                    <span className="font-mono text-lg font-bold text-slate-700">{LEGS_A.length} Legs</span>
                </div>
            </div>
            <div className="flex-1 space-y-3">
                <h4 className="text-sm font-medium text-slate-500">Current Rotation</h4>
                {LEGS_A.map(leg => (
                    <div key={leg.id} className="text-sm border-l-2 border-slate-200 pl-3 py-1">
                        <span className="font-bold text-slate-700">{leg.flightNumber}</span>
                        <span className="text-slate-400 mx-2">{leg.origin} → {leg.destination}</span>
                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{leg.schedDep}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Aircraft B */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Plane className="text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{AC_B.tailNumber}</h3>
                        <p className="text-xs text-slate-500">{AC_B.type} • {AC_B.snagCount} Snags</p>
                    </div>
                </div>
                 <div className="text-right">
                    <span className="block text-xs text-slate-400 uppercase tracking-wider">Schedule Load</span>
                    <span className="font-mono text-lg font-bold text-slate-700">{LEGS_B.length} Legs</span>
                </div>
            </div>
            <div className="flex-1 space-y-3">
                <h4 className="text-sm font-medium text-slate-500">Current Rotation</h4>
                 {LEGS_B.map(leg => (
                    <div key={leg.id} className="text-sm border-l-2 border-slate-200 pl-3 py-1">
                        <span className="font-bold text-slate-700">{leg.flightNumber}</span>
                        <span className="text-slate-400 mx-2">{leg.origin} → {leg.destination}</span>
                        <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{leg.schedDep}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <div className="block md:hidden space-y-2">
         <button 
            onClick={handleOptimize}
            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
            <ArrowLeftRight /> Analyze Swap (Local)
        </button>
         <button 
            onClick={handleOptimizeAPI}
            disabled={isLoading}
            className="w-full bg-emerald-600 disabled:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
            <Server /> {isLoading ? 'Analyzing...' : 'Analyze Swap (API)'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            {result.feasible ? <CheckCircle className="text-emerald-400"/> : <AlertTriangle className="text-rose-400"/>}
                            Optimization Result
                        </h3>
                        <p className={`text-lg font-medium ${result.improvement > 0 ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {result.recommendation}
                        </p>
                        
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-slate-800 p-4 rounded-lg">
                                <span className="text-xs text-slate-400 block mb-1">Total Risk Improvement</span>
                                <span className="text-2xl font-bold text-emerald-400">
                                    {result.improvement > 0 ? `+${result.improvement.toFixed(1)}%` : '0%'}
                                </span>
                            </div>
                             <div className="bg-slate-800 p-4 rounded-lg">
                                <span className="text-xs text-slate-400 block mb-1">Swap Feasibility</span>
                                <span className={`text-xl font-bold ${result.feasible ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {result.feasible ? 'FEASIBLE' : 'CONFLICT'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">Projected Risk Scores</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>{AC_A.tailNumber} (On New Route)</span>
                                <RiskBadge score={result.riskScoreA} size="sm" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span>{AC_B.tailNumber} (On New Route)</span>
                                <RiskBadge score={result.riskScoreB} size="sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* API Response */}
      {apiResponse && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Server size={20} />
            Backend API Response
          </h3>
          <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto text-sm max-h-96">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TailSwapPage;