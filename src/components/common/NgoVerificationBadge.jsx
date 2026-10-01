import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Building2, HelpCircle } from 'lucide-react';
import NgoVerificationModal from './NgoVerificationModal.jsx';

export default function NgoVerificationBadge({
  organization,
  verificationStatus = 'verified',
  trustScore = 95,
  size = 'sm',
  showModalOnClick = true,
  className = ''
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const status = organization?.verification_status || verificationStatus;
  const isGovtReg = status === 'govt_registered';
  const isVerified = status === 'verified' || isGovtReg;
  const score = organization?.trust_score || trustScore || 95;

  const handleClick = (e) => {
    if (showModalOnClick) {
      e.preventDefault();
      e.stopPropagation();
      setModalOpen(true);
    }
  };

  if (!isVerified) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200 ${className}`}>
        <span>Community Group</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs group ${
          isGovtReg
            ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/80'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80'
        } ${className}`}
        title="Click to view official NITI Aayog NGO-Darpan & Legitimacy Audit Report"
      >
        <ShieldCheck className={`w-3 h-3 ${isGovtReg ? 'text-blue-700' : 'text-emerald-700'}`} />
        <span className="text-[10px] font-bold tracking-tight">
          {isGovtReg ? 'Govt Registered' : 'Verified Legit NGO'}
        </span>
        <span className={`text-[9px] font-bold px-1 rounded ${isGovtReg ? 'bg-blue-200/60 text-blue-800' : 'bg-emerald-200/60 text-emerald-800'}`}>
          {score}%
        </span>
      </button>

      {modalOpen && (
        <NgoVerificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          organization={organization || {
            verification_status: status,
            trust_score: score
          }}
        />
      )}
    </>
  );
}
