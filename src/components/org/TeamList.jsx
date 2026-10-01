import React from 'react';

export default function TeamList({ teams = [] }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[#5C5C5C] bg-white rounded-md border border-[#E8E2D5]">
        No teams formed yet. Teams are created automatically as students apply from various colleges.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team, tIdx) => {
        const members = team.members || [];

        return (
          <div
            key={team.id || tIdx}
            className="p-4 rounded-md bg-white border border-[#E8E2D5]"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 mb-3 border-b border-[#F0EBE0]">
              <div>
                <h4 className="font-heading text-base font-bold text-[#1C1C1C]">
                  {team.college} Team
                </h4>
                <div className="text-xs text-[#5C5C5C]">
                  Base: {team.city || 'Regional'}
                </div>
              </div>

              <div className="text-xs font-medium text-[#1B4D3E]">
                {members.length} {members.length === 1 ? 'student' : 'students'} grouped
              </div>
            </div>

            {/* Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {members.map((member, mIdx) => (
                <div
                  key={member.id || mIdx}
                  className="p-2 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-xs"
                >
                  <div className="font-semibold text-[#1C1C1C]">
                    {member.name}
                  </div>
                  <div className="text-[11px] text-[#5C5C5C]">
                    {member.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
