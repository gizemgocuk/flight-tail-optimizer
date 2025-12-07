import React from 'react';

interface InputCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const InputCard: React.FC<InputCardProps> = ({ title, description, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default InputCard;