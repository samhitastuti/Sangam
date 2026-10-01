import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userApi, applicationsApi } from '../services/api.js';
import MyApplications from '../components/student/MyApplications.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, User, Award } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isStudent } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!isStudent) {
      navigate('/org-dashboard');
      return;
    }

    loadApplications();
  }, [currentUser, isStudent]);

  const loadApplications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await userApi.getMyApplications();
      setApplications(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      console.error('Failed to load user applications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    const confirm = window.confirm(
      'Are you sure you want to withdraw? You will be removed from your collegiate squad.'
    );
    if (!confirm) return;

    setWithdrawingId(applicationId);
    try {
      await applicationsApi.withdrawApplication(applicationId);
      await loadApplications();
    } catch (err) {
      alert(err.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (!currentUser) return null;

  const activeCount = applications.filter((a) => a.status === 'applied').length;
  const completedCount = applications.filter((a) => a.status === 'completed').length;
  const totalHours = applications.reduce((acc, a) => {
    if (a.status === 'completed') return acc + (a.volunteerHours || a.volunteer_hours || 16);
    return acc;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      
      {/* Editorial Member Lockup */}
      <div className="pb-10 mb-12 border-b border-[#1B4D3E]/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9762B] mb-2">
              Collegiate Dashboard
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[#1D2421] uppercase">
              {currentUser.name}
            </h1>
            <div className="text-sm text-[#6F756F] mt-2 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#1B4D3E]">{currentUser.college}</span>
              <span>·</span>
              <span>{currentUser.home_city || currentUser.homeCity}</span>
              <span>·</span>
              <span>Automatic campus pairing enabled</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="px-4 py-2 rounded border border-[#1B4D3E]/20 text-xs font-semibold text-[#1D2421] hover:border-[#1B4D3E] transition-colors"
            >
              Passport Profile
            </Link>
            <Link
              to="/browse"
              className="px-4 py-2 rounded bg-[#1B4D3E] hover:bg-[#13392D] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Explore open programmes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* YOUR IMPACT: Large Typography, Horizontal Separators, Large Numbers */}
        <div className="mt-12 pt-8 border-t border-[#1B4D3E]/10">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B4D3E] mb-6">
            Your Verified Impact
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            
            <div className="space-y-1">
              <div className="font-display text-5xl sm:text-6xl font-black text-[#1B4D3E] tracking-tight tabular-nums">
                {totalHours}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#6F756F]">
                Verified Service Hours
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-display text-5xl sm:text-6xl font-black text-[#1D2421] tracking-tight tabular-nums">
                {applications.length}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#6F756F]">
                Programmes
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-display text-5xl sm:text-6xl font-black text-[#E9762B] tracking-tight tabular-nums">
                {completedCount}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#6F756F]">
                Completed & Certified
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* CURRENT PROGRAMMES */}
      <div>
        <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-[#1B4D3E]/15">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#1D2421] uppercase">
            Enrolled Squads & Programmes
          </h2>
          <span className="text-xs text-[#6F756F] font-mono tabular-nums">
            {applications.length} Active Records
          </span>
        </div>

        {loading ? (
          <LoadingSpinner message="Retrieving your squad records from SQL..." />
        ) : (
          <MyApplications
            applications={applications}
            onWithdraw={handleWithdraw}
            withdrawingId={withdrawingId}
          />
        )}
      </div>

    </div>
  );
}
