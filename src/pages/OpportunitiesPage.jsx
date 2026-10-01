import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import { opportunitiesApi, referenceApi, userApi } from '../services/api.js';
import { augmentAndSortOpportunities } from '../utils/distance.js';
import { rankOpportunitiesByRecommendation, computeOpportunityRecommendation } from '../utils/recommender.js';
import FilterBar from '../components/common/FilterBar.jsx';
import OpportunityList from '../components/student/OpportunityList.jsx';
import GpsTrackerControl from '../components/common/GpsTrackerControl.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Building2, MapPin, Navigation, Compass, CheckCircle2 } from 'lucide-react';

export default function OpportunitiesPage() {
  const { currentUser } = useAuth();
  const {
    userLocation,
    sortBy,
    setSortBy,
    requestLiveLocation,
    isRequestingLive,
    presets,
    setPreset,
    locationError,
    clearError,
    openLocationModal
  } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [cities, setCities] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [userApplicationsMap, setUserApplicationsMap] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [groupByFormat, setGroupByFormat] = useState(false);

  const initialCity = searchParams.get('city') || 'All';
  const initialSkill = searchParams.get('skill') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialDuration = searchParams.get('duration') || 'All';
  const initialFormat = searchParams.get('activity_format') || searchParams.get('format') || 'All';

  const [filters, setFilters] = useState({
    skill: initialSkill,
    city: initialCity,
    selectedSkill: 'All',
    search: initialSearch,
    status: 'open',
    duration: initialDuration,
    activity_format: initialFormat,
    verifiedOnly: false
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const activeSkill = filters.selectedSkill !== 'All' ? filters.selectedSkill : filters.skill;
      const apiParams = {
        city: filters.city !== 'All' ? filters.city : undefined,
        skill: activeSkill || undefined,
        status: filters.status !== 'All' ? filters.status : undefined,
        search: filters.search || undefined,
        duration: filters.duration !== 'All' ? filters.duration : undefined,
        activity_format: filters.activity_format !== 'All' ? filters.activity_format : undefined,
        verified_only: filters.verifiedOnly ? 'true' : undefined
      };

      const [oppsRes, citiesRes] = await Promise.all([
        opportunitiesApi.getOpportunities(apiParams),
        referenceApi.getCities().catch(() => [])
      ]);

      const opps = Array.isArray(oppsRes) ? oppsRes : (oppsRes?.data || []);
      setOpportunities(opps);

      const cityNames = Array.isArray(citiesRes)
        ? citiesRes.map(c => typeof c === 'string' ? c : c.name)
        : ['Chennai', 'Delhi', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Vellore'];
      setCities(cityNames);

      // Collect distinct skills from current opportunities
      const skillSet = new Set();
      opps.forEach(o => {
        if (Array.isArray(o.skills_needed)) {
          o.skills_needed.forEach(s => skillSet.add(s));
        }
      });
      setAvailableSkills(Array.from(skillSet));

      if (currentUser?.id) {
        try {
          const myApps = await userApi.getMyApplications();
          const apps = Array.isArray(myApps) ? myApps : (myApps?.data || []);
          const map = {};
          apps.forEach((a) => {
            const oppId = a.opportunity?.id || a.opportunity_id;
            if (oppId) map[oppId] = a;
          });
          setUserApplicationsMap(map);
        } catch (e) {
          console.warn('Could not load user applications map:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'duration' && value !== 'All') {
      setSortBy('duration');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      skill: '',
      city: 'All',
      selectedSkill: 'All',
      search: '',
      status: 'open',
      duration: 'All',
      activity_format: 'All',
      verifiedOnly: false
    });
    setSortBy('distance');
    setGroupByFormat(false);
  };

  const sortedOpportunities = useMemo(() => {
    return augmentAndSortOpportunities(
      opportunities,
      userLocation?.lat,
      userLocation?.lng,
      sortBy,
      filters.duration
    );
  }, [opportunities, userLocation?.lat, userLocation?.lng, sortBy, filters.duration]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Editorial Header */}
      <div className="mb-8 pb-6 border-b border-[#1B4D3E]/10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF5A1F] mb-1.5">
              <Compass className="w-4 h-4 text-[#FF5A1F]" />
              <span>Explore Opportunities Directory</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1D2421] tracking-tight">
              Collegiate Volunteer Drives & Programmes
            </h1>
            <p className="text-xs sm:text-sm text-[#57655F] mt-1 max-w-2xl leading-relaxed">
              Explore verified community drives, ecological audits, and health camps. Apply individually and get automatically paired into collegiate squads with fellow students from <strong className="text-slate-900 font-bold">{currentUser?.college || 'SRM Kattankulathur (KTR)'}</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C3B2E]/10 text-xs font-semibold text-[#0C3B2E]">
              <Building2 className="w-3.5 h-3.5 text-[#0C3B2E]" />
              <span>Campus Squad: {currentUser?.college || 'SRM KTR'}</span>
            </div>
            <span className="text-[11px] text-[#57655F] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FF5A1F]" />
              <span>Sorted from {userLocation?.city || 'Chennai'} Hub</span>
            </span>
          </div>
        </div>

        {/* Quick Cause Filter Pills */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Focus:
          </span>
          {[
            { label: 'All Causes', value: '' },
            { label: '🌿 Environment & Ecology', value: 'Environmental' },
            { label: '🩺 Healthcare & Relief', value: 'Health' },
            { label: '📱 Digital Literacy', value: 'Digital' },
            { label: '🐾 Animal Welfare', value: 'Animal' },
            { label: '🎓 Education & Tutoring', value: 'Education' }
          ].map((cat) => {
            const isSelected = (!cat.value && !filters.skill) || (filters.skill === cat.value);
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => handleFilterChange('skill', isSelected && cat.value ? '' : cat.value)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#0C3B2E] text-white shadow-2xs font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar with Server-Side SQL Parameters */}
      <div className="mb-6">
        <FilterBar
          filters={filters}
          cities={cities}
          skills={availableSkills}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          resultCount={sortedOpportunities.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          groupByFormat={groupByFormat}
          onToggleGroupByFormat={() => setGroupByFormat(!groupByFormat)}
        />
      </div>

      {/* GPS Tracking & Location Proximity Controller */}
      <GpsTrackerControl className="mb-8" />

      {/* Opportunities List / Grid */}
      {loading ? (
        <LoadingSpinner message="Querying active opportunities from SQL database..." />
      ) : (
        <OpportunityList
          opportunities={sortedOpportunities}
          userApplications={userApplicationsMap}
          userApplicationsMap={userApplicationsMap}
          viewMode={viewMode}
          groupByFormat={groupByFormat}
        />
      )}
    </div>
  );
}
