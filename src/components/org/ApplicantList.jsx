import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge.jsx';
import { Award, Building2, Users } from 'lucide-react';

export default function ApplicantList({
  applications = [],
  onMarkComplete,
  loadingActionId
}) {
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('ALL');

  if (!applications || applications.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#5C5C5C] bg-white rounded-md border border-[#E8E2D5]">
        No student applications received yet for this opportunity.
      </div>
    );
  }

  // Calculate dynamic collegiate breakdown from SQL application data
  const collegeCounts = {};
  applications.forEach(app => {
    const col = app.user?.college || app.userCollege || 'Independent';
    collegeCounts[col] = (collegeCounts[col] || 0) + 1;
  });

  const collegeSummary = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1]);

  const filteredApps = selectedCollegeFilter === 'ALL'
    ? applications
    : applications.filter(app => (app.user?.college || app.userCollege) === selectedCollegeFilter);

  return (
    <div className="space-y-4">
      {/* College Breakdown Header from SQL */}
      <div className="p-3.5 bg-[#FAF7F2] rounded-md border border-[#E8E2D5]/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1B4D3E] uppercase tracking-wider mb-2">
          <Building2 className="w-3.5 h-3.5" />
          <span>Collegiate Squad Breakdown ({applications.length} Total Applicants)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCollegeFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
              selectedCollegeFilter === 'ALL'
                ? 'bg-[#1B4D3E] text-white font-semibold'
                : 'bg-white text-[#1C1C1C] border border-[#E8E2D5] hover:border-[#1B4D3E]'
            }`}
          >
            All Colleges ({applications.length})
          </button>

          {collegeSummary.map(([colName, count]) => (
            <button
              key={colName}
              type="button"
              onClick={() => setSelectedCollegeFilter(colName)}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCollegeFilter === colName
                  ? 'bg-[#1B4D3E] text-white font-semibold'
                  : 'bg-white text-[#1C1C1C] border border-[#E8E2D5] hover:border-[#1B4D3E]'
              }`}
            >
              <span>{colName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCollegeFilter === colName ? 'bg-white/20 text-white' : 'bg-[#E8E2D5] text-[#1B4D3E]'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applicant Cards List */}
      <div className="space-y-2">
        {filteredApps.map((app) => {
          const student = app.user || {
            name: app.studentName || app.userName || 'Student',
            college: app.studentCollege || app.userCollege || '',
            homeCity: app.studentCity || app.userCity || '',
            email: app.studentEmail || app.userEmail || '',
            skills: app.studentSkills || app.userSkills || []
          };
          const isCompleted = app.status === 'completed';
          const isApplied = app.status === 'applied';

          return (
            <div
              key={app.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md bg-white border border-[#E8E2D5] hover:border-[#1B4D3E]/30 transition-colors"
            >
              {/* Student info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#1C1C1C]">
                    {student.name}
                  </span>
                  <StatusBadge status={app.status} />
                  {app.team && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#EBF3EF] text-[#1B4D3E] font-medium">
                      Squad: {app.team.name || app.team.college}
                    </span>
                  )}
                </div>

                <div className="text-xs text-[#5C5C5C]">
                  <span className="font-semibold text-[#1B4D3E]">{student.college || 'Institution'}</span>
                  <span className="mx-1.5 text-[#D8D2C4]">·</span>
                  <span>{student.homeCity || student.city || 'City'}</span>
                  {student.email && (
                    <>
                      <span className="mx-1.5 text-[#D8D2C4]">·</span>
                      <span className="text-[#888]">{student.email}</span>
                    </>
                  )}
                </div>

                {/* Skills */}
                {student.skills && student.skills.length > 0 && (
                  <div className="text-[11px] text-[#5C5C5C] mt-1.5">
                    <span className="text-[#1C1C1C] font-medium">Skills: </span>
                    <span>{Array.isArray(student.skills) ? student.skills.join('  ·  ') : student.skills}</span>
                  </div>
                )}
              </div>

              {/* Action: Completion & Certification */}
              <div className="flex items-center justify-end shrink-0">
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4D3E] bg-[#EBF3EF] px-3 py-1.5 rounded">
                    <Award className="w-3.5 h-3.5" />
                    <span>Certified & Completed</span>
                  </div>
                ) : isApplied ? (
                  <button
                    onClick={() => onMarkComplete(app.id)}
                    disabled={loadingActionId === app.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B4D3E] hover:bg-[#13392D] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{loadingActionId === app.id ? 'Certifying...' : 'Mark complete & issue certificate'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-[#5C5C5C] italic">Withdrawn</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
