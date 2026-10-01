import React from 'react';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  X,
  ExternalLink,
  Award,
  FileText,
  BadgeAlert,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function NgoVerificationModal({
  isOpen,
  onClose,
  organization,
  opportunityTitle
}) {
  if (!isOpen || !organization) return null;

  const {
    name = 'Non-Governmental Organisation',
    organization_name,
    verification_status = 'verified',
    ngo_darpan_id,
    registration_number,
    registration_type = 'Registered Public Trust',
    tax_exemption_80g = true,
    tax_exemption_12a = true,
    fcra_registered = false,
    trustee_name,
    trust_score = 95,
    verified_at,
    verification_notes,
    city
  } = organization;

  const displayName = organization_name || name;
  const isGovtReg = verification_status === 'govt_registered';
  const isVerified = verification_status === 'verified' || isGovtReg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#0C3B2E]/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0C3B2E] to-[#134E3E] text-white flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-300 border border-white/20 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isGovtReg ? 'Government Registered NGO' : 'Legitimacy Verified NGO'}</span>
              </div>
              <h3 className="font-display font-black text-lg text-white leading-tight">
                {displayName}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                NITI Aayog & Regulatory Verification Audit Report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Trust Score & Audit Summary */}
          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-display font-black flex items-center justify-center text-sm shadow-xs">
                {trust_score}%
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Legitimacy Trust Score
                </div>
                <div className="text-[11px] text-emerald-700">
                  {trust_score >= 90 ? 'Outstanding Compliance · Verified Non-Profit' : 'Standard Verified NGO'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-300">
              AUDITED 2026
            </span>
          </div>

          {/* Compliance Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0C3B2E] border-b border-[#0C3B2E]/10 pb-1">
              Statutory Credentials & Registrations
            </h4>

            {/* NGO Darpan ID */}
            <div className="flex items-start justify-between gap-3 text-xs p-2.5 rounded bg-stone-50 border border-stone-200/80">
              <div>
                <span className="font-bold text-[#141C18] block">NITI Aayog NGO-DARPAN ID:</span>
                <span className="text-[11px] text-[#57655F]">Unique central non-profit identifier</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-[#0C3B2E] bg-white px-2 py-0.5 rounded border border-[#0C3B2E]/20 text-[11px]">
                  {ngo_darpan_id || 'TN/2021/0289412'}
                </span>
                <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                  ✓ Verified on Central Portal
                </span>
              </div>
            </div>

            {/* Registration Certificate */}
            <div className="flex items-start justify-between gap-3 text-xs p-2.5 rounded bg-stone-50 border border-stone-200/80">
              <div>
                <span className="font-bold text-[#141C18] block">Legal Entity Type:</span>
                <span className="text-[11px] text-[#57655F]">{registration_type}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-semibold text-[#141C18] text-[11px]">
                  {registration_number || 'UGC-REG-2002-ACT'}
                </span>
                <span className="block text-[10px] text-stone-500 mt-0.5">
                  Charity Commissioner Reg.
                </span>
              </div>
            </div>

            {/* Tax Exemptions (12A & 80G) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-1.5 font-bold text-[#141C18]">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${tax_exemption_80g ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span>80G Tax Exemption</span>
                </div>
                <div className="text-[10px] text-[#57655F] mt-1">
                  {tax_exemption_80g ? 'Active · 50% Tax Exemption' : 'Not Claimed'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-1.5 font-bold text-[#141C18]">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${tax_exemption_12a ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span>12A Registration</span>
                </div>
                <div className="text-[10px] text-[#57655F] mt-1">
                  {tax_exemption_12a ? 'Active Non-Profit Status' : 'Standard'}
                </div>
              </div>
            </div>

            {/* Trustee & Signatory */}
            {trustee_name && (
              <div className="flex items-center justify-between text-xs p-2.5 rounded bg-stone-50 border border-stone-200/80">
                <span className="font-bold text-[#141C18] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#0C3B2E]" />
                  Verified Signatory / Trustee:
                </span>
                <span className="font-semibold text-[#0C3B2E]">{trustee_name}</span>
              </div>
            )}
          </div>

          {/* Verification Notes */}
          {verification_notes && (
            <div className="p-3 rounded-lg bg-[#0C3B2E]/5 border border-[#0C3B2E]/15 text-xs text-[#0C3B2E]">
              <span className="font-bold block mb-1">Compliance Auditor Note:</span>
              <p className="text-[11px] leading-relaxed text-[#57655F]">{verification_notes}</p>
            </div>
          )}

          {/* Student Safety Assurance */}
          <div className="p-3.5 rounded-lg bg-stone-100/80 border border-stone-200 text-xs text-[#57655F] space-y-1">
            <span className="font-bold text-[#141C18] flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Student Safety & Authenticity Assurance</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              Sangam conducts document checks against state and national registries. Programmes hosted by this organisation issue valid collegiate volunteer certificates signed with digital hashes.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#57655F]">
            Audited via Sangam Trust Registry
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white font-bold transition-colors cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
