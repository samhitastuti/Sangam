import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Users,
  CheckCircle2,
  Navigation,
  Clock,
  Compass,
  Calendar,
  Zap,
  Megaphone,
  ShieldCheck,
  Layers
} from 'lucide-react';
import OpportunityCard from '../common/OpportunityCard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import ActivityFormatBadge from '../common/ActivityFormatBadge.jsx';
import NgoVerificationBadge from '../common/NgoVerificationBadge.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';

export default function OpportunityList({
  opportunities = [],
  userHomeCity,
  userApplications = {},
  emptyTitle = 'No opportunities found',
  emptyDescription = 'Try adjusting your search criteria, city filter, or keywords.',
  showFeatured = true,
  viewMode = 'grid',
  groupByFormat = false
}) {
  const { userLocation, sortBy } = useLocation();

  if (opportunities.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  // Find or default the featured opportunity
  const featuredIndex = showFeatured
    ? opportunities.findIndex((o) => o.id === 'opp_animal_shelter' || o.id === 'opp_election_awareness' || o.id === 'opp_digital_literacy')
    : -1;

  const featured = featuredIndex !== -1 ? opportunities[featuredIndex] : (showFeatured && opportunities.length > 0 ? opportunities[0] : null);
  const remainingList = (!groupByFormat && featured)
    ? opportunities.filter((o) => o.id !== featured.id)
    : opportunities;

  const featuredApp = featured ? userApplications[featured.id] : null;

  // Group opportunities by format
  const weeklyOpps = opportunities.filter((o) => (o.activity_format || o.activityFormat || 'weekly').toLowerCase() === 'weekly');
  const oneDayOpps = opportunities.filter((o) => (o.activity_format || o.activityFormat || '').toLowerCase() === 'one_day_drive');
  const campaignOpps = opportunities.filter((o) => (o.activity_format || o.activityFormat || '').toLowerCase() === 'campaign');

  // If Grouped Mode is requested: Render the 3 distinct categories
  if (groupByFormat) {
    return (
      <div className="space-y-16">
        
        {/* Group Header Info */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#0C3B2E]/5 border border-[#0C3B2E]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF5A1F]" />
            <span className="font-bold text-[#0C3B2E] text-sm">
              Divided by Activity Groups & Commitment
            </span>
          </div>
          <span className="text-[#57655F]">
            Showing <strong>{weeklyOpps.length}</strong> Weekly Cohorts · <strong>{oneDayOpps.length}</strong> One-Day Drives · <strong>{campaignOpps.length}</strong> Campaigns
          </span>
        </div>

        {/* Group 1: Weekly with Timings */}
        {weeklyOpps.length > 0 && (
          <section id="group-weekly" className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b-2 border-indigo-600/30">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Group 1: Weekly Commitments with Timings</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-[#141C18] uppercase tracking-tight">
                  Animal Shelters, Regular Mentorship & Community Care
                </h3>
                <p className="text-xs text-[#57655F] mt-0.5">
                  Structured recurring weekly cohorts with fixed timing slots (e.g. Saturdays 8:00 AM – 11:30 AM).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shrink-0">
                {weeklyOpps.length} Programmes
              </span>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weeklyOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApplications[opp.id] && userApplications[opp.id].status === 'applied')}
                    applicationStatus={userApplications[opp.id]?.status}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#0C3B2E]/10">
                {weeklyOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApplications[opp.id] && userApplications[opp.id].status === 'applied')}
                    applicationStatus={userApplications[opp.id]?.status}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Group 2: One-Day Drives */}
        {oneDayOpps.length > 0 && (
          <section id="group-oneday" className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b-2 border-amber-600/30">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-700" />
                  <span>Group 2: One-Day Mega Drives</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-[#141C18] uppercase tracking-tight">
                  Beach Cleanups, Afforestation & Single-Day Blitzes
                </h3>
                <p className="text-xs text-[#57655F] mt-0.5">
                  High-intensity single-day civic drives. Certificates issued on-site on day completion.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0">
                {oneDayOpps.length} Drives
              </span>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {oneDayOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApplications[opp.id] && userApplications[opp.id].status === 'applied')}
                    applicationStatus={userApplications[opp.id]?.status}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#0C3B2E]/10">
                {oneDayOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApplications[opp.id] && userApplications[opp.id].status === 'applied')}
                    applicationStatus={userApplications[opp.id]?.status}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Group 3: Campaigns & Public Awareness */}
        {campaignOpps.length > 0 && (
          <section id="group-campaigns" className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b-2 border-purple-600/30">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <Megaphone className="w-3.5 h-3.5 text-purple-700" />
                  <span>Group 3: Public Awareness & Civic Campaigns</span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-black text-[#141C18] uppercase tracking-tight">
                  Voter Election Literacy, Road Safety & Civic Advocacy
                </h3>
                <p className="text-xs text-[#57655F] mt-0.5">
                  Milestone-driven public awareness campaigns combining campus booths, street demonstrations, and citizen rallies.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold shrink-0">
                {campaignOpps.length} Campaigns
              </span>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaignOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApplications[opp.id] && userApplications[opp.id].status === 'applied')}
                    applicationStatus={userApplications[opp.id]?.status}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-[#0C3B2E]/10">
                {campaignOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApplications[opp.id] && userApplications[opp.id].status === 'applied')}
                    applicationStatus={userApplications[opp.id]?.status}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    );
  }

  // Standard (Ungrouped) View with Editorial Feature Card
  return (
    <div className="space-y-10">
      
      {/* Editorial Featured Opportunity Section */}
      {featured && (
        <div className="border border-[#0C3B2E]/15 rounded-lg overflow-hidden bg-white shadow-xs transition-colors hover:border-[#0C3B2E]/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3">
                  <ActivityFormatBadge format={featured.activity_format || featured.activityFormat} size="pill" />
                  <span className="px-2 py-0.5 rounded bg-[#FF5A1F] text-white font-bold text-[10px]">
                    Featured Initiative
                  </span>
                  {featured.hasSrmSquad && (
                    <span className="px-2 py-0.5 rounded bg-[#0C3B2E] text-white font-bold text-[10px]">
                      ★ SRM Squad Forming
                    </span>
                  )}
                  <span className="text-[#57655F]">·</span>
                  <span className="text-[#0C3B2E] font-bold">{featured.city}</span>
                  {featured.formattedDistance && (
                    <>
                      <span className="text-[#57655F]">·</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px] normal-case flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                        <span>{featured.formattedDistance}</span>
                      </span>
                    </>
                  )}
                  {featured.duration && (
                    <>
                      <span className="text-[#57655F]">·</span>
                      <span className="text-[#141C18] font-semibold text-[11px] normal-case flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF5A1F]" />
                        <span>{featured.duration} ({featured.hours || 20}h)</span>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#0C3B2E]">{featured.orgName || 'Host NGO'}</span>
                  <NgoVerificationBadge
                    organization={featured.organization || {
                      name: featured.orgName,
                      verification_status: featured.verification_status,
                      trust_score: featured.trust_score
                    }}
                  />
                </div>

                <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#141C18] tracking-tight leading-tight mb-3">
                  <Link to={`/opportunities/${featured.id}`} className="hover:text-[#0C3B2E] transition-colors">
                    {featured.title}
                  </Link>
                </h3>

                {/* Timing details badge */}
                {(featured.timing_details || featured.timingDetails || featured.schedule) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#0C3B2E]/5 border border-[#0C3B2E]/10 text-xs font-semibold text-[#0C3B2E] mb-3">
                    <Clock className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>{featured.timing_details || featured.timingDetails || featured.schedule}</span>
                  </div>
                )}

                {featured.address && (
                  <div className="text-xs text-[#57655F] flex items-center gap-1.5 mb-2 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0C3B2E] shrink-0" />
                    <span>Venue: {featured.address}</span>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-[#57655F] leading-relaxed mb-4 max-w-xl font-normal">
                  {featured.description}
                </p>

                {/* Skills tags as clean inline text */}
                {featured.skillsNeeded && featured.skillsNeeded.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-6 text-xs text-[#57655F]">
                    <span className="font-bold text-[#141C18]">Focus Domains:</span>
                    {featured.skillsNeeded.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-[#0C3B2E]/8 text-[#0C3B2E] font-medium text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Spots & CTA */}
              <div className="pt-5 border-t border-[#0C3B2E]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#57655F]">
                    <strong className="text-[#141C18] font-bold text-sm tabular-nums">
                      {featured.appliedCount}
                    </strong>{' '}
                    / {featured.capacity} spots filled
                  </div>
                  <div className="text-[11px] text-[#0C3B2E] font-semibold mt-0.5">
                    SRM Kattankulathur automatic pairing active
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {featuredApp ? (
                    <StatusBadge status={featuredApp.status} />
                  ) : null}

                  <Link
                    to={`/opportunities/${featured.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>View opportunity details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Large Photographic Area */}
            <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full bg-stone-200">
              <img
                src={featured.imageUrl || featured.image || featured.coverImage || '/src/assets/images/srm_hero_outreach_1790532217456.jpg'}
                alt={featured.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
              <div className="absolute bottom-3 left-4 right-4 text-white text-xs font-bold lg:hidden">
                {featured.orgName || 'Verified Host'}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Directory of Remaining Opportunities */}
      {remainingList.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#0C3B2E]/15 text-xs font-bold text-[#57655F] uppercase tracking-wider gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span>Verified Programmes</span>
              {sortBy === 'distance' && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] normal-case font-bold flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Sorted by proximity from {userLocation?.label || 'campus'} (Nearest first)</span>
                </span>
              )}
            </div>
            <span className="font-mono text-[#0C3B2E]">{remainingList.length} Opportunities Available</span>
          </div>

          {/* Grid View: Rich Multi-column photographic cards */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingList.map((opp) => {
                const userApp = userApplications[opp.id];
                return (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApp && userApp.status === 'applied')}
                    applicationStatus={userApp ? userApp.status : null}
                    variant="grid"
                  />
                );
              })}
            </div>
          ) : (
            /* List View: Compact rows with image thumbnails */
            <div className="divide-y divide-[#0C3B2E]/10">
              {remainingList.map((opp) => {
                const userApp = userApplications[opp.id];
                return (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    userHomeCity={userHomeCity}
                    hasApplied={Boolean(userApp && userApp.status === 'applied')}
                    applicationStatus={userApp ? userApp.status : null}
                    variant="list"
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

