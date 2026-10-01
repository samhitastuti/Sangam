import React, { useState } from 'react';
import { ArrowRight, Sparkles, Building2, MapPin, Users, Award, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EditorialHero({ onExploreClick }) {
  const [selectedDemoSquad, setSelectedDemoSquad] = useState('srm');

  return (
    <section className="relative border-b border-[#0C3B2E]/10 bg-[#FBF9F5] overflow-hidden">
      
      {/* 1. Full-Width Campus Intelligence & Network Status Bar (Replaces empty corner space with live status) */}
      <div className="w-full border-b border-[#0C3B2E]/10 bg-white/60 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            
            {/* Left Corner: Campus Chapter Anchor */}
            <div className="flex items-center gap-2 text-[#0C3B2E] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A1F]" />
              </span>
              <span className="font-bold text-[#0C3B2E]">SRM Kattankulathur (KTR) Flagship Hub</span>
              <span className="text-[#0C3B2E]/30 hidden md:inline">|</span>
              <span className="text-[#57655F] hidden md:inline">Chennai & Chengalpattu Cohorts Active</span>
            </div>

            {/* Right Corner: Network Live Metrics */}
            <div className="flex items-center gap-4 text-[11px] font-medium text-[#57655F]">
              <span className="hidden lg:inline text-[#0C3B2E]/40 font-mono">NODE: KTR-IND-01</span>
              <span className="flex items-center gap-1.5 font-bold text-[#0C3B2E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0C3B2E]" />
                <span>Automated Teaming Engine Active</span>
              </span>
              <span className="text-[#0C3B2E]/20">·</span>
              <span className="font-semibold text-[#141C18]">
                <strong className="text-[#FF5A1F] font-bold">38</strong> Active Squads
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Main Hero Content Container (Normalized to max-w-7xl to eliminate corner dead space) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          
          {/* Left Column: Bold Editorial Headline, Mission & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Campus Kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0C3B2E]/8 border border-[#0C3B2E]/15 text-xs font-bold text-[#0C3B2E] tracking-normal">
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
              <span>Collegiate Volunteer & Internship Network</span>
              <span className="text-slate-400">·</span>
              <span className="text-[#FF5A1F] font-bold">SRM KTR Chapter</span>
            </div>

            {/* Refined Headline: Confident, high-readability modern display */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-[#0F172A] leading-[1.12]">
              Find causes worth <span className="text-[#0C3B2E]">showing up</span> for.
              <span className="text-[#FF5A1F] block text-2xl sm:text-3xl lg:text-4xl font-extrabold mt-2">
                Together with your campus squad.
              </span>
            </h1>

            {/* Editorial Supporting Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Sangam connects student volunteers to high-impact community drives, ecological audits, and STEM outreach. When you apply, you are automatically paired into squads with fellow students from <strong className="text-slate-900 font-bold">SRM Kattankulathur</strong>. Zero solo anxiety.
            </p>

            {/* Direct Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to="/opportunities"
                className="px-6 py-3.5 rounded-lg bg-[#0C3B2E] hover:bg-[#07251D] text-white text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <span>Explore Open Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#campus-squads"
                className="px-5 py-3.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-sm font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs hover:bg-slate-50"
              >
                <span>See SRM Campus Squads</span>
                <span className="text-xs text-[#FF5A1F]">→</span>
              </a>

              <Link
                to="/stories"
                className="px-3.5 py-3.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0C3B2E] transition-colors inline-flex items-center gap-1"
              >
                <span>Stories & Dispatches</span>
              </Link>
            </div>

            {/* Micro Stats Row */}
            <div className="pt-6 flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-600 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0C3B2E]" />
                <span><strong className="text-slate-900 font-bold text-sm sm:text-base">1,420+</strong> SRM volunteers</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FF5A1F]" />
                <span><strong className="text-slate-900 font-bold text-sm sm:text-base">38</strong> active squads</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span><strong className="text-slate-900 font-bold text-sm sm:text-base">100%</strong> verified certificates</span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Teaming Hub + Photographic Media (5 cols - fills the corner solidly) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Live Teaming Hub Spotlight Card (Anchors the top-right corner with domain functionality) */}
            <div className="rounded-lg border border-[#0C3B2E]/20 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-[#0C3B2E] text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Live Teaming Engine Preview</span>
                </div>
                <span className="text-[10px] font-mono bg-white/15 px-2 py-0.5 rounded text-white font-semibold">
                  SRM KTR
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A1F]">
                      Active Programme Pairing
                    </div>
                    <div className="text-sm font-bold text-[#141C18] leading-snug">
                      Digital Literacy Outreach
                    </div>
                    <div className="text-xs text-[#57655F] mt-0.5">
                      North Chennai Learning Centers · Weekly
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                    Squad Forming
                  </span>
                </div>

                {/* Squad Members Roster */}
                <div className="bg-[#FBF9F5] rounded border border-[#0C3B2E]/10 p-2.5 space-y-2 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#57655F] flex items-center justify-between">
                    <span>Matched SRM Cohort (4/5 Spots)</span>
                    <span className="text-[#0C3B2E] font-semibold">Auto-grouped</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#141C18] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Karthik Subramanian
                      </span>
                      <span className="text-[#57655F]">B.Tech CSE (Lead)</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#141C18] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Divya Sundaram
                      </span>
                      <span className="text-[#57655F]">B.Tech Biotech</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#141C18] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Sneha Krishnan
                      </span>
                      <span className="text-[#57655F]">B.Tech CSE</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#0C3B2E]/10 text-[#FF5A1F] font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-ping" />
                        Your Spot (Pending Application)
                      </span>
                      <span className="text-[10px] bg-[#FF5A1F]/10 px-1.5 py-0.5 rounded">
                        Auto-joins here
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#57655F]">
                  <span>Zero solo volunteering. One-click teaming.</span>
                  <Link
                    to="/opportunities/opp_digital_literacy"
                    className="font-bold text-[#0C3B2E] hover:underline flex items-center gap-1"
                  >
                    <span>View Programme</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Primary Main Photograph */}
            <div className="relative rounded-lg overflow-hidden border border-[#0C3B2E]/15 shadow-sm bg-stone-100 group">
              <img
                src="/src/assets/images/srm_hero_outreach_1790532217456.jpg"
                alt="SRM University student volunteers engaged in Chennai community outreach"
                referrerPolicy="no-referrer"
                className="w-full h-48 sm:h-56 lg:h-52 xl:h-60 object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3.5 text-white">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623] font-display">
                  On the Ground · Chennai Field Drives
                </div>
                <div className="text-xs sm:text-sm font-bold mt-0.5 line-clamp-1">
                  Community Coding Labs & Coastal Cleanups
                </div>
              </div>
            </div>

            {/* Secondary Dual Photographic Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-md overflow-hidden border border-[#0C3B2E]/10 h-24 sm:h-28 bg-stone-200 group">
                <img
                  src="/src/assets/images/srm_coastal_cleanup_1790532259292.jpg"
                  alt="SRM Green Warriors coastal cleanup"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-bold text-white uppercase tracking-wider line-clamp-1">
                  Kovalam Beach Drive
                </span>
              </div>

              <div className="relative rounded-md overflow-hidden border border-[#0C3B2E]/10 h-24 sm:h-28 bg-stone-200 group">
                <img
                  src="/src/assets/images/srm_stem_robotics_1790532269549.jpg"
                  alt="SRM STEM Robotics mentoring"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-bold text-white uppercase tracking-wider line-clamp-1">
                  Robotics Mentoring
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Bottom Ticker / Strip: Full-Width Institutional Features */}
        <div className="mt-10 sm:mt-12 pt-8 border-t border-[#0C3B2E]/10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white border border-[#0C3B2E]/10 shadow-2xs hover:border-[#0C3B2E]/30 transition-colors">
            <div className="w-10 h-10 rounded bg-[#0C3B2E] text-white flex items-center justify-center font-display font-black text-xs shrink-0 mt-0.5">
              SRM
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#FF5A1F]">
                Flagship Campus Chapter
              </div>
              <p className="text-xs text-[#141C18] mt-1 leading-snug">
                SRM Kattankulathur Tech & Green squads lead active field drives across Chennai, Chengalpattu & Kovalam.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white border border-[#0C3B2E]/10 shadow-2xs hover:border-[#0C3B2E]/30 transition-colors">
            <div className="w-10 h-10 rounded bg-[#FF5A1F] text-white flex items-center justify-center font-display font-black text-xs shrink-0 mt-0.5">
              42k
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0C3B2E]">
                Verified Field Hours
              </div>
              <p className="text-xs text-[#141C18] mt-1 leading-snug">
                42,000+ collegiate hours completed across verified non-profit partners and community centers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-lg bg-white border border-[#0C3B2E]/10 shadow-2xs hover:border-[#0C3B2E]/30 transition-colors">
            <div className="w-10 h-10 rounded bg-[#07251D] text-[#F5A623] flex items-center justify-center font-display font-black text-xs shrink-0 mt-0.5">
              100%
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#57655F]">
                Institutional Auto-Pairing
              </div>
              <p className="text-xs text-[#141C18] mt-1 leading-snug">
                Zero solo signups. Every applicant joins programmes directly with peers from their own institution.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
