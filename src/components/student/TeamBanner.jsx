import React from 'react';

export default function TeamBanner({ team, teamMembers = [], currentUserId, college }) {
  if (!team && (!teamMembers || teamMembers.length === 0)) {
    return null;
  }

  const collegeName = college || team?.college || 'Your College';
  const otherMembers = teamMembers.filter((m) => m && m.id !== currentUserId);
  const totalCount = teamMembers.length || 1;

  return (
    <div className="border border-[#1B4D3E]/15 rounded-lg p-6 sm:p-8 bg-[#F5EFEB]/40 mb-8">
      {/* Top Header */}
      <div className="pb-4 border-b border-[#1B4D3E]/10 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E9762B]">
            Your Team
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-[#1B4D3E] mt-0.5 uppercase">
            {collegeName}
          </h3>
        </div>
        <div className="font-mono text-xs font-bold text-[#1D2421]">
          {totalCount} {totalCount === 1 ? 'STUDENT' : 'STUDENTS'}
        </div>
      </div>

      {/* Member Roster with Thin Horizontal Separator */}
      <div className="py-4 divide-y divide-[#1B4D3E]/10 text-xs">
        <div className="py-2.5 flex items-center justify-between">
          <span className="font-bold text-[#1D2421]">You</span>
          <span className="text-[#6F756F] font-mono">Matched Teammate</span>
        </div>

        {otherMembers.map((member, idx) => {
          const branch = member.course || member.skills?.[0] || 'Volunteer';
          return (
            <div key={member.id || idx} className="py-2.5 flex items-center justify-between">
              <span className="font-semibold text-[#1D2421]">{member.name}</span>
              <span className="text-[#6F756F] font-mono">{branch}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#1B4D3E]/10 text-[11px] font-bold uppercase tracking-wider text-[#1B4D3E] flex items-center justify-between">
        <span>Matched through your institution</span>
        <span>Sangam Campus Squad</span>
      </div>
    </div>
  );
}
