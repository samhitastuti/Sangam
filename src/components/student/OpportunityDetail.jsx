import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Mail,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Users,
  Clock,
  Navigation,
  Compass,
  ExternalLink,
  Building2,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import TeamBanner from './TeamBanner.jsx';
import ActivityFormatBadge from '../common/ActivityFormatBadge.jsx';
import NgoVerificationBadge from '../common/NgoVerificationBadge.jsx';
import GoogleMapCard from '../common/GoogleMapCard.jsx';
import GeofencedCheckinModal from '../checkin/GeofencedCheckinModal.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { calculateHaversineDistanceKm, formatDistance } from '../../utils/distance.js';

export default function OpportunityDetail({
  opportunity,
  application,
  team,
  teamMembers,
  currentUser,
  onApply,
  onWithdraw,
  loadingAction
}) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const { userLocation, requestLiveLocation, isRequestingLive, presets, setPreset } = useLocation();

  if (!opportunity) return null;

  const {
    id,
    title,
    description,
    orgName,
    orgEmail,
    city,
    address,
    duration = '4 Weeks',
    hours = 20,
    schedule,
    latitude,
    longitude,
    date,
    capacity = 20,
    appliedCount = 0,
    status = 'open',
    skillsNeeded = []
  } = opportunity;

  // Calculate live distance from user's current reference / GPS
  const oppLat = latitude != null ? Number(latitude) : null;
  const oppLng = longitude != null ? Number(longitude) : null;
  const distanceKm = (userLocation?.lat != null && userLocation?.lng != null && oppLat != null && oppLng != null)
    ? calculateHaversineDistanceKm(userLocation.lat, userLocation.lng, oppLat, oppLng)
    : null;
  const distanceLabel = distanceKm != null ? formatDistance(distanceKm) : null;

  const hasApplied = application && application.status === 'applied';
  const isCompleted = application && application.status === 'completed';
  const isFull = appliedCount >= capacity;
  const spotsLeft = Math.max(0, capacity - appliedCount);
  const fillPercentage = Math.min(100, Math.round((appliedCount / capacity) * 100));

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const isStudent = currentUser?.role === 'student';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Top back navigation and share */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#1B4D3E]/10">
        <Link
          to="/browse"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4D3E] hover:text-[#E9762B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to opportunities</span>
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#1B4D3E]/20 bg-transparent text-xs font-medium text-[#1D2421] hover:border-[#1B4D3E] transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copyFeedback ? 'Link copied!' : 'Share'}</span>
        </button>
      </div>

      {/* If applied, display the collegiate TeamBanner */}
      {hasApplied && (
        <TeamBanner
          team={team}
          teamMembers={teamMembers}
          currentUserId={currentUser?.id}
          college={currentUser?.college}
        />
      )}

      {/* Editorial Opportunity Headline & Deck */}
      <div className="space-y-4 mb-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1B4D3E] uppercase tracking-wider">
          <ActivityFormatBadge format={opportunity.activityFormat || opportunity.activity_format} size="pill" />
          <span className="text-[#E9762B] font-bold">{orgName || 'Host Organisation'}</span>
          <NgoVerificationBadge
            organization={opportunity.organization || {
              name: orgName,
              organization_name: orgName,
              verification_status: opportunity.verification_status || 'verified',
              trust_score: opportunity.trust_score || 95,
              ngo_darpan_id: opportunity.ngo_darpan_id
            }}
          />
          <span>·</span>
          <span>{city}</span>
          <span>·</span>
          <span>{formattedDate}</span>
          <span>·</span>
          <StatusBadge status={hasApplied ? 'applied' : isCompleted ? 'completed' : isFull ? 'closed' : status} />
        </div>

        <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-[#1D2421] tracking-tight leading-[0.98] uppercase">
          {title}
        </h1>

        <div className="text-xs text-[#6F756F] flex flex-wrap items-center gap-4 pt-2">
          <span>Coordinated via <strong className="text-[#1D2421]">{orgEmail || 'host@sangam.org'}</strong></span>
          <span>·</span>
          <span>Institutional team matching active</span>
        </div>
      </div>

      {/* Hero Photographic Banner */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-lg overflow-hidden border border-[#1B4D3E]/15 mb-10 bg-stone-200 shadow-xs">
        <img
          src={opportunity.imageUrl || opportunity.image || opportunity.coverImage || '/src/assets/images/srm_hero_outreach_1790532217456.jpg'}
          alt={title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 text-white flex items-center justify-between text-xs">
          <span className="font-semibold bg-black/60 px-3 py-1 rounded backdrop-blur-xs">
            {city} · {opportunity.category || 'Community Action'}
          </span>
          <span className="bg-[#E9762B] text-white font-bold px-3 py-1 rounded uppercase tracking-wider text-[11px]">
            {opportunity.hasSrmSquad ? '★ SRM Squad Active' : `${appliedCount} Applied`}
          </span>
        </div>
      </div>

      {/* NGO Location & Duration Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        
        {/* NGO Venue & Approximate Distance Card */}
        <div className="p-5 sm:p-6 rounded-lg border border-[#0C3B2E]/15 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0C3B2E]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF5A1F]" />
              <span>NGO Venue & Distance</span>
            </span>
            {distanceLabel && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                {distanceLabel}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[#57655F]">Physical Venue / Address:</div>
            <div className="text-sm font-semibold text-[#141C18] leading-snug">
              {address || `${city} Municipal Region, India`}
            </div>
            <div className="text-xs text-[#57655F]">
              City: <strong className="text-[#141C18]">{city}</strong>
            </div>
          </div>

          {/* Proximity / Distance from user */}
          <div className="pt-2 border-t border-[#0C3B2E]/10 space-y-2">
            <div className="flex items-start justify-between gap-2 text-xs">
              <span className="text-[#57655F]">
                Distance from <strong>{userLocation?.label || 'Your Location'}</strong>:
              </span>
              <span className="font-bold text-[#0C3B2E] tabular-nums shrink-0">
                {distanceKm != null ? `${distanceKm} km` : 'Calculating...'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={requestLiveLocation}
                disabled={isRequestingLive}
                className="px-2.5 py-1 rounded bg-[#0C3B2E]/5 hover:bg-[#0C3B2E] text-[#0C3B2E] hover:text-white border border-[#0C3B2E]/20 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Navigation className={`w-3 h-3 ${isRequestingLive ? 'animate-spin' : ''}`} />
                <span>{isRequestingLive ? 'Detecting GPS...' : userLocation?.isLive ? '✓ GPS Active' : 'Use My GPS'}</span>
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address ? `${address}, ${city}` : `${city}, India`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-white hover:bg-stone-100 text-[#141C18] border border-[#0C3B2E]/20 text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-3 h-3 text-[#57655F]" />
              </a>
            </div>

            {/* Embedded Interactive Google Map */}
            <div className="pt-2">
              <GoogleMapCard
                latitude={latitude}
                longitude={longitude}
                title={title}
                address={address}
                city={city}
                userLocation={userLocation}
                height="220px"
              />
            </div>
          </div>
        </div>

        {/* Programme Duration & Schedule Card */}
        <div className="p-5 sm:p-6 rounded-lg border border-[#0C3B2E]/15 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0C3B2E]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FF5A1F]" />
              <span>Duration & Schedule</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FF5A1F]/10 text-[#FF5A1F] border border-[#FF5A1F]/20 text-[10px] font-bold">
              {duration || '4 Weeks'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#0C3B2E]/10">
              <span className="text-[#57655F]">Activity Format:</span>
              <ActivityFormatBadge format={opportunity.activityFormat || opportunity.activity_format} size="pill" />
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-[#0C3B2E]/10">
              <span className="text-[#57655F]">Commitment Length:</span>
              <strong className="text-[#141C18] font-bold">{duration || '4 Weeks'}</strong>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-[#0C3B2E]/10">
              <span className="text-[#57655F]">Total Volunteer Hours:</span>
              <strong className="text-[#141C18] font-bold">{hours || 20} Hours</strong>
            </div>

            <div className="flex items-center justify-between pb-1.5 border-b border-[#0C3B2E]/10">
              <span className="text-[#57655F]">Timing & Slots:</span>
              <strong className="text-[#0C3B2E] font-bold text-right max-w-[240px] truncate" title={opportunity.timingDetails || opportunity.timing_details || schedule || 'Cohort Sessions'}>
                {opportunity.timingDetails || opportunity.timing_details || schedule || 'Weekend batches (9:30 AM – 1:30 PM)'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#57655F]">Starts On:</span>
              <strong className="text-[#0C3B2E] font-bold">{formattedDate}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Cohort Capacity Overview */}
      <div className="p-6 rounded border border-[#1B4D3E]/15 bg-[#F5EFEB]/50 mb-10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-[#1B4D3E]">
            Cohort Capacity & Placement
          </span>
          <span className="text-[#1D2421] font-semibold tabular-nums">
            {appliedCount} / {capacity} spots filled ({spotsLeft} remaining)
          </span>
        </div>

        <div className="w-full bg-[#1B4D3E]/10 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isFull ? 'bg-stone-500' : 'bg-[#1B4D3E]'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>

        <p className="text-[11px] text-[#6F756F]">
          Sangam automatically groups applicants from the same university into a collaborative squad for this drive.
        </p>
      </div>

      {/* Programme Description */}
      <div className="space-y-6 pb-10 border-b border-[#1B4D3E]/10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#1B4D3E]">
          About the Programme
        </h2>
        <div className="text-base sm:text-lg text-[#1D2421] leading-relaxed whitespace-pre-line font-normal">
          {description}
        </div>

        {skillsNeeded.length > 0 && (
          <div className="pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6F756F] block mb-2">
              Skills and Focus
            </span>
            <div className="text-xs text-[#1D2421] font-medium">
              {skillsNeeded.join('  ·  ')}
            </div>
          </div>
        )}
      </div>

      {/* Action CTA Bar */}
      <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="text-xs text-[#6F756F]">
          {hasApplied ? (
            <span className="text-[#1B4D3E] font-medium">
              ✓ You are registered for this opportunity with your campus team.
            </span>
          ) : isCompleted ? (
            <span className="text-[#1B4D3E] font-medium">
              ✓ You completed this programme! Your certificate has been issued.
            </span>
          ) : isFull ? (
            <span className="text-stone-600 font-medium">
              This programme has reached maximum capacity ({capacity} volunteers).
            </span>
          ) : !currentUser ? (
            <span>Please sign in with your student profile to join with your campus squad.</span>
          ) : !isStudent ? (
            <span>Organisation hosts cannot register as student volunteers.</span>
          ) : (
            <span>
              Applying will automatically link you with other students from{' '}
              <strong className="text-[#1B4D3E]">{currentUser.college}</strong>.
            </span>
          )}
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-3">
          {isCompleted ? (
            <Link
              to={`/certificate/${application.id}`}
              className="px-6 py-3 rounded-lg bg-[#0C3B2E] hover:bg-[#07251D] text-white font-bold text-xs transition-colors shadow-2xs"
            >
              View certificate
            </Link>
          ) : hasApplied ? (
            <>
              <button
                type="button"
                onClick={() => setIsCheckinOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-[#FF5A1F] hover:bg-[#E04810] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Verify geolocation radius and scan on-site QR code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>On-Site Check-In</span>
              </button>

              <button
                onClick={onWithdraw}
                disabled={loadingAction}
                className="px-4 py-2.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingAction ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </>
          ) : (
            <button
              onClick={onApply}
              disabled={isFull || !isStudent || loadingAction || status !== 'open'}
              className="px-8 py-3 rounded bg-[#1B4D3E] hover:bg-[#13392D] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              {loadingAction ? (
                'Pairing & registering...'
              ) : isFull ? (
                'Cohort full'
              ) : (
                'Apply & join campus team'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Geofenced Attendance Check-In Modal */}
      {isCheckinOpen && (
        <GeofencedCheckinModal
          opportunity={opportunity}
          isOpen={isCheckinOpen}
          onClose={() => setIsCheckinOpen(false)}
          onCheckinSuccess={() => {
            window.location.reload();
          }}
        />
      )}

    </div>
  );
}
