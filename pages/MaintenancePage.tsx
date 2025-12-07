import React, { useState } from 'react';
import { Aircraft } from '../types';
import { calculateMaintenanceRisk } from '../services/optimizerEngine';
import { postFleetRisk, AircraftWithRisk } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { Wrench, Search, AlertTriangle, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const MOCK_FLEET: Aircraft[] = [
  { tailNumber: 'TC-JNA', type: 'B737-800', ageYears: 12, cycles: 14500, lastMaintenance: '2023-10-01', snagCount: 2 },
  { tailNumber: 'TC-JNB', type: 'B737-800', ageYears: 4, cycles: 4200, lastMaintenance: '2023-10-20', snagCount: 0 },
  { tailNumber: 'TC-JNC', type: 'B737-MAX', ageYears: 2, cycles: 1800, lastMaintenance: '2023-10-25', snagCount: 1 },
  { tailNumber: 'TC-JND', type: 'A321neo', ageYears: 15, cycles: 18900, lastMaintenance: '2023-09-15', snagCount: 5 },
  { tailNumber: 'TC-JNE', type: 'A320-200', ageYears: 8, cycles: 9500, lastMaintenance: '2023-10-10', snagCount: 3 },
];

const MaintenancePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzedFleet, setAnalyzedFleet] = useState<AircraftWithRisk[]>(
    MOCK_FLEET.map(ac => ({
      ...ac,
      riskScore: calculateMaintenanceRisk(ac)
    })).sort((a, b) => b.riskScore - a.riskScore)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateAPI = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Calculate risk for entire fleet using API
      const response = await postFleetRisk({ fleet: MOCK_FLEET });

      // Update fleet with API risk scores
      const updatedFleet = response.fleet.sort((a, b) => b.riskScore - a.riskScore);
      setAnalyzedFleet(updatedFleet);
    } catch (error: any) {
      setError(error.message || 'Failed to calculate fleet maintenance risk');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFleet = analyzedFleet.filter(ac =>
    ac.tailNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Maintenance Watchlist</h2>
          <p className="text-slate-500">Fleet health monitoring based on age, cycles, and open snags.</p>
        </div>
        <button
          onClick={handleCalculateAPI}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Server size={16} />
          {isLoading ? 'Calculating...' : 'Calculate (API)'}
        </button>
      </header>

      {/* Overview Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-64">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Fleet Risk Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analyzedFleet}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="tailNumber" tick={{ fontSize: 12 }} />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="riskScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tail number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Tail Number</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Age / Cycles</th>
              <th className="px-6 py-4">Open Snags</th>
              <th className="px-6 py-4">Last Check</th>
              <th className="px-6 py-4">Risk Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFleet.map((ac) => (
              <tr key={ac.tailNumber} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                  <Wrench size={16} className="text-slate-400" />
                  {ac.tailNumber}
                </td>
                <td className="px-6 py-4 text-slate-600">{ac.type}</td>
                <td className="px-6 py-4 text-slate-600">
                  <div>{ac.ageYears} yrs</div>
                  <div className="text-xs text-slate-400">{ac.cycles.toLocaleString()} cycles</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ac.snagCount > 2 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {ac.snagCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{ac.lastMaintenance}</td>
                <td className="px-6 py-4">
                  <RiskBadge score={ac.riskScore} size="sm" />
                  {ac.riskScore > 0.6 && (
                    <div className="flex items-center gap-1 text-xs text-rose-600 mt-1">
                      <AlertTriangle size={12} />
                      <span>Maint. due soon</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-800 mb-1">API Error</h4>
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;