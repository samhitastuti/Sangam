import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  opportunitiesApi,
  applicationsApi,
  teamsApi,
  userApi
} from '../services/api.js';
import OpportunityDetail from '../components/student/OpportunityDetail.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function OpportunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, refreshUserProfile } = useAuth();

  const [opportunity, setOpportunity] = useState(null);
  const [application, setApplication] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const opp = await opportunitiesApi.getOpportunity(id);
      setOpportunity(opp);

      if (opp && currentUser?.id) {
        // Fetch current user applications
        const myApps = await userApi.getMyApplications();
        const appsList = Array.isArray(myApps) ? myApps : (myApps?.data || []);
        const app = appsList.find(a => (a.opportunity?.id || a.opportunity_id) === opp.id && a.status !== 'withdrawn');
        setApplication(app || null);

        const targetTeamId = app?.team?.id || app?.team_id;
        if (targetTeamId) {
          const t = await teamsApi.getTeam(targetTeamId);
          setTeam(t);
          setTeamMembers(t?.members || []);
        } else if (currentUser.college) {
          // If not applied yet, see if there is an existing collegiate squad for their college in this opportunity
          try {
            const collegeTeam = await opportunitiesApi.getOpportunityTeamByCollege(opp.id, currentUser.college);
            if (collegeTeam) {
              setTeam(collegeTeam);
              setTeamMembers(collegeTeam.members || []);
            }
          } catch {
            setTeam(null);
            setTeamMembers([]);
          }
        }
      }
    } catch (e) {
      console.error('Error loading opportunity:', e);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'student') {
      alert('Only students can apply as volunteers.');
      return;
    }

    setActionLoading(true);
    setNotification(null);
    try {
      const result = await applicationsApi.applyToOpportunity(opportunity.id);
      await refreshUserProfile();
      
      const welcomeMsg = result?.message || `You're part of the ${currentUser.college || 'campus'} squad!`;
      setNotification({
        type: 'success',
        message: welcomeMsg
      });

      if (result?.team) {
        setTeam(result.team);
        setTeamMembers(result.team.members || []);
      }
      if (result?.application) {
        setApplication(result.application);
      }

      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to submit application.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!application) return;

    const confirmWithdraw = window.confirm(
      'Are you sure you want to withdraw your application? This will remove you from your collegiate squad.'
    );
    if (!confirmWithdraw) return;

    setActionLoading(true);
    setNotification(null);
    try {
      await applicationsApi.withdrawApplication(application.id);
      await refreshUserProfile();
      setNotification({
        type: 'info',
        message: 'Your application has been withdrawn.'
      });
      setApplication(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to withdraw application.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading opportunity details..." />;
  }

  if (!opportunity) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <EmptyState
          title="Opportunity not found"
          description="The requested volunteer listing does not exist or may have been deleted."
          actionLabel="Browse Available Opportunities"
          actionTo="/browse"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {notification && (
        <div
          className={`max-w-3xl mx-auto mb-6 p-4 rounded-md text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-[#EBF3EF] text-[#1B4D3E] border border-[#1B4D3E]/30'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-stone-100 text-[#1C1C1C] border border-stone-200'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-500 hover:text-stone-800 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <OpportunityDetail
        opportunity={opportunity}
        application={application}
        team={team}
        teamMembers={teamMembers}
        currentUser={currentUser}
        onApply={handleApply}
        onWithdraw={handleWithdraw}
        loadingAction={actionLoading}
      />
    </div>
  );
}
