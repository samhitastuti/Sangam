import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { ArrowRight, QrCode } from 'lucide-react';
import GeofencedCheckinModal from '../checkin/GeofencedCheckinModal.jsx';

export default function MyApplications({ applications = [], onWithdraw, withdrawingId }) {
  const [checkinOpp, setCheckinOpp] = useState(null);

  if (!applications || applications.length === 0) {
    return (
      <EmptyState
        title="No volunteer applications yet"
        description="Explore open initiatives, join campus squads, and earn verified credentials for community impact."
        actionLabel="Explore opportunities"
        actionTo="/browse"
      />
    );
  }

  return (
    <>
      <div className="divide-y divide-[#1B4D3E]/10">
        {applications.map((app) => {
          const opp = app.opportunity;
          if (!opp) return null;

          const isApplied = app.status === 'applied';
          const isCompleted = app.status === 'completed';

          const teamMembers = app.teamMembers || [];
          const otherMembers = teamMembers.filter((m) => m.id !== app.userId);

          const formattedDate = new Date(opp.date).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={app.id}
              className="py-6 hover:bg-[#1B4D3E]/[0.02] transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Left Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6F756F]">
                    <span className="font-bold text-[#1B4D3E] uppercase tracking-wider">
                      {opp.orgName}
                    </span>
                    <span>·</span>
                    <span>{opp.city}</span>
                    <span>·</span>
                    <span>Event: {formattedDate}</span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1D2421] leading-tight">
                    <Link to={`/opportunities/${opp.id}`} className="hover:text-[#1B4D3E] transition-colors">
                      {opp.title}
                    </Link>
                  </h3>

                  {/* Team Info as clean text */}
                  {app.team ? (
                    <div className="text-xs text-[#1D2421] pt-1">
                      <span className="font-bold text-[#1B4D3E]">{app.team.college} Team</span>
                      <span className="text-[#6F756F] ml-2">
                        ({teamMembers.length} {teamMembers.length === 1 ? 'member (You)' : 'students'}: You
                        {otherMembers.length > 0 && `, ${otherMembers.map((m) => m.name.split(' ')[0]).join(', ')}`})
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-[#6F756F]">
                      Campus grouping processing
                    </div>
                  )}
                </div>

                {/* Right Column: Status & Action Links */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-center">
                  <StatusBadge status={app.status} />

                  <div className="flex items-center gap-2.5">
                    {isApplied && (
                      <button
                        type="button"
                        onClick={() => setCheckinOpp(opp)}
                        className="px-3 py-1.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E04810] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Verify geolocation and scan QR code on-site"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Check-In</span>
                      </button>
                    )}

                    {isCompleted && (
                      <Link
                        to={`/certificate/${app.id}`}
                        className="px-4 py-2 rounded-lg bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-colors shadow-2xs"
                      >
                        Certificate
                      </Link>
                    )}

                    <Link
                      to={`/opportunities/${opp.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0C3B2E] hover:text-[#FF5A1F] transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {isApplied && onWithdraw && (
                      <button
                        onClick={() => onWithdraw(app.id, app.teamId, opp.id)}
                        disabled={withdrawingId === app.id}
                        className="text-xs font-medium text-rose-600 hover:text-rose-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {checkinOpp && (
        <GeofencedCheckinModal
          opportunity={checkinOpp}
          isOpen={Boolean(checkinOpp)}
          onClose={() => setCheckinOpp(null)}
          onCheckinSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
