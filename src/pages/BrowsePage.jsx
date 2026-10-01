import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import {
  opportunitiesApi,
  referenceApi,
  userApi
} from '../services/api.js';
import { augmentAndSortOpportunities } from '../utils/distance.js';
import FilterBar from '../components/common/FilterBar.jsx';
import OpportunityList from '../components/student/OpportunityList.jsx';
import GpsTrackerControl from '../components/common/GpsTrackerControl.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EditorialHero from '../components/home/EditorialHero.jsx';
import CollegeMatchingSection from '../components/home/CollegeMatchingSection.jsx';
import ImpactStorySection from '../components/home/ImpactStorySection.jsx';
import HowItWorksSection from '../components/home/HowItWorksSection.jsx';
import CampusSquadsNetwork from '../components/home/CampusSquadsNetwork.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, MapPin, Navigation, Compass, Sparkles } from 'lucide-react';

export default function BrowsePage() {
  const { currentUser } = useAuth();
  const {
    userLocation,
    sortBy,
    setSortBy,
    requestLiveLocation,
    isRequestingLive,
    presets,
    setPreset
  } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [cities, setCities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [userApplicationsMap, setUserApplicationsMap] = useState({});
  const [groupByFormat, setGroupByFormat] = useState(false);

  const [filters, setFilters] = useState({
    skill: '',
    selectedSkill: 'All',
    city: 'All',
    search: '',
    status: 'open',
    duration: 'All',
    activity_format: 'All',
    verifiedOnly: false
  });

  const [viewMode, setViewMode] = useState('grid');
  const oppBoardRef = useRef(null);

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

      const skillSet = new Set();
      opps.forEach(o => {
        if (Array.isArray(o.skills_needed)) {
          o.skills_needed.forEach(s => skillSet.add(s));
        }
      });
      setSkills(Array.from(skillSet));

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
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.error('Failed to load opportunities:', e);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'duration' && value !== 'All') {
      setSortBy('duration');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      skill: '',
      selectedSkill: 'All',
      city: 'All',
      search: '',
      status: 'open',
      duration: 'All',
      activity_format: 'All',
      verifiedOnly: false
    });
    setSortBy('distance');
    setGroupByFormat(false);
  };

  const handleExploreScroll = () => {
    oppBoardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const userHomeCity = currentUser?.home_city || currentUser?.homeCity;

  // Split into "Near your hometown" vs all opportunities, sorted by distance & duration
  const hometownOpportunities = useMemo(() => {
    if (!userHomeCity) return [];
    const sameCity = opportunities.filter(
      (o) => o.city?.toLowerCase() === userHomeCity.toLowerCase()
    );
    return augmentAndSortOpportunities(
      sameCity,
      userLocation?.lat,
      userLocation?.lng,
      sortBy,
      filters.duration
    );
  }, [opportunities, userHomeCity, userLocation?.lat, userLocation?.lng, sortBy, filters.duration]);

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
    <div className="bg-[#FBF9F5]">
      
      {/* 1. Large Asymmetrical Editorial Hero */}
      <EditorialHero onExploreClick={handleExploreScroll} />

      {/* 2. College / Team Matching Section */}
      <CollegeMatchingSection />

      {/* 3. Editorial Opportunity Board Section */}
      <section ref={oppBoardRef} id="opportunities-board" className="py-14 sm:py-20 border-b border-[#0C3B2E]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#FF5A1F] mb-1.5 font-display">
                Curated Community Cohorts
              </div>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#141C18] uppercase leading-tight">
                Open Social Impact <span className="text-[#0C3B2E]">Programmes</span>.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <Link
                to="/opportunities"
                className="px-3.5 py-2 rounded bg-white border border-[#0C3B2E]/20 text-[#0C3B2E] hover:border-[#0C3B2E] transition-colors inline-flex items-center gap-1.5 shadow-2xs font-bold"
              >
                <span>Directory ({sortedOpportunities.length}+)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {currentUser?.role === 'student' && (
                <div className="px-3 py-1.5 rounded bg-[#0C3B2E]/5 border border-[#0C3B2E]/10 text-[#0C3B2E] text-xs font-semibold">
                  Campus:{' '}
                  <span className="font-bold underline decoration-[#FF5A1F] decoration-2">
                    {currentUser.college}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Hometown Banner */}
          {hometownOpportunities.length > 0 && filters.city === 'All' && (
            <div className="mb-6 p-4 rounded-xl bg-[#0C3B2E]/5 border border-[#0C3B2E]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#0C3B2E]">
              <div>
                <span className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  Locality Match:
                </span>{' '}
                <span>
                  Found <strong>{hometownOpportunities.length} opportunities</strong> in your home city of <strong>{userHomeCity}</strong>, sorted by proximity to your campus.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFilterChange('city', userHomeCity)}
                className="px-3 py-1 rounded bg-[#0C3B2E] text-white font-medium hover:bg-[#07251D] transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
              >
                Filter {userHomeCity} only
              </button>
            </div>
          )}

          {/* Filter Bar with Server-Side SQL Filtering */}
          <div className="mb-6">
            <FilterBar
              filters={filters}
              cities={cities}
              skills={skills}
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

          {/* Opportunities Cards */}
          {loading ? (
            <LoadingSpinner message="Querying live opportunities from SQLite..." />
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
      </section>

      {/* 4. Campus Squads Network Directory */}
      <CampusSquadsNetwork />

      {/* 5. How It Works Section */}
      <HowItWorksSection />

      {/* 6. Impact Story Section */}
      <ImpactStorySection />

    </div>
  );
}
