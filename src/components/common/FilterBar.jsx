import React from 'react';
import {
  Search,
  X,
  RotateCcw,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Sparkles,
  Building2,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Zap,
  Megaphone,
  ShieldCheck,
  Layers,
  Radio
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.jsx';

export default function FilterBar({
  filters,
  onFilterChange,
  cities = [],
  skills = [],
  onReset,
  viewMode = 'grid',
  onViewModeChange = () => {},
  groupByFormat = false,
  onToggleGroupByFormat = () => {},
  totalCount = null
}) {
  const {
    userLocation,
    requestLiveLocation,
    isRequestingLive,
    isTracking,
    toggleGpsTracking,
    locationError,
    clearError,
    setPreset,
    presets,
    sortBy,
    setSortBy,
    openLocationModal,
    lastUpdated
  } = useLocation();

  const hasActiveFilters = Boolean(
    filters.skill ||
    (filters.selectedSkill && filters.selectedSkill !== 'All') ||
    (filters.city && filters.city !== 'All') ||
    (filters.duration && filters.duration !== 'All') ||
    (filters.activity_format && filters.activity_format !== 'All') ||
    filters.verifiedOnly ||
    filters.onlySrm ||
    filters.startDate ||
    filters.endDate ||
    sortBy !== 'distance'
  );

  const formatOptions = [
    { id: 'All', label: 'All Activities', icon: Layers, desc: 'All formats' },
    { id: 'weekly', label: '📅 Weekly with Timings', icon: Calendar, desc: 'Animal shelter care, weekly tutoring, food kitchens' },
    { id: 'one_day_drive', label: '⚡ One-Day Drives', icon: Zap, desc: 'Single-day beach cleanups, afforestation, camps' },
    { id: 'campaign', label: '📢 Campaigns & Sprints', icon: Megaphone, desc: 'Voter election awareness, road safety rallies' }
  ];

  const quickCategories = [
    { label: 'All Programmes', key: 'all' },
    { label: '★ SRM Active Squads', key: 'srm' },
    { label: '🐾 Animal Shelters', key: 'animal' },
    { label: '🗳️ Election & Democracy', key: 'democracy' },
    { label: '🏖️ Coastal Cleanups', key: 'coastal' },
    { label: '⏱ 1 Day (Single Day)', key: 'dur_1day' },
    { label: '⏱ Weekend (1–2 Days)', key: 'dur_weekend' },
    { label: 'Chennai (SRM Region)', key: 'chennai' },
    { label: 'STEM & Robotics', key: 'stem' },
    { label: 'Digital Literacy', key: 'digital' },
    { label: 'Ecology & Coast', key: 'ecology' }
  ];

  const handleQuickSelect = (key) => {
    if (key === 'all') {
      onReset();
    } else if (key === 'animal') {
      onFilterChange('activity_format', 'weekly');
      onFilterChange('skill', 'Animal');
    } else if (key === 'democracy') {
      onFilterChange('activity_format', 'campaign');
      onFilterChange('skill', 'Civic');
    } else if (key === 'coastal') {
      onFilterChange('activity_format', 'one_day_drive');
      onFilterChange('skill', 'Environmental');
    } else if (key === 'dur_1day') {
      const nextVal = filters.duration === '1-day' ? 'All' : '1-day';
      onFilterChange('duration', nextVal);
      if (nextVal !== 'All') setSortBy('duration');
    } else if (key === 'dur_weekend') {
      const nextVal = filters.duration === 'weekend' ? 'All' : 'weekend';
      onFilterChange('duration', nextVal);
      if (nextVal !== 'All') setSortBy('duration');
    } else if (key === 'srm') {
      onFilterChange('onlySrm', !filters.onlySrm);
    } else if (key === 'chennai') {
      onFilterChange('city', 'Chennai');
    } else if (key === 'stem') {
      onFilterChange('skill', 'STEM');
    } else if (key === 'digital') {
      onFilterChange('skill', 'Digital Literacy');
    } else if (key === 'ecology') {
      onFilterChange('skill', 'Environmental');
    }
  };

  return (
    <div className="space-y-3 mb-8">
      
      {/* 1. Format Grouping Switcher Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 shrink-0 mr-1 hidden md:inline">
            Activity Group:
          </span>
          {formatOptions.map((opt) => {
            const isSelected = (filters.activity_format || 'All') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onFilterChange('activity_format', opt.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0C3B2E] text-white shadow-xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
                title={opt.desc}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right action toggles: Verified NGOs & Grouped View */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Verified NGOs Only Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange('verifiedOnly', !filters.verifiedOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
              filters.verifiedOnly
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs font-bold'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}
            title="Filter to only show legitimate verified NGOs with Darpan registrations"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verified NGOs Only</span>
          </button>

          {/* Grouped View Mode Toggle */}
          <button
            type="button"
            onClick={onToggleGroupByFormat}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
              groupByFormat
                ? 'bg-[#FF5A1F] text-white border-[#E04810] shadow-xs font-bold'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
            title="Divide opportunities into Weekly, One-Day Drives, and Campaigns groups"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Group by Activity Type</span>
            <span className="sm:hidden">Grouped</span>
          </button>
        </div>
      </div>

      {/* 2. Main Search & Filter Row */}
      <div className="py-3 px-3 sm:px-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search input with live clear */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search drives, skills, animal shelter, coastal..."
              value={filters.skill || ''}
              onChange={(e) => onFilterChange('skill', e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:border-[#0C3B2E] focus:bg-white rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
            {filters.skill && (
              <button
                onClick={() => onFilterChange('skill', '')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skill domain dropdown */}
          <div className="lg:col-span-3 relative">
            <select
              value={filters.selectedSkill || 'All'}
              onChange={(e) => onFilterChange('selectedSkill', e.target.value)}
              aria-label="Filter by Skill"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0C3B2E] rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none transition-colors cursor-pointer font-medium"
            >
              <option value="All">All Focus Areas</option>
              {skills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter Select */}
          <div className="lg:col-span-3 relative">
            <select
              value={filters.city || 'All'}
              onChange={(e) => onFilterChange('city', e.target.value)}
              aria-label="Filter by City"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#0C3B2E] rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none transition-colors cursor-pointer font-medium"
            >
              <option value="All">All Cities (10 Covered)</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === 'Chennai' ? '📍 Chennai (SRM Chapter)' : `📍 ${city}`}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Filter Select */}
          <div className="lg:col-span-2 relative">
            <select
              value={filters.duration || 'All'}
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange('duration', val);
                if (val !== 'All') {
                  setSortBy('duration');
                }
              }}
              aria-label="Filter by Duration"
              className={`w-full px-2.5 py-2 rounded text-xs font-semibold focus:outline-none transition-colors cursor-pointer border ${
                filters.duration && filters.duration !== 'All'
                  ? 'bg-[#0C3B2E]/10 border-[#0C3B2E] text-[#0C3B2E]'
                  : 'bg-[#FBF9F5] border-[#0C3B2E]/15 text-[#141C18]'
              }`}
            >
              <option value="All">All Durations</option>
              <option value="1-day">⏱ 1 Day (Single Day)</option>
              <option value="weekend">⏱ Weekend (1–2 Days)</option>
              <option value="1-2-weeks">⏱ 1–2 Weeks</option>
              <option value="3-4-weeks">⏱ 3–4 Weeks</option>
              <option value="4-plus-weeks">⏱ 4+ Weeks (Long Term)</option>
            </select>
          </div>

          {/* SRM Toggle Button */}
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => onFilterChange('onlySrm', !filters.onlySrm)}
              className={`w-full py-2 px-2.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                filters.onlySrm
                  ? 'bg-[#FF5A1F] text-white shadow-xs'
                  : 'bg-[#0C3B2E]/5 text-[#0C3B2E] hover:bg-[#0C3B2E]/10 border border-[#0C3B2E]/15'
              }`}
            >
              <span>★ SRM Squads</span>
              {filters.onlySrm && <span className="text-[10px] bg-white/20 px-1 rounded">Active</span>}
            </button>
          </div>

          {/* View Toggle & Reset */}
          <div className="lg:col-span-1 flex items-center justify-end gap-1.5">
            {hasActiveFilters ? (
              <button
                onClick={onReset}
                title="Reset filters"
                className="p-2 text-[#57655F] hover:text-[#FF5A1F] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : null}

            {/* View Mode Switcher */}
            <div className="flex items-center border border-[#0C3B2E]/20 rounded p-0.5 bg-[#FBF9F5]">
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                title="Grid view with large photos"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#0C3B2E] text-white shadow-2xs'
                    : 'text-[#57655F] hover:text-[#141C18]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                title="Compact list view"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#0C3B2E] text-white shadow-2xs'
                    : 'text-[#57655F] hover:text-[#141C18]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Location Access & Proximity Sorting Bar */}
      <div className="p-3 bg-[#0C3B2E]/5 border border-[#0C3B2E]/15 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Current Reference Location, Coordinates & GPS Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#0C3B2E]">
            <Compass className="w-4 h-4 text-[#FF5A1F]" />
            <span>GPS Tracking:</span>
          </div>

          {/* Reference Location Pill / Preset Selector */}
          <div className="relative inline-flex items-center">
            <select
              value={userLocation.presetId || (userLocation.isLive ? 'live' : 'custom')}
              onChange={(e) => {
                if (e.target.value === 'live') {
                  requestLiveLocation();
                } else {
                  setPreset(e.target.value);
                }
              }}
              aria-label="Proximity reference point"
              className="pl-2 pr-7 py-1 rounded bg-white border border-[#0C3B2E]/25 text-[#141C18] text-xs font-semibold focus:outline-none focus:border-[#0C3B2E] transition-colors cursor-pointer shadow-2xs"
            >
              {userLocation.isLive && (
                <option value="live">
                  📍 {userLocation.source === 'device' ? 'Live Device GPS' : 'Network GPS'} ({userLocation.lat?.toFixed(2)}°N, {userLocation.lng?.toFixed(2)}°E)
                </option>
              )}
              <optgroup label="Popular Campuses & Reference Hubs">
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Device GPS Location Trigger Button */}
          <button
            type="button"
            onClick={requestLiveLocation}
            disabled={isRequestingLive}
            title="Request precise location from your device browser"
            className={`px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-semibold text-xs transition-all cursor-pointer shadow-2xs ${
              userLocation.isLive
                ? 'bg-emerald-700 text-white'
                : 'bg-white hover:bg-[#0C3B2E] text-[#0C3B2E] hover:text-white border border-[#0C3B2E]/20'
            }`}
          >
            <Navigation className={`w-3 h-3 ${isRequestingLive ? 'animate-spin' : ''}`} />
            <span>
              {isRequestingLive
                ? 'Acquiring GPS...'
                : userLocation.isLive
                ? '✓ GPS Active'
                : 'Acquire Live GPS'}
            </span>
          </button>

          {/* Continuous Tracking Button */}
          <button
            type="button"
            onClick={toggleGpsTracking}
            className={`px-2 py-1 rounded inline-flex items-center gap-1 text-[11px] font-semibold transition-all cursor-pointer ${
              isTracking
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
            title="Keep GPS tracking active as you travel"
          >
            <Radio className={`w-3 h-3 ${isTracking ? 'animate-pulse text-white' : 'text-stone-400'}`} />
            <span>{isTracking ? 'Live Tracking' : 'Track'}</span>
          </button>
          {/* Switch City / Open Location Picker Modal */}
          <button
            type="button"
            onClick={openLocationModal}
            title="Switch your active volunteering city"
            className="px-2.5 py-1 rounded inline-flex items-center gap-1 font-semibold text-xs transition-all cursor-pointer shadow-2xs bg-white hover:bg-stone-50 text-[#0C3B2E] border border-[#0C3B2E]/25"
          >
            <MapPin className="w-3 h-3 text-[#FF5A1F]" />
            <span>Switch City ({userLocation.city})</span>
          </button>
        </div>

        {/* Right: Sort By Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-[#57655F] font-semibold text-[11px] uppercase tracking-wider">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort opportunities"
            className="px-2.5 py-1 rounded bg-white border border-[#0C3B2E]/30 text-[#0C3B2E] text-xs font-bold focus:outline-none focus:border-[#0C3B2E] transition-colors cursor-pointer shadow-2xs"
          >
            <option value="recommended">⭐ Best Match (AI & Skills Fit)</option>
            <option value="distance">📍 Distance (Nearest first)</option>
            <option value="distance-desc">📍 Distance (Furthest first)</option>
            <option value="duration">⏱ Duration (Shortest first)</option>
            <option value="duration-desc">⏱ Duration (Longest first)</option>
            <option value="date">📅 Date (Upcoming first)</option>
            <option value="capacity">👥 Spots (Most remaining)</option>
          </select>
        </div>

      </div>

      {/* Geolocation Notice / Error Banner (if dismissed or iframe blocked) */}
      {locationError && (
        <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError} Using <strong>{userLocation.label}</strong> for approximate distance sorting.</span>
          </div>
          <button
            onClick={clearError}
            className="text-amber-700 hover:text-amber-900 font-bold text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick category filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#57655F] shrink-0 mr-1 hidden sm:inline">
          Explore Causes:
        </span>
        {quickCategories.map((cat) => {
          let isActive = false;
          if (cat.key === 'all') isActive = !hasActiveFilters;
          if (cat.key === 'animal') isActive = filters.activity_format === 'weekly' && filters.skill === 'Animal';
          if (cat.key === 'democracy') isActive = filters.activity_format === 'campaign' && filters.skill === 'Civic';
          if (cat.key === 'coastal') isActive = filters.activity_format === 'one_day_drive';
          if (cat.key === 'dur_1day') isActive = filters.duration === '1-day';
          if (cat.key === 'dur_weekend') isActive = filters.duration === 'weekend';
          if (cat.key === 'srm') isActive = Boolean(filters.onlySrm);
          if (cat.key === 'chennai') isActive = filters.city === 'Chennai';
          if (cat.key === 'stem') isActive = filters.skill === 'STEM';
          if (cat.key === 'digital') isActive = filters.skill === 'Digital Literacy';
          if (cat.key === 'ecology') isActive = filters.skill === 'Environmental';

          return (
            <button
              key={cat.key}
              onClick={() => handleQuickSelect(cat.key)}
              className={`px-3 py-1 rounded text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0C3B2E] text-white shadow-2xs'
                  : 'bg-white hover:bg-stone-100 text-[#57655F] border border-[#0C3B2E]/15'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
