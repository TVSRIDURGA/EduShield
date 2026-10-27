import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 3, 
  className = '' 
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-lg w-full"></div>
      ))}
    </div>
  );
};
