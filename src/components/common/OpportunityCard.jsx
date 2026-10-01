import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Users, Calendar, Building2, CheckCircle2, Clock, Navigation } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';
import ActivityFormatBadge from './ActivityFormatBadge.jsx';
import NgoVerificationBadge from './NgoVerificationBadge.jsx';

export default function OpportunityCard({
  opportunity,
  userHomeCity,
  hasApplied = false,
  applicationStatus = null,
  userCollege = null,
  variant = 'grid'
}) {
  const {
    id,
    title,
    description,
    orgName,
    city,
    address = '',
    duration = '4 Weeks',
    hours = 20,
    schedule = '',
    activity_format,
    activityFormat,
    timing_details,
    timingDetails,
    distanceKm = null,
    formattedDistance = null,
    date,
    capacity = 20,
    appliedCount = 0,
    status = 'open',
    skillsNeeded = [],
    imageUrl,
    hasSrmSquad = false,
    squadColleges = [],
    organization,
    verification_status,
    trust_score
  } = opportunity;

  const currentFormat = activityFormat || activity_format || 'weekly';
  const effectiveTiming = timingDetails || timing_details || schedule || '';

  const dateObj = new Date(date);
  const monthStr = dateObj.toLocaleDateString('en-IN', { month: 'short' });
  const dayStr = dateObj.getDate();
  const yearStr = dateObj.getFullYear();

  const isFull = appliedCount >= capacity;
  const spotsLeft = Math.max(0, capacity - appliedCount);
  const percentFilled = Math.min(100, Math.round((appliedCount / capacity) * 100));
  const fallbackImagesByCategory = {
    Education: '/src/assets/images/featured_digital_literacy_1790530845015.jpg',
    Environment: '/src/assets/images/opp_urban_forest_1790697010453.jpg',
    Healthcare: '/src/assets/images/opp_vision_clinic_1790570208128.jpg',
    Technology: '/src/assets/images/story_solar_village_1790570221710.jpg',
    'Community Action': '/src/assets/images/opp_senior_care_1790696996205.jpg',
    'Animal Welfare': '/src/assets/images/opp_animal_shelter_1790696976814.jpg',
    'Civic & Democracy': '/src/assets/images/opp_traffic_civic_1790697071726.jpg'
  };

  const displayImage =
    imageUrl ||
    opportunity.image ||
    opportunity.coverImage ||
    fallbackImagesByCategory[opportunity.category] ||
    '/src/assets/images/srm_hero_outreach_1790532217456.jpg';

  // Grid variant: Rich photographic card
  if (variant === 'grid') {
    return (
      <div className="group rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-300 hover:border-slate-300 hover:shadow-md flex flex-col justify-between">
        <div>
          {/* Card Photographic Header */}
          <div className="relative h-48 sm:h-52 w-full bg-slate-100 overflow-hidden">
            <img
              src={displayImage}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Top Left Tags: Activity Format, SRM Squad Badge, City, & Distance */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
              <ActivityFormatBadge format={currentFormat} size="pill" />
              {hasSrmSquad && (
                <span className="px-2.5 py-1 rounded-md bg-[#FF5A1F] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  ★ SRM Squad Active
                </span>
              )}
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                {city}
              </span>
              {formattedDistance && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs border border-emerald-400/30">
                  <Navigation className="w-2.5 h-2.5 shrink-0" />
                  <span>{formattedDistance}</span>
                </span>
              )}
            </div>

            {/* Top Right Date Stamp */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-md text-center shadow-xs">
              <span className="block text-[9px] font-bold uppercase text-[#FF5A1F] leading-none">
                {monthStr}
              </span>
              <span className="block font-bold text-base leading-tight">
                {dayStr}
              </span>
            </div>

            {/* Bottom Meta on Image */}
            <div className="absolute bottom-2.5 inset-x-3 text-white flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-white/90 truncate flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                  <span className="truncate">{orgName || 'Host NGO'}</span>
                </span>
                <NgoVerificationBadge
                  organization={organization || {
                    name: orgName,
                    organization_name: orgName,
                    verification_status: verification_status || 'verified',
                    trust_score: trust_score || 95
                  }}
                  className="shrink-0"
                />
              </div>
              <span className="text-[11px] text-white/80 shrink-0 tabular-nums font-medium">
                {appliedCount}/{capacity} spots
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 sm:p-5 space-y-3">
            <h3 className="font-sans text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0C3B2E] transition-colors leading-snug line-clamp-2">
              <Link to={`/opportunities/${id}`}>
                {title}
              </Link>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
              {description}
            </p>

            {/* Timing & Schedule highlight */}
            {effectiveTiming && (
              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-xs text-[#0C3B2E] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                <span className="truncate text-xs">{effectiveTiming}</span>
              </div>
            )}

            {/* NGO Address & Duration Meta Block */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {address && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate" title={address}>
                  <MapPin className="w-3.5 h-3.5 text-[#0C3B2E] shrink-0" />
                  <span className="truncate font-medium">{address}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <span>{duration || '4 Weeks'}</span>
                  {hours ? <span className="text-slate-500 font-normal">· {hours}h commitment</span> : null}
                </div>
                {distanceKm != null && (
                  <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    📍 {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm} km away`}
                  </span>
                )}
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Cohort Filling</span>
                <span className="font-bold text-slate-800">{spotsLeft} spots remaining</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentFilled >= 80 ? 'bg-[#FF5A1F]' : 'bg-[#0C3B2E]'
                  }`}
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
            </div>

            {/* Skills Tags */}
            {skillsNeeded.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {skillsNeeded.slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60"
                  >
                    {skill}
                  </span>
                ))}
                {skillsNeeded.length > 3 && (
                  <span className="text-xs text-slate-500 font-medium">
                    +{skillsNeeded.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            {hasApplied ? (
              <StatusBadge status={applicationStatus || 'applied'} />
            ) : isFull ? (
              <StatusBadge status="closed" />
            ) : (
              <span className="text-[11px] font-medium text-[#0C3B2E] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#0C3B2E]" />
                <span>SRM Auto-Group</span>
              </span>
            )}
          </div>

          <Link
            to={`/opportunities/${id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0C3B2E] group-hover:text-[#FF5A1F] transition-colors"
          >
            <span>View Programme</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  // List variant: Horizontal row with photographic thumbnail
  return (
    <div className="group py-4 sm:py-5 border-b border-[#0C3B2E]/10 hover:bg-[#0C3B2E]/[0.02] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Image Thumbnail + Details */}
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          
          {/* Photographic Thumbnail */}
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded overflow-hidden bg-stone-200 border border-[#0C3B2E]/10 relative">
            <img
              src={displayImage}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute top-1 right-1 bg-black/70 text-white text-[9px] font-black px-1 rounded">
              {dayStr} {monthStr}
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57655F] mb-1">
              <ActivityFormatBadge format={currentFormat} size="pill" />
              <span className="font-bold text-[#0C3B2E] uppercase tracking-wider text-[11px]">
                {orgName || 'Host NGO'}
              </span>
              <NgoVerificationBadge
                organization={organization || {
                  name: orgName,
                  organization_name: orgName,
                  verification_status: verification_status || 'verified',
                  trust_score: trust_score || 95
                }}
              />
              <span>·</span>
              <span className="text-[#141C18] font-medium">{city}</span>
              {hasSrmSquad && (
                <span className="px-1.5 py-0.2 rounded bg-[#FF5A1F]/15 text-[#FF5A1F] font-bold text-[10px]">
                  SRM Squad Active
                </span>
              )}
            </div>

            <h3 className="font-display text-base sm:text-lg font-bold text-[#141C18] group-hover:text-[#0C3B2E] transition-colors leading-snug truncate">
              <Link to={`/opportunities/${id}`}>
                {title}
              </Link>
            </h3>

            <p className="text-xs text-[#57655F] line-clamp-1 mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>

            {/* Address, Timing, Duration, & Proximity Strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#57655F] mt-1.5">
              {effectiveTiming && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#0C3B2E] bg-[#0C3B2E]/5 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3 text-[#FF5A1F] shrink-0" />
                  <span className="truncate max-w-xs">{effectiveTiming}</span>
                </span>
              )}
              {address && (
                <span className="flex items-center gap-1 truncate max-w-xs text-[11px]" title={address}>
                  <MapPin className="w-3 h-3 text-[#0C3B2E] shrink-0" />
                  <span className="truncate">{address}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#141C18]">
                <span>{duration || '4 Weeks'}</span>
                {hours ? <span className="text-[#57655F] font-normal">({hours}h total)</span> : null}
              </span>
              {formattedDistance && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                  <span>{formattedDistance}</span>
                </span>
              )}
            </div>

            {skillsNeeded.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#57655F] mt-1.5">
                <span className="font-medium text-[#141C18]">Skills:</span>
                <span>{skillsNeeded.slice(0, 3).join(' · ')}</span>
                {skillsNeeded.length > 3 && <span>+{skillsNeeded.length - 3}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Right: Capacity & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 pl-24 sm:pl-0 border-t sm:border-t-0 border-[#0C3B2E]/5">
          <div className="text-right">
            <div className="text-xs text-[#57655F]">
              <span className="font-bold text-[#141C18] tabular-nums">{appliedCount}</span> / {capacity} spots
            </div>
            <div className="text-[11px] text-[#57655F]">
              {isFull ? (
                <span className="text-stone-500 font-semibold">Cohort Full</span>
              ) : (
                <span className="text-emerald-700 font-medium">{spotsLeft} remaining</span>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {hasApplied ? (
              <StatusBadge status={applicationStatus || 'applied'} />
            ) : isFull ? (
              <StatusBadge status="closed" />
            ) : null}

            <Link
              to={`/opportunities/${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
