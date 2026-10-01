import React, { useState, useEffect } from 'react';
import { getAllSquadsNetwork } from '../../firebase/firestore.js';
import { Users, Check, Building2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CampusSquadsNetwork() {
  const [squads, setSquads] = useState([]);
  const [programmeFilter, setProgrammeFilter] = useState('All');
  const [institutionFilter, setInstitutionFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSquadsNetwork().then((data) => {
      setSquads(data || []);
      setLoading(false);
    });
  }, []);

  const distinctProgrammes = Array.from(new Set(squads.map((s) => s.opportunityTitle).filter(Boolean)));
  const distinctInstitutions = Array.from(new Set(squads.map((s) => s.college).filter(Boolean)));

  const filteredSquads = squads
    .filter((s) => {
      const matchProg = programmeFilter === 'All' || s.opportunityTitle === programmeFilter;
      const matchInst = institutionFilter === 'All' || s.college === institutionFilter;
      return matchProg && matchInst;
    })
    .sort((a, b) => {
      const aIsSrm = a.college?.includes('SRM');
      const bIsSrm = b.college?.includes('SRM');
      if (aIsSrm && !bIsSrm) return -1;
      if (!aIsSrm && bIsSrm) return 1;
      return 0;
    });

  return (
    <section className="py-16 sm:py-20 border-b border-[#0C3B2E]/10 bg-[#FBF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Clean Left Alignment and Balanced Sizing */}
        <div className="max-w-3xl mb-10 sm:mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#0C3B2E] mb-2 font-display">
            Institutional Squad Network
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#141C18] uppercase leading-tight">
            Collegiate Squads<br />
            <span className="text-[#FF5A1F]">Active on the Ground</span>.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#57655F] leading-relaxed font-normal">
            When students from SRM Kattankulathur or regional partner universities join an initiative, Sangam organizes them into automatic cohorts. Explore all formed collegiate squads below.
          </p>
        </div>

        {/* Filter Strip */}
        <div className="mb-8 p-4 rounded-lg border border-[#0C3B2E]/15 bg-white/70 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#57655F] mb-1">
                Filter by Programme
              </label>
              <select
                value={programmeFilter}
                onChange={(e) => setProgrammeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0C3B2E]/20 rounded text-xs text-[#141C18] focus:outline-none cursor-pointer"
              >
                <option value="All">All Programmes</option>
                {distinctProgrammes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#57655F] mb-1">
                Filter by Institution
              </label>
              <select
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#0C3B2E]/20 rounded text-xs text-[#141C18] focus:outline-none cursor-pointer"
              >
                <option value="All">All Institutions</option>
                {distinctInstitutions.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst.includes('SRM') ? '★ ' + inst : inst}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => setInstitutionFilter('SRM Kattankulathur (KTR)')}
                className="text-xs font-bold text-[#FF5A1F] hover:underline cursor-pointer"
              >
                SRM Only
              </button>
              <span className="font-mono text-xs font-semibold text-[#0C3B2E] tabular-nums">
                {filteredSquads.length} Squads
              </span>
            </div>

          </div>
        </div>

        {/* Squad List */}
        <div className="space-y-6">
          {filteredSquads.map((squad, idx) => (
            <div
              key={squad.id || idx}
              className="p-6 sm:p-8 rounded-lg border border-[#1B4D3E]/15 bg-white transition-all hover:border-[#1B4D3E]/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#1B4D3E]/10">
                <div>
                  <div className="text-[11px] font-semibold text-[#6F756F] uppercase tracking-wider">
                    Programme: <span className="text-[#1D2421] font-bold">{squad.opportunityTitle}</span> ({squad.opportunityCity})
                  </div>
                  <h3 className="font-display text-2xl font-black text-[#1B4D3E] mt-1">
                    {squad.college}
                  </h3>
                  <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 mt-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Matched through their institution</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-[#E9762B] bg-[#E9762B]/10 px-2.5 py-1 rounded">
                    SQUAD {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="text-xs text-[#6F756F] mt-1.5 tabular-nums">
                    {squad.members.length} members
                  </div>
                </div>
              </div>

              {/* Members Grid (Initials + Name + Branch) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                {squad.members.map((member) => {
                  const initials = member.name
                    ? member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'SG';
                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded bg-[#FAF7F2] border border-[#1B4D3E]/10 flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-display font-bold text-xs shrink-0 mt-0.5">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#1D2421] truncate">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-[#6F756F] truncate">
                          {member.course || 'Student Volunteer'}
                        </div>
                        {member.skills && member.skills.length > 0 && (
                          <div className="text-[10px] text-[#1B4D3E] mt-1 truncate">
                            {member.skills.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
