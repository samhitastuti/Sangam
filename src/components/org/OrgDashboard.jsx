import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  FolderLock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  UserCheck,
  Award,
  X,
  Sparkles
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import ApplicantList from './ApplicantList.jsx';
import TeamList from './TeamList.jsx';
import OpportunityForm from './OpportunityForm.jsx';
import EmptyState from '../common/EmptyState.jsx';
import NgoVerificationModal from '../common/NgoVerificationModal.jsx';

export default function OrgDashboard({
  currentUser,
  verification,
  onVerificationSubmit,
  opportunities = [],
  oppApplications = {},
  oppTeams = {},
  onCreateOpportunity,
  onUpdateOpportunity,
  onCloseOpportunity,
  onMarkComplete,
  loadingActionId
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [expandedOppId, setExpandedOppId] = useState(opportunities[0]?.id || null);
  const [activeTabByOpp, setActiveTabByOpp] = useState({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  // Verification Form State
  const activeVerif = verification || currentUser || {};
  const isVerified = activeVerif.verification_status === 'verified' || activeVerif.verification_status === 'govt_registered' || activeVerif.isVerified;
  const trustScore = activeVerif.trust_score || (isVerified ? 96 : 70);

  const [verifForm, setVerifForm] = useState({
    ngo_darpan_id: activeVerif.ngo_darpan_id || '',
    registration_type: activeVerif.registration_type || 'Registered Public Trust',
    registration_number: activeVerif.registration_number || '',
    trustee_name: activeVerif.trustee_name || activeVerif.name || '',
    tax_exemption_80g: activeVerif.tax_exemption_80g ?? true,
    tax_exemption_12a: activeVerif.tax_exemption_12a ?? true,
    fcra_registered: activeVerif.fcra_registered ?? false,
    verification_notes: activeVerif.verification_notes || ''
  });

  const handleVerifPreset = (presetKey) => {
    if (presetKey === 'niti') {
      setVerifForm({
        ngo_darpan_id: 'TN/2018/0201948',
        registration_type: 'Registered Public Charitable Trust',
        registration_number: 'TN-CH-2018-8819',
        trustee_name: activeVerif.name || 'Dr. C. Muthamizhchelvan',
        tax_exemption_80g: true,
        tax_exemption_12a: true,
        fcra_registered: true,
        verification_notes: 'Audited statutory outreach trust registered on central NGO-DARPAN portal with clean IT returns.'
      });
    } else if (presetKey === 'sec8') {
      setVerifForm({
        ngo_darpan_id: 'KA/2019/0082716',
        registration_type: 'Section 8 Non-Profit Company (MCA)',
        registration_number: 'U85300KA2019NPL128490',
        trustee_name: 'Radhika Ramaswamy (Managing Director)',
        tax_exemption_80g: true,
        tax_exemption_12a: true,
        fcra_registered: false,
        verification_notes: 'Ministry of Corporate Affairs Section 8 certified non-profit organization with active 80G.'
      });
    }
  };

  const handleVerifSubmit = async (e) => {
    e.preventDefault();
    setSubmittingVerification(true);
    setVerificationFeedback(null);
    try {
      if (onVerificationSubmit) {
        await onVerificationSubmit(verifForm);
      }
      setVerificationFeedback({
        type: 'success',
        message: 'NGO Legitimacy verified successfully! Your verified badge is now active on all hosted opportunities.'
      });
      setTimeout(() => {
        setShowVerificationModal(false);
      }, 1500);
    } catch (err) {
      setVerificationFeedback({
        type: 'error',
        message: err.message || 'Failed to verify organization credentials.'
      });
    } finally {
      setSubmittingVerification(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOppId(expandedOppId === id ? null : id);
  };

  const setTab = (oppId, tab) => {
    setActiveTabByOpp((prev) => ({ ...prev, [oppId]: tab }));
  };

  // Metrics
  const totalVolunteers = opportunities.reduce((acc, curr) => acc + (curr.appliedCount || 0), 0);
  const totalTeams = Object.values(oppTeams).reduce((acc, teams) => acc + (teams?.length || 0), 0);
  const totalCompleted = Object.values(oppApplications).reduce((acc, apps) => {
    return acc + (apps?.filter((a) => a.status === 'completed').length || 0);
  }, 0);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner & Header */}
      <div className="pb-8 border-b border-[#E8E2D5]">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1C1C]">
              Organisation management
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5C5C] mt-1">
              Track student volunteer applications, manage college squads, and issue completion certificates.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingOpp(null);
              setShowCreateForm(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1B4D3E] hover:bg-[#13392D] text-white text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post new opportunity</span>
          </button>
        </div>

        {/* Stats summary row */}
        <div className="mt-6 flex flex-wrap items-center gap-6 sm:gap-10 text-sm text-[#5C5C5C]">
          <div>
            <span className="font-semibold text-lg text-[#1C1C1C] mr-1.5">{opportunities.length}</span>
            <span>opportunities</span>
          </div>
          <span className="text-[#D8D2C4]">·</span>
          <div>
            <span className="font-semibold text-lg text-[#1C1C1C] mr-1.5">{totalVolunteers}</span>
            <span>registered volunteers</span>
          </div>
          <span className="text-[#D8D2C4]">·</span>
          <div>
            <span className="font-semibold text-lg text-[#1C1C1C] mr-1.5">{totalTeams}</span>
            <span>campus teams formed</span>
          </div>
          <span className="text-[#D8D2C4]">·</span>
          <div>
            <span className="font-semibold text-lg text-[#1B4D3E] mr-1.5">{totalCompleted}</span>
            <span>certificates issued</span>
          </div>
        </div>
      </div>

      {/* NGO Verification & Legitimacy Trust Layer */}
      <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
        isVerified
          ? 'bg-gradient-to-r from-emerald-50/80 via-emerald-50/30 to-white border-emerald-300 shadow-2xs'
          : 'bg-gradient-to-r from-amber-50/80 via-amber-50/30 to-white border-amber-300 shadow-2xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isVerified ? 'bg-emerald-700 text-white' : 'bg-amber-600 text-white'
            }`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isVerified ? 'bg-emerald-800 text-white' : 'bg-amber-700 text-white'
                }`}>
                  {isVerified ? '✓ Legitimacy Verified NGO' : 'Verification Required'}
                </span>
                {isVerified && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Trust Score: {trustScore}%
                  </span>
                )}
                {activeVerif.ngo_darpan_id && (
                  <span className="font-mono text-[11px] font-bold text-[#0C3B2E] bg-white px-2 py-0.5 rounded border border-[#0C3B2E]/20">
                    DARPAN: {activeVerif.ngo_darpan_id}
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-sm sm:text-base text-[#141C18]">
                {isVerified
                  ? `${activeVerif.organization_name || activeVerif.name || 'Your Non-Profit'} is Verified on NITI Aayog Portal`
                  : 'Verify Your NGO Legitimacy to Build Collegiate Trust'}
              </h3>
              
              <p className="text-xs text-[#57655F] mt-0.5 max-w-2xl leading-relaxed">
                {isVerified
                  ? `Your organization holds authenticated ${activeVerif.registration_type || 'charitable trust'} registration. Student volunteers from IITs, SRM, VIT, and state colleges see your verified trust badge.`
                  : 'Submit your NITI Aayog NGO-DARPAN ID, 80G/12A certificates, and Trustee details. Verified NGOs receive prominent placement and institutional confidence.'}
              </p>

              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-stone-200/70 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>80G Tax Exemption: {activeVerif.tax_exemption_80g ? 'Active' : 'Unclaimed'}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>12A Registration: {activeVerif.tax_exemption_12a ? 'Active' : 'Standard'}</span>
                </span>
                {activeVerif.trustee_name && (
                  <>
                    <span>·</span>
                    <span className="text-[#57655F]">
                      Signatory: <strong className="text-[#141C18]">{activeVerif.trustee_name}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            {isVerified && (
              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <span>View Legitimacy Badge</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowVerificationModal(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isVerified
                  ? 'bg-[#0C3B2E] hover:bg-[#07251D] text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerified ? 'Edit Credentials' : 'Verify NGO Legitimacy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Form Modal */}
      {showCreateForm && (
        <OpportunityForm
          initialData={editingOpp}
          onSubmit={async (data) => {
            if (editingOpp) {
              await onUpdateOpportunity(editingOpp.id, data);
            } else {
              await onCreateOpportunity(data);
            }
            setShowCreateForm(false);
            setEditingOpp(null);
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingOpp(null);
          }}
        />
      )}

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities posted yet"
          description="Create your first volunteer or internship initiative to connect with student teams."
          actionLabel="Create opportunity"
          onAction={() => setShowCreateForm(true)}
        />
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const isExpanded = expandedOppId === opp.id;
            const currentTab = activeTabByOpp[opp.id] || 'applicants';
            const apps = oppApplications[opp.id] || [];
            const teams = oppTeams[opp.id] || [];
            const isClosed = opp.status === 'closed';

            const formattedDate = new Date(opp.date).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={opp.id}
                className="bg-white rounded-lg border border-[#E8E2D5] overflow-hidden"
              >
                {/* Header card row */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <StatusBadge status={opp.status} />
                      <span className="text-xs text-[#5C5C5C]">
                        {opp.city} · {formattedDate}
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#1C1C1C]">
                      {opp.title}
                    </h3>

                    {/* Venue Address & Duration Strip */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5C5C5C]">
                      {opp.address && (
                        <span className="font-medium text-[#1C1C1C] truncate max-w-md">
                          📍 {opp.address}
                        </span>
                      )}
                      <span>
                        ⏱ <strong>{opp.duration || '4 Weeks'}</strong> ({opp.hours || 20} hrs)
                      </span>
                      {opp.schedule && (
                        <span className="text-[#1B4D3E]">
                          🗓 {opp.schedule}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#5C5C5C]">
                      <span>
                        Capacity: <strong className="text-[#1C1C1C]">{opp.appliedCount}</strong> / {opp.capacity} filled
                      </span>
                      <span className="text-[#D8D2C4]">·</span>
                      <span className="text-[#1B4D3E] font-medium">
                        {teams.length} college squad{teams.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingOpp(opp);
                        setShowCreateForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#FAF7F2] text-[#1C1C1C] border border-[#E8E2D5] text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {!isClosed && (
                      <button
                        onClick={() => onCloseOpportunity(opp.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <FolderLock className="w-3.5 h-3.5" />
                        <span>Close</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(opp.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#13392D] text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide' : 'View applicants & teams'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Applicants vs Teams */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-[#E8E2D5] bg-[#FAF7F2]/50">
                    
                    {/* Clean Sub-Tabs */}
                    <div className="flex items-center gap-4 mb-4 border-b border-[#E8E2D5] pb-2 text-xs">
                      <button
                        onClick={() => setTab(opp.id, 'applicants')}
                        className={`py-1 font-medium transition-colors cursor-pointer ${
                          currentTab === 'applicants'
                            ? 'text-[#1B4D3E] border-b-2 border-[#1B4D3E] font-semibold'
                            : 'text-[#5C5C5C] hover:text-[#1C1C1C]'
                        }`}
                      >
                        Individual applicants ({apps.length})
                      </button>

                      <button
                        onClick={() => setTab(opp.id, 'teams')}
                        className={`py-1 font-medium transition-colors cursor-pointer ${
                          currentTab === 'teams'
                            ? 'text-[#1B4D3E] border-b-2 border-[#1B4D3E] font-semibold'
                            : 'text-[#5C5C5C] hover:text-[#1C1C1C]'
                        }`}
                      >
                        Grouped campus teams ({teams.length})
                      </button>
                    </div>

                    {/* Tab Contents */}
                    {currentTab === 'applicants' ? (
                      <div>
                        <ApplicantList
                          applications={apps}
                          onMarkComplete={onMarkComplete}
                          loadingActionId={loadingActionId}
                        />
                      </div>
                    ) : (
                      <div>
                        <TeamList teams={teams} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Submission Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-stone-300 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0C3B2E] to-[#134E3E] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    NGO Legitimacy & Regulatory Verification
                  </h3>
                  <p className="text-xs text-emerald-200">
                    NITI Aayog NGO-DARPAN & Statutory Compliance Audit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Test Autofill Strip */}
            <div className="px-5 py-2.5 bg-stone-100 border-b border-stone-200 flex flex-wrap items-center gap-2 text-xs shrink-0">
              <span className="font-semibold text-stone-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Test Autofill:</span>
              </span>
              <button
                type="button"
                onClick={() => handleVerifPreset('niti')}
                className="px-2 py-0.5 rounded bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                NITI Aayog Registered Trust
              </button>
              <button
                type="button"
                onClick={() => handleVerifPreset('sec8')}
                className="px-2 py-0.5 rounded bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Section 8 Non-Profit (MCA)
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleVerifSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {verificationFeedback && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  verificationFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}>
                  {verificationFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{verificationFeedback.message}</span>
                </div>
              )}

              {/* NITI Aayog NGO-DARPAN ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-900 block">
                    NITI Aayog NGO-DARPAN Unique ID *
                  </label>
                  <span className="text-[10px] text-stone-500 font-mono">Format: ST/YYYY/NNNNNNN</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g., TN/2018/0201948 or DL/2016/0114829"
                  value={verifForm.ngo_darpan_id}
                  onChange={(e) => setVerifForm({ ...verifForm, ngo_darpan_id: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded font-mono font-semibold text-[#0C3B2E] uppercase focus:outline-none focus:border-[#0C3B2E]"
                />
                <span className="text-[10px] text-stone-500 block mt-1">
                  Issued by central Government of India portal for registered voluntary organizations.
                </span>
              </div>

              {/* Legal Entity Registration Type & Reg Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-800 block mb-1">
                    Registration Entity Type *
                  </label>
                  <select
                    value={verifForm.registration_type}
                    onChange={(e) => setVerifForm({ ...verifForm, registration_type: e.target.value })}
                    className="w-full px-2.5 py-2 border rounded bg-white text-stone-800"
                  >
                    <option value="Registered Public Charitable Trust">Public Charitable Trust</option>
                    <option value="Section 8 Non-Profit Company (MCA)">Section 8 Non-Profit Company (MCA)</option>
                    <option value="Registered Society (Societies Reg. Act)">Registered Society</option>
                    <option value="University Statutory Outreach Cell">University Statutory Outreach Cell</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-800 block mb-1">
                    Registration Certificate Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., TN-SOC-2018-8819 or U85300KA"
                    value={verifForm.registration_number}
                    onChange={(e) => setVerifForm({ ...verifForm, registration_number: e.target.value })}
                    className="w-full px-2.5 py-2 border rounded font-mono"
                  />
                </div>
              </div>

              {/* Authorised Trustee / Signatory */}
              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Authorised Trustee / Lead Signatory *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. C. Muthamizhchelvan / Radhika Ramaswamy"
                  value={verifForm.trustee_name}
                  onChange={(e) => setVerifForm({ ...verifForm, trustee_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                <span className="text-[10px] text-stone-500 block mt-1">
                  Appears on student certificates of completion and official institutional squad pairings.
                </span>
              </div>

              {/* Tax Exemptions & FCRA Checkboxes */}
              <div className="p-3 bg-stone-50 border rounded-lg space-y-2">
                <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wider">
                  Statutory Tax Exemptions & Audit Certifications
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                    <input
                      type="checkbox"
                      checked={verifForm.tax_exemption_80g}
                      onChange={(e) => setVerifForm({ ...verifForm, tax_exemption_80g: e.target.checked })}
                      className="rounded text-[#0C3B2E] focus:ring-0"
                    />
                    <span>80G Tax Exemption</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                    <input
                      type="checkbox"
                      checked={verifForm.tax_exemption_12a}
                      onChange={(e) => setVerifForm({ ...verifForm, tax_exemption_12a: e.target.checked })}
                      className="rounded text-[#0C3B2E] focus:ring-0"
                    />
                    <span>12A Non-Profit</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                    <input
                      type="checkbox"
                      checked={verifForm.fcra_registered}
                      onChange={(e) => setVerifForm({ ...verifForm, fcra_registered: e.target.checked })}
                      className="rounded text-[#0C3B2E] focus:ring-0"
                    />
                    <span>FCRA Certified</span>
                  </label>
                </div>
              </div>

              {/* Audit / Compliance Notes */}
              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  Audit Notes & Annual Return Confirmation
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Annual audit filed for 2025-2026. Empanelled with UGC and state social welfare department."
                  value={verifForm.verification_notes}
                  onChange={(e) => setVerifForm({ ...verifForm, verification_notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 border rounded text-stone-600 hover:bg-stone-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="px-5 py-2 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submittingVerification ? 'Auditing Credentials...' : 'Submit & Verify NGO'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Legitimacy Audit Report Modal */}
      {showAuditModal && (
        <NgoVerificationModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          organization={{
            ...activeVerif,
            verification_status: activeVerif.verification_status || 'verified',
            trust_score: trustScore
          }}
        />
      )}
    </div>
  );
}
