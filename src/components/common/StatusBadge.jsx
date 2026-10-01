import React from 'react';

export default function StatusBadge({ status }) {
  const normStatus = (status || '').toLowerCase();

  const configs = {
    applied: {
      label: 'Applied',
      dotColor: 'bg-emerald-600',
      textColor: 'text-emerald-900'
    },
    withdrawn: {
      label: 'Withdrawn',
      dotColor: 'bg-stone-400',
      textColor: 'text-stone-600'
    },
    completed: {
      label: 'Completed & Certified',
      dotColor: 'bg-[#E9762B]',
      textColor: 'text-[#1B4D3E]'
    },
    open: {
      label: 'Open',
      dotColor: 'bg-emerald-600',
      textColor: 'text-emerald-900'
    },
    closed: {
      label: 'Closed',
      dotColor: 'bg-stone-400',
      textColor: 'text-stone-500'
    }
  };

  const current = configs[normStatus] || {
    label: status,
    dotColor: 'bg-stone-400',
    textColor: 'text-stone-700'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${current.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />
      <span>{current.label}</span>
    </span>
  );
}
