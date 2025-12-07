import React, { useState } from 'react';
import { FlightLeg } from '../types';
import { validateRotation } from '../services/optimizerEngine';
import { postRotationValidate } from '../services/api';
import InputCard from '../components/InputCard';
import { RotateCw, Plus, Trash2, CheckCircle2, XCircle, ArrowRight, Server } from 'lucide-react';

const RotationPage: React.FC = () => {
  const [legs, setLegs] = useState<FlightLeg[]>([
    { id: '1', flightNumber: 'TK101', origin: 'IST', destination: 'LHR', schedDep: '08:00', schedArr: '10:00', status: 'ON_TIME' },
    { id: '2', flightNumber: 'TK102', origin: 'LHR', destination: 'IST', schedDep: '11:30', schedArr: '15:30', status: 'ON_TIME' },
  ]);

  const [newLeg, setNewLeg] = useState<Partial<FlightLeg>>({
    origin: '', destination: '', schedDep: '', schedArr: '', flightNumber: ''
  });

  const [validationResult, setValidationResult] = useState<{isValid: boolean, conflicts: any[]} | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddLeg = () => {
    if (newLeg.origin && newLeg.destination && newLeg.schedDep && newLeg.schedArr) {
      setLegs([...legs, { ...newLeg, id: Math.random().toString(), status: 'ON_TIME' } as FlightLeg]);
      setValidationResult(null); // Reset validation
      setNewLeg({ origin: '', destination: '', schedDep: '', schedArr: '', flightNumber: '' });
    }
  };

  const handleRemoveLeg = (id: string) => {
    setLegs(legs.filter(l => l.id !== id));
    setValidationResult(null);
  };

  const runValidation = () => {
    const result = validateRotation(legs);
    setValidationResult(result);
  };

  const handleValidateAPI = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      const response = await postRotationValidate({ legs });
      setApiResponse(response);
      setValidationResult({
        isValid: response.isValid,
        conflicts: response.conflicts
      });
    } catch (error: any) {
      setApiResponse({ error: error.message || 'Failed to validate rotation' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Rotation Validator</h2>
        <p className="text-slate-500">Check schedule feasibility, minimum connection times, and station continuity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Legs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-2">
                 <h3 className="font-semibold text-slate-700">Flight Legs</h3>
                 <div className="flex gap-2">
                   <button onClick={runValidation} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                      <RotateCw size={16} />
                      Validate (Local)
                   </button>
                   <button onClick={handleValidateAPI} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                      <Server size={16} />
                      {isLoading ? 'Validating...' : 'Validate (API)'}
                   </button>
                 </div>
             </div>
             <div className="p-6 space-y-4">
                {legs.length === 0 && <p className="text-slate-400 text-center italic">No legs added.</p>}
                {legs.sort((a,b) => a.schedDep.localeCompare(b.schedDep)).map((leg, index) => (
                    <div key={leg.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white relative group">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-xs text-slate-400">Flight</span>
                                <span className="font-bold text-slate-800">{leg.flightNumber}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400">Route</span>
                                <span className="font-medium text-slate-700 flex items-center gap-1">
                                    {leg.origin} <ArrowRight size={12}/> {leg.destination}
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400">Time</span>
                                <span className="text-sm font-mono text-slate-600">{leg.schedDep} - {leg.schedArr}</span>
                            </div>
                        </div>
                        <button onClick={() => handleRemoveLeg(leg.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
             </div>
          </div>
          
          {/* Validation Result */}
          {validationResult && (
             <div className={`p-6 rounded-xl border ${validationResult.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-start gap-4">
                    {validationResult.isValid ? (
                        <CheckCircle2 className="text-emerald-600 w-6 h-6 shrink-0 mt-1" />
                    ) : (
                        <XCircle className="text-rose-600 w-6 h-6 shrink-0 mt-1" />
                    )}
                    <div>
                        <h4 className={`text-lg font-bold ${validationResult.isValid ? 'text-emerald-800' : 'text-rose-800'}`}>
                            {validationResult.isValid ? 'Rotation Feasible' : 'Conflicts Detected'}
                        </h4>
                        {!validationResult.isValid && (
                            <ul className="mt-2 space-y-2">
                                {validationResult.conflicts.map((c, i) => (
                                    <li key={i} className="text-sm text-rose-700 bg-white/50 px-3 py-2 rounded border border-rose-100">
                                        <span className="font-bold mr-2">[{c.severity}]</span>
                                        {c.reason}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {validationResult.isValid && <p className="text-emerald-700 mt-1">All legs respect MCT (45 min) and station continuity.</p>}
                    </div>
                </div>
             </div>
          )}
        </div>

        {/* Add Leg Form */}
        <InputCard title="Add Leg" className="h-fit">
            <div className="space-y-4">
                <input 
                    type="text" placeholder="Flight No (e.g. TK101)" 
                    className="w-full px-3 py-2 border rounded"
                    value={newLeg.flightNumber}
                    onChange={e => setNewLeg({...newLeg, flightNumber: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="text" placeholder="Origin" 
                        className="w-full px-3 py-2 border rounded uppercase"
                        value={newLeg.origin}
                        onChange={e => setNewLeg({...newLeg, origin: e.target.value.toUpperCase()})}
                    />
                     <input 
                        type="text" placeholder="Dest" 
                        className="w-full px-3 py-2 border rounded uppercase"
                        value={newLeg.destination}
                        onChange={e => setNewLeg({...newLeg, destination: e.target.value.toUpperCase()})}
                    />
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-slate-500">Dep</label>
                        <input 
                            type="time" 
                            className="w-full px-3 py-2 border rounded"
                            value={newLeg.schedDep}
                            onChange={e => setNewLeg({...newLeg, schedDep: e.target.value})}
                        />
                    </div>
                     <div>
                        <label className="text-xs text-slate-500">Arr</label>
                        <input 
                            type="time" 
                            className="w-full px-3 py-2 border rounded"
                            value={newLeg.schedArr}
                            onChange={e => setNewLeg({...newLeg, schedArr: e.target.value})}
                        />
                    </div>
                </div>
                <button onClick={handleAddLeg} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Leg
                </button>
            </div>
        </InputCard>
      </div>

      {/* API Response */}
      {apiResponse && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Server size={20} />
            Backend API Response
          </h3>
          <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-auto text-sm">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RotationPage;