import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  ShieldCheck,
  Search,
  ExternalLink,
  Award,
  Users,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLocation } from '../contexts/LocationContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function OrganizationsPage() {
  const { userLocation } = useLocation();

  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const allCities = [
    'All',
    'Chennai',
    'Bengaluru',
    'Hyderabad',
    'Mumbai',
    'Delhi',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Coimbatore',
    'Vellore'
  ];

  const categories = [
    'All',
    'Environment',
    'Animal Welfare',
    'Education',
    'Civic & Democracy',
    'Healthcare',
    'Community Action'
  ];

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity !== 'All') params.append('city', selectedCity);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (verifiedOnly) params.append('verifiedOnly', 'true');

      const res = await fetch(`/api/organizations?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrganizations(json.data);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [selectedCity, selectedCategory, verifiedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrganizations();
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C3B2E]/10 text-[#0C3B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified Non-Profit & NGO Network</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Organizations & Foundations
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl font-normal leading-relaxed">
            Explore trusted community foundations, animal sanctuaries, civic groups, and healthcare trusts partnering with collegiate student squads across India.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input
                type="text"
                placeholder="Search organizations by name, cause (Animal, River, Healthcare, Voter...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0C3B2E] focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            {/* City dropdown */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter by City"
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
              >
                {allCities.map((c) => (
                  <option key={c} value={c}>
                    📍 {c === 'All' ? 'All Cities (10 Locations)' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Category dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by Category"
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    🏷️ {cat === 'All' ? 'All Causes & Domains' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Verified toggle */}
            <button
              type="button"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                verifiedOnly
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verified NGOs Only</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-500 flex items-center justify-between pt-1">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{organizations.length} organizations</strong> in {selectedCity === 'All' ? 'all cities' : selectedCity}
            </span>
            {selectedCity !== 'All' && (
              <button
                onClick={() => {
                  setSelectedCity('All');
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setVerifiedOnly(false);
                }}
                className="text-[#FF5A1F] hover:underline font-bold cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Loading registered organizations..." />
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">No Organizations Found</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Try choosing "All Cities" or clearing your search term to see NGOs nationwide.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1 border border-slate-200/60">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                      <span>{org.city}</span>
                    </span>

                    {org.isVerified && (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified NGO</span>
                      </span>
                    )}
                  </div>

                  {/* Organization Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {org.organizationName || org.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {org.bio}
                    </p>
                  </div>

                  {/* Focus Areas Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {org.focusAreas.slice(0, 3).map((f, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-xs px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* Compliance Badges */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {org.darpanId && (
                      <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                        Darpan: {org.darpanId}
                      </span>
                    )}
                    {org.taxExemption80g && (
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-xs">
                        80G Tax Exempt
                      </span>
                    )}
                    <span className="font-semibold text-[#0C3B2E]">
                      Trust: {org.trustScore}%
                    </span>
                  </div>
                </div>

                {/* Footer Metrics & Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold text-slate-900">
                      {org.openOpportunitiesCount} open
                    </span>{' '}
                    <span className="text-slate-500">drives</span>
                  </div>

                  <a
                    href={`/opportunities?city=${org.city}`}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#FF5A1F] hover:text-[#E04810] transition-colors"
                  >
                    <span>View Drives</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
