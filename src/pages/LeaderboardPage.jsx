import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Users,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  Filter,
  ShieldCheck,
  Zap,
  Flame,
  ArrowUpRight,
  Building2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const { userLocation } = useLocation();

  const userCollege = currentUser?.college || 'SRM Kattankulathur (KTR)';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    topTeams: [],
    collegeStandings: [],
    userCollegeStats: null,
    totalSquads: 0,
    totalHoursLogged: 0
  });

  // Filters: collegeScope ('my_college' | 'all'), selectedCollege, selectedCity, selectedCategory
  const [collegeScope, setCollegeScope] = useState('my_college');
  const [selectedCollege, setSelectedCollege] = useState(userCollege);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const popularColleges = [
    'SRM Kattankulathur (KTR)',
    'VIT Vellore',
    'IIT Madras',
    'University of Delhi',
    'IIT Delhi',
    'COEP Technological University',
    'Jadavpur University',
    'IIT Gandhinagar',
    'PSG College of Technology',
    'All Colleges'
  ];

  const categories = [
    'All',
    'Environment',
    'Animal Welfare',
    'Education',
    'Civic & Democracy',
    'Healthcare'
  ];

  const cities = [
    'All',
    'Chennai',
    'Vellore',
    'Bengaluru',
    'Hyderabad',
    'Mumbai',
    'Delhi',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Coimbatore'
  ];

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const activeCollege = collegeScope === 'my_college' ? userCollege : (selectedCollege === 'All Colleges' ? 'All' : selectedCollege);
      const params = new URLSearchParams({
        college: activeCollege,
        city: selectedCity,
        category: selectedCategory
      });

      const res = await fetch(`/api/teams/leaderboard?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [collegeScope, selectedCollege, selectedCity, selectedCategory]);

  const topThree = data.topTeams.slice(0, 3);
  const remainingTeams = data.topTeams.slice(3);

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0C3B2E]/15 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A1F]/10 text-[#FF5A1F] text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>Collegiate Campus Cup & Team Standings</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0C3B2E] tracking-tight">
              Collegiate Leaderboard
            </h1>
            <p className="text-sm text-[#57655F] mt-1 max-w-2xl">
              See the top-volunteering student teams from your college, track total hours logged, and foster friendly competition across campuses.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-[#0C3B2E]/15 shadow-2xs self-start md:self-auto">
            <div className="text-center px-2">
              <div className="text-lg font-black text-[#0C3B2E]">{data.totalSquads || 0}</div>
              <div className="text-[10px] uppercase font-bold text-[#57655F]">Active Squads</div>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center px-2">
              <div className="text-lg font-black text-[#FF5A1F]">{data.totalHoursLogged || 0} hrs</div>
              <div className="text-[10px] uppercase font-bold text-[#57655F]">Total Impact</div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#0C3B2E]/15 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Scope Toggle: My College Teams vs All Colleges */}
            <div className="flex items-center gap-1.5 p-1 bg-[#FBF9F5] border border-[#0C3B2E]/15 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => {
                  setCollegeScope('my_college');
                  setSelectedCollege(userCollege);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  collegeScope === 'my_college'
                    ? 'bg-[#0C3B2E] text-white shadow-2xs'
                    : 'text-[#57655F] hover:text-[#141C18]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#FF5A1F]" />
                <span>My College ({userCollege.split(' ')[0]})</span>
              </button>

              <button
                type="button"
                onClick={() => setCollegeScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  collegeScope === 'all'
                    ? 'bg-[#0C3B2E] text-white shadow-2xs'
                    : 'text-[#57655F] hover:text-[#141C18]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>All Colleges Nationwide</span>
              </button>
            </div>

            {/* Selectors for College, City, and Cause */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {collegeScope === 'all' && (
                <div className="relative">
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    aria-label="Filter by College"
                    className="bg-[#FBF9F5] border border-[#0C3B2E]/20 text-[#0C3B2E] font-bold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {popularColleges.map((col) => (
                      <option key={col} value={col}>
                        🏫 {col}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* City selector */}
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Filter by City"
                  className="bg-[#FBF9F5] border border-[#0C3B2E]/20 text-[#141C18] font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      📍 {c === 'All' ? 'All Cities' : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category selector */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter by Category"
                  className="bg-[#FBF9F5] border border-[#0C3B2E]/20 text-[#141C18] font-semibold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      🏷️ {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Active filter highlight notice */}
          <div className="text-xs text-[#57655F] flex items-center justify-between pt-1">
            <span>
              Showing rankings for:{' '}
              <strong className="text-[#0C3B2E]">
                {collegeScope === 'my_college' ? userCollege : selectedCollege}
              </strong>{' '}
              {selectedCity !== 'All' && ` · ${selectedCity}`}
              {selectedCategory !== 'All' && ` · ${selectedCategory}`}
            </span>
            <span className="font-semibold text-[#0C3B2E]">
              {data.topTeams.length} competing squads
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Calculating squad rankings and volunteer hours..." />
          </div>
        ) : (
          <>
            {/* Top 3 Podium Section */}
            {topThree.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF5A1F]" />
                  <h2 className="text-xl font-extrabold text-[#0C3B2E]">
                    Podium: Top Squads
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topThree.map((team, idx) => {
                    const isGold = idx === 0;
                    const isSilver = idx === 1;
                    const isBronze = idx === 2;

                    return (
                      <div
                        key={team.id}
                        className={`relative rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                          isGold
                            ? 'bg-gradient-to-b from-amber-500/10 via-amber-50/50 to-white border-amber-300 md:-translate-y-2 shadow-md'
                            : isSilver
                            ? 'bg-gradient-to-b from-slate-300/20 via-slate-50/50 to-white border-slate-300'
                            : 'bg-gradient-to-b from-amber-700/10 via-amber-50/30 to-white border-amber-200'
                        }`}
                      >
                        {/* Rank Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-2xs ${
                              isGold
                                ? 'bg-amber-500 text-white'
                                : isSilver
                                ? 'bg-slate-500 text-white'
                                : 'bg-amber-700 text-white'
                            }`}
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>{team.badge}</span>
                          </span>

                          <span className="text-2xl font-black text-stone-300 font-display">
                            #{team.rank}
                          </span>
                        </div>

                        {/* Team Details */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-[#0C3B2E] tracking-tight line-clamp-1">
                            {team.teamName}
                          </h3>

                          <div className="text-xs text-[#57655F] flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-[#FF5A1F]" />
                            <span className="truncate">{team.college}</span>
                          </div>

                          <div className="text-xs text-[#141C18] font-bold line-clamp-1">
                            {team.opportunityTitle}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[#57655F]">
                            <span className="px-2 py-0.5 rounded bg-stone-100 font-semibold">
                              {team.opportunityCategory}
                            </span>
                            <span>·</span>
                            <span>📍 {team.city}</span>
                          </div>
                        </div>

                        {/* Hours & Member Avatars */}
                        <div className="pt-4 mt-4 border-t border-stone-200/60 flex items-center justify-between">
                          <div>
                            <div className="text-xl font-black text-[#FF5A1F]">
                              {team.totalHours} hrs
                            </div>
                            <div className="text-[10px] text-[#57655F] font-bold uppercase">
                              Volunteer Hours
                            </div>
                          </div>

                          {/* Member avatars */}
                          <div className="flex items-center -space-x-2">
                            {team.members.slice(0, 4).map((m, mIdx) => (
                              <div
                                key={m.id || mIdx}
                                title={`${m.name} (${m.role})`}
                                className="w-7 h-7 rounded-full bg-[#0C3B2E] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-2xs"
                              >
                                {m.initials}
                              </div>
                            ))}
                            {team.memberCount > 4 && (
                              <div className="w-7 h-7 rounded-full bg-stone-200 text-[#0C3B2E] text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-2xs">
                                +{team.memberCount - 4}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Link */}
                        <a
                          href={`/opportunities/${team.opportunityId}`}
                          className="mt-3 w-full py-1.5 bg-[#0C3B2E]/5 hover:bg-[#0C3B2E] text-[#0C3B2E] hover:text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>View Squad Programme</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete Ranked Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Complete Squad Standings
                </h2>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  Ranked by verified completed hours
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-xs font-bold">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Squad Name</th>
                        <th className="py-3 px-4">College</th>
                        <th className="py-3 px-4">Focus & City</th>
                        <th className="py-3 px-4 text-center">Volunteers</th>
                        <th className="py-3 px-4 text-right">Verified Hours</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.topTeams.map((team) => (
                        <tr
                          key={team.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 font-bold text-sm text-slate-900">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                                team.rank === 1
                                  ? 'bg-amber-400 text-amber-950 font-black'
                                  : team.rank === 2
                                  ? 'bg-slate-300 text-slate-900 font-black'
                                  : team.rank === 3
                                  ? 'bg-amber-700 text-white font-black'
                                  : 'text-slate-600 bg-slate-100'
                              }`}
                            >
                              {team.rank}
                            </span>
                          </td>

                          {/* Squad Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-sm text-slate-900">
                              {team.teamName}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                              {team.opportunityTitle}
                            </div>
                          </td>

                          {/* College */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">
                              {team.college}
                            </span>
                          </td>

                          {/* Category & City */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-700">
                                {team.opportunityCategory}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                📍 {team.city}
                              </span>
                            </div>
                          </td>

                          {/* Members Count */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{team.memberCount}</span>
                            </span>
                          </td>

                          {/* Total Hours */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-sm font-bold text-[#FF5A1F]">
                              {team.totalHours} hrs
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-center">
                            <a
                              href={`/opportunities/${team.opportunityId}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0C3B2E] text-slate-800 hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>Squad Hub</span>
                              <ChevronRight className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Inter-Collegiate Campus Cup Standings */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Inter-Collegiate Campus Cup Standings
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.collegeStandings.slice(0, 8).map((col) => (
                  <div
                    key={col.college}
                    className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0C3B2E] text-white">
                        Rank #{col.rank}
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                        {col.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {col.college}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="font-bold text-[#FF5A1F] text-sm">
                          {col.totalHours} hrs
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                          Hours Logged
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="font-bold text-[#0C3B2E] text-sm">
                          {col.totalSquads}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                          Active Squads
                        </div>
                      </div>
                    </div>

                    {col.topSquad && (
                      <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 truncate">
                        Leading Squad: <strong className="text-slate-800 font-semibold">{col.topSquad.name}</strong> ({col.topSquad.hours}h)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Motivational Action Banner */}
            <div className="bg-[#0C3B2E] text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold font-sans tracking-tight text-white">
                  Want your college squad to reach #1?
                </h3>
                <p className="text-sm text-stone-200 max-w-xl font-normal leading-relaxed">
                  Every hour you and your campus peers volunteer on community drives directly boosts your college standing in the Sangam Collegiate Cup.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="/browse"
                  className="px-6 py-3 rounded-lg bg-[#FF5A1F] hover:bg-[#E04810] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Join a Nearby Squad
                </a>
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
}
