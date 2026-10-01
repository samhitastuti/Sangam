import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  organizationApi,
  opportunitiesApi,
  applicationsApi
} from '../services/api.js';
import OrgDashboard from '../components/org/OrgDashboard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function OrgDashboardPage() {
  const { currentUser, isOrg } = useAuth();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState([]);
  const [oppApplications, setOppApplications] = useState({});
  const [oppTeams, setOppTeams] = useState({});
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!isOrg) {
      navigate('/dashboard');
      return;
    }

    loadOrgData();
  }, [currentUser, isOrg]);

  const loadOrgData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Fetch organization opportunities and verification
      const [oppsRes, verifRes] = await Promise.all([
        organizationApi.getOpportunities(),
        organizationApi.getVerification().catch(() => null)
      ]);
      const opps = Array.isArray(oppsRes) ? oppsRes : (oppsRes?.data || []);
      setOpportunities(opps);
      if (verifRes?.data) {
        setVerification(verifRes.data);
      } else if (verifRes) {
        setVerification(verifRes);
      }

      // 2. Fetch applications and teams for each opportunity
      const appsMap = {};
      const teamsMap = {};

      await Promise.all(
        opps.map(async (opp) => {
          try {
            const [applicantsRes, teamsRes] = await Promise.all([
              opportunitiesApi.getApplicants(opp.id).catch(() => null),
              opportunitiesApi.getOpportunityTeams(opp.id).catch(() => [])
            ]);

            const applicantsList = applicantsRes?.applicants || (
              applicantsRes?.byCollege
                ? Object.values(applicantsRes.byCollege).flat()
                : []
            );
            appsMap[opp.id] = applicantsList;

            const teamsList = Array.isArray(teamsRes) ? teamsRes : (teamsRes?.data || []);
            teamsMap[opp.id] = teamsList;
          } catch (e) {
            console.warn(`Error loading details for opp ${opp.id}:`, e);
          }
        })
      );

      setOppApplications(appsMap);
      setOppTeams(teamsMap);
    } catch (e) {
      console.error('Failed to load organization data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (oppData) => {
    try {
      await opportunitiesApi.createOpportunity({
        ...oppData,
        orgId: currentUser.id
      });
      await loadOrgData();
    } catch (err) {
      alert(err.message || 'Failed to create opportunity');
    }
  };

  const handleUpdate = async (oppId, updates) => {
    try {
      await opportunitiesApi.updateOpportunity(oppId, updates);
      await loadOrgData();
    } catch (err) {
      alert(err.message || 'Failed to update opportunity');
    }
  };

  const handleClose = async (oppId) => {
    const confirm = window.confirm(
      'Are you sure you want to close applications for this opportunity?'
    );
    if (!confirm) return;

    try {
      await opportunitiesApi.updateOpportunity(oppId, { status: 'closed' });
      await loadOrgData();
    } catch (err) {
      alert(err.message || 'Failed to close opportunity');
    }
  };

  const handleMarkComplete = async (applicationId) => {
    setLoadingActionId(applicationId);
    try {
      await applicationsApi.completeApplication(applicationId, 16);
      await loadOrgData();
    } catch (err) {
      alert(err.message || 'Failed to update application');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleVerificationSubmit = async (payload) => {
    try {
      const res = await organizationApi.submitVerification(payload);
      if (res?.data) {
        setVerification(res.data);
      }
      await loadOrgData();
      return res;
    } catch (err) {
      throw err;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {loading ? (
        <LoadingSpinner message="Calculating organization statistics and campus squads..." />
      ) : (
        <OrgDashboard
          currentUser={currentUser}
          verification={verification}
          onVerificationSubmit={handleVerificationSubmit}
          opportunities={opportunities}
          oppApplications={oppApplications}
          oppTeams={oppTeams}
          onCreateOpportunity={handleCreate}
          onUpdateOpportunity={handleUpdate}
          onCloseOpportunity={handleClose}
          onMarkComplete={handleMarkComplete}
          loadingActionId={loadingActionId}
        />
      )}
    </div>
  );
}
