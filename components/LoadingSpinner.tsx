
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-[6px]',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div 
        className={`${sizeClasses[size]} border-gray-700 border-t-cyan-400 rounded-full animate-spin`}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="text-neutral-400 text-sm">{text}</p>}
    </div>
  );
};