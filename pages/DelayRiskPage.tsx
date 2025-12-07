import React, { useState } from 'react';
import InputCard from '../components/InputCard';
import RiskBadge from '../components/RiskBadge';
import { DelayInput } from '../types';
import { postDelayRisk } from '../services/api';
import { CloudRain, Clock, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DelayRiskPage: React.FC = () => {
  const [formData, setFormData] = useState<DelayInput>({
    schedDepTime: '08:00',
    prevDelayMinutes: 0,
    aircraftType: 'B737-800',
    weatherCondition: 'CLEAR'
  });

  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate risk level from risk score
  const calculateRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score < 0.25) return 'low';
    if (score <= 0.6) return 'medium';
    return 'high';
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setRiskScore(null);
    setRiskLevel(null);
    try {
      console.log('Sending request to API with data:', formData);
      const response = await postDelayRisk(formData);
      console.log('API Response received:', response);

      // Validate response
      if (!response || typeof response.riskScore !== 'number') {
        throw new Error('Invalid response from API. Expected riskScore as number.');
      }

      // Use backend riskScore and riskLevel (or calculate if not provided)
      const score = response.riskScore;
      const level = response.riskLevel || calculateRiskLevel(score);
      console.log('Setting risk score:', score, 'risk level:', level);
      setRiskScore(score);
      setRiskLevel(level);
    } catch (error: any) {
      console.error('Delay risk API error:', error);
      const errorMessage = error.message || 'Failed to calculate delay risk. Please make sure the backend is running on http://localhost:8000';
      setError(errorMessage);
      setRiskScore(null);
      setRiskLevel(null);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = riskScore !== null ? [
    { name: 'Risk', value: riskScore * 100 },
    { name: 'Safe', value: 100 - (riskScore * 100) },
  ] : [];

  const COLORS = ['#f43f5e', '#10b981'];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Delay Risk Prediction</h2>
        <p className="text-slate-500">XGBoost-powered probability engine for schedule adherence.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputCard title="Flight Parameters" description="Enter flight details to assess delay probability.">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Departure</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="time"
                  value={formData.schedDepTime}
                  onChange={(e) => setFormData({ ...formData, schedDepTime: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Inbound Delay (minutes)</label>
              <input
                type="number"
                value={formData.prevDelayMinutes}
                onChange={(e) => setFormData({ ...formData, prevDelayMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Aircraft Type</label>
                <select
                  value={formData.aircraftType}
                  onChange={(e) => setFormData({ ...formData, aircraftType: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="B737-800">B737-800</option>
                  <option value="B737-MAX">B737-MAX</option>
                  <option value="A320-200">A320-200</option>
                  <option value="A321neo">A321neo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weather</label>
                <select
                  value={formData.weatherCondition}
                  onChange={(e) => setFormData({ ...formData, weatherCondition: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="CLEAR">Clear</option>
                  <option value="RAIN">Rain</option>
                  <option value="SNOW">Snow</option>
                  <option value="FOG">Fog</option>
                  <option value="STORM">Storm</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="w-full mt-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CloudRain size={18} />
              {isLoading ? 'Calculating...' : 'Calculate Risk'}
            </button>
          </div>
        </InputCard>

        <InputCard title="Risk Analysis" className="min-h-[300px] flex flex-col items-center justify-center">
          {riskScore !== null ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center -mt-10">
                <h3 className="text-4xl font-bold text-slate-800">{Math.round(riskScore * 100)}%</h3>
                <p className="text-slate-500 mb-2">Probability of Delay {'>'} 15min</p>
                {riskLevel && (
                  <p className="text-sm font-medium mb-4 text-slate-600">
                    Risk Level: <span className={`font-bold ${riskLevel === 'low' ? 'text-emerald-600' :
                      riskLevel === 'medium' ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>{riskLevel.toUpperCase()}</span>
                  </p>
                )}
                <RiskBadge score={riskScore} size="lg" />
              </div>

              {riskLevel === 'high' && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-rose-800">High Risk Detected</h4>
                    <p className="text-sm text-rose-600">Suggest reviewing rotational buffer or standby crew availability.</p>
                  </div>
                </div>
              )}
              {riskLevel === 'medium' && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-semibold text-amber-800">Medium Risk</h4>
                    <p className="text-sm text-amber-600">Monitor flight status and prepare contingency plans.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <CloudRain size={48} className="mx-auto mb-3 opacity-20" />
              <p>Enter parameters to run the model.</p>
            </div>
          )}
        </InputCard>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-800 mb-1">API Connection Error</h4>
            <p className="text-sm text-rose-600">{error}</p>
            <p className="text-xs text-rose-500 mt-2">
              Make sure the backend server is running: <code className="bg-rose-100 px-1 rounded">python backend/src/main.py</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelayRiskPage;