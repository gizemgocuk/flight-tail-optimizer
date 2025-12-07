import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DelayRiskPage from './pages/DelayRiskPage';
import MaintenancePage from './pages/MaintenancePage';
import RotationPage from './pages/RotationPage';
import TailSwapPage from './pages/TailSwapPage';
import { getDashboardMetrics, DashboardMetricsResponse } from './services/api';
import { Loader2, AlertCircle } from 'lucide-react';

// Dashboard Home Component with Backend Integration
const DashboardHome = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fleet Availability */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Fleet Availability</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span className="text-rose-500 text-sm">Error</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {metrics ? `${Math.round(metrics.fleetAvailability * 100)}%` : '--'}
              </p>
              <p className="text-emerald-600 text-xs mt-1 flex items-center">▲ 2% vs last week</p>
            </>
          )}
        </div>

        {/* On-Time Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">On-Time Performance</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span className="text-rose-500 text-sm">Error</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {metrics ? `${Math.round(metrics.onTimePerformance * 100)}%` : '--'}
              </p>
              <p className="text-rose-600 text-xs mt-1 flex items-center">▼ 1.2% vs target</p>
            </>
          )}
        </div>

        {/* Open Snags */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Open Snags</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span className="text-rose-500 text-sm">Error</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {metrics ? metrics.openSnags : '--'}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {metrics ? `${metrics.criticalSnags} Critical` : '--'}
              </p>
            </>
          )}
        </div>

        {/* Swaps Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 text-sm font-medium">Swaps Today</h3>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span className="text-rose-500 text-sm">Error</span>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {metrics ? metrics.swapsToday : '--'}
              </p>
              <p className="text-emerald-600 text-xs mt-1">Optimized by AI</p>
            </>
          )}
        </div>
      </div>

      {/* Error Badge */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-rose-800">Backend Connection Error</h4>
            <p className="text-sm text-rose-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Welcome to Senior Tail Optimizer</h2>
          <p className="text-indigo-200 max-w-2xl">
            Your intelligent decision support system for flight operations.
            Use the sidebar to access delay prediction, maintenance tracking, rotation validation, and tail swap optimization engines.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardHome />;
      case 'delay': return <DelayRiskPage />;
      case 'maintenance': return <MaintenancePage />;
      case 'rotation': return <RotationPage />;
      case 'swap': return <TailSwapPage />;
      default: return <DashboardHome />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;