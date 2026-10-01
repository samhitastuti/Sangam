import React from 'react';
import { Calendar, Zap, Megaphone, Clock } from 'lucide-react';

export default function ActivityFormatBadge({
  format = 'weekly',
  timingDetails = '',
  size = 'md',
  showTiming = false
}) {
  const norm = (format || 'weekly').toLowerCase();

  const configs = {
    weekly: {
      label: 'Weekly with Timings',
      shortLabel: 'Weekly Cohort',
      icon: Calendar,
      bg: 'bg-indigo-50 border-indigo-200/80 text-indigo-900',
      pillBg: 'bg-indigo-700 text-white',
      accentColor: '#4338CA',
      description: 'Recurring weekly commitment with fixed timing slots (e.g., animal shelters, weekly tutoring)'
    },
    one_day_drive: {
      label: 'One-Day Drive',
      shortLabel: 'One-Day Drive',
      icon: Zap,
      bg: 'bg-amber-50 border-amber-200/80 text-amber-900',
      pillBg: 'bg-amber-600 text-white',
      accentColor: '#D97706',
      description: 'Single-day high-intensity drive (e.g., coastal cleanups, tree planting drives)'
    },
    campaign: {
      label: 'Awareness Campaign',
      shortLabel: 'Campaign Sprint',
      icon: Megaphone,
      bg: 'bg-purple-50 border-purple-200/80 text-purple-900',
      pillBg: 'bg-purple-700 text-white',
      accentColor: '#7E22CE',
      description: 'Milestone sprint spreading public awareness (e.g., voter registration, road safety)'
    }
  };

  const current = configs[norm] || configs.weekly;
  const Icon = current.icon;

  if (size === 'pill') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-2xs ${current.pillBg}`}>
        <Icon className="w-2.5 h-2.5" />
        <span>{current.shortLabel}</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-0.5`}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${current.bg} shadow-2xs`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{current.label}</span>
      </span>

      {showTiming && timingDetails && (
        <span className="text-[11px] font-medium text-[#57655F] flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 text-stone-400 shrink-0" />
          <span className="truncate">{timingDetails}</span>
        </span>
      )}
    </div>
  );
}
