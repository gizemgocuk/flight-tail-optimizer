import React from 'react';

interface RiskBadgeProps {
  score: number; // 0 to 1
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ score, label, size = 'md' }) => {
  // Risk level thresholds: <0.25 = LOW, 0.25-0.6 = MEDIUM, >0.6 = HIGH
  let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  let riskLabel = 'LOW';

  if (score > 0.6) {
    colorClass = 'bg-rose-100 text-rose-700 border-rose-200';
    riskLabel = 'HIGH';
  } else if (score >= 0.25) {
    colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
    riskLabel = 'MEDIUM';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-slate-500 text-sm font-medium">{label}:</span>}
      <span className={`rounded-full border font-semibold tracking-wide ${colorClass} ${sizeClasses[size]}`}>
        {riskLabel} ({Math.round(score * 100)}%)
      </span>
    </div>
  );
};

export default RiskBadge;