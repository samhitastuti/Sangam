import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div
        className={`${sizeClasses} rounded-full border-t-[#1B4D3E] border-r-transparent border-b-[#E9762B] border-l-transparent animate-spin mb-3`}
      />
      {message && <p className="text-sm font-medium text-[#5C5C5C]">{message}</p>}
    </div>
  );
}
