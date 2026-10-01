import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation as useGeoLocation } from '../contexts/LocationContext.jsx';
import { updateUserProfile, getApplicationsByUser } from '../firebase/firestore.js';
import { Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Building2,
  Mail,
  Award,
  Users,
  Clock,
  Edit3,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Check,
  QrCode,
  FileCheck2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const COLLEGE_GROUPS = [
  {
    label: 'SRM',
    colleges: [
      'SRM Kattankulathur (KTR)', 'SRM Ramapuram', 'SRM Vadapalani',
      'SRM Trichy', 'SRM Amaravati', 'SRM Sonepat', 'SRM Sikkim'
    ]
  },
  {
    label: 'IITs',
    colleges: [
      'IIT Madras', 'IIT Bombay', 'IIT Delhi', 'IIT Kanpur', 'IIT Kharagpur',
      'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'IIT Indore', 'IIT Mandi',
      'IIT (BHU) Varanasi', 'IIT Palakkad', 'IIT Tirupati', 'IIT (ISM) Dhanbad'
    ]
  },
  {
    label: 'NITs',
    colleges: [
      'NIT Tiruchirappalli', 'NIT Warangal', 'NIT Karnataka, Surathkal',
      'NIT Rourkela', 'NIT Calicut', 'NIT Durgapur', 'MNIT Jaipur', 'VNIT Nagpur'
    ]
  },
  {
    label: 'VIT',
    colleges: [
      'VIT Vellore', 'VIT Chennai', 'VIT-AP Amaravati', 'VIT Bhopal'
    ]
  },
  {
    label: 'Central / State Universities',
    colleges: [
      'Anna University', 'University of Delhi', 'Jawaharlal Nehru University',
      'Jamia Millia Islamia', 'Jadavpur University', 'Banaras Hindu University',
      'Osmania University', 'BITS Pilani'
    ]
  },
  {
    label: 'Other',
    colleges: ['Other / Not Listed']
  }
];

const CITIES = [
  'Chennai',
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'Delhi',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Coimbatore',
  'Vellore'
];

// Helper to reliably sanitize skills into array
function parseSkills(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

// Default verified certificates for the official Guest Student persona
const GUEST_CERTIFICATES = [
  {
    certificateId: 'SAN-2026-SRM-GUEST-01',
    applicationId: 'app_guest_health_comp',
    programmeName: 'Rural Community Health & Literacy Clinic',
    organisationName: 'SRM Community Action & Outreach Cell',
    volunteerHours: 16,
    completionDate: '13 September 2026',
    category: 'Healthcare & Wellness',
    certificateHash: '9a84f3c7b2e105e6d1c87a5309d431be7612c3f8'
  },
  {
    certificateId: 'SAN-2026-SRM-GUEST-02',
    applicationId: 'app_guest_lake_comp',
    programmeName: 'Wetland & Lake Restoration Ecological Drive',
    organisationName: 'Environmental Foundation of India (EFI)',
    volunteerHours: 12,
    completionDate: '28 August 2026',
    category: 'Environment & Ecology',
    certificateHash: '4f62e819ac4051b8d2345e6790ca11f28b77d945'
  },
  {
    certificateId: 'SAN-2026-SRM-GUEST-03',
    applicationId: 'app_guest_digital_comp',
    programmeName: 'Digital Safety & Smartphone Literacy for Elders',
    organisationName: 'Kattankulathur Civic Volunteers',
    volunteerHours: 10,
    completionDate: '05 August 2026',
    category: 'Education & Literacy',
    certificateHash: '8e13d964f52071a9c3b802e541987d60f1ca43b2'
  }
];

export default function ProfilePage() {
  const {
    currentUser,
    loading: authLoading,
    refreshUserProfile,
    loginAsGuestStudent,
    isGuestStudent
  } = useAuth();
  const { userLocation } = useGeoLocation();
  const currentCity = userLocation?.city || 'Chennai';

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [otherCollegeCustom, setOtherCollegeCustom] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync internal state when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setCollege(currentUser.college || 'SRM Kattankulathur (KTR)');
      setHomeCity(currentUser.homeCity || currentUser.home_city || currentCity);
      setBio(currentUser.bio || '');
      setSkills(parseSkills(currentUser.skills));

      if (currentUser.id) {
        getApplicationsByUser(currentUser.id)
          .then((apps) => {
            setApplications(Array.isArray(apps) ? apps : []);
          })
          .catch(() => {
            setApplications([]);
          });
      }
    }
  }, [currentUser, currentCity]);

  // Loading state while checking session
  if (authLoading) {
    return <LoadingSpinner message="Verifying collegiate passport credentials..." />;
  }

  // Safe checks
  const safeName = currentUser?.name || 'Guest Student';
  const safeCollege = currentUser?.college || 'SRM Kattankulathur (KTR)';
  const safeCity = currentUser?.homeCity || currentUser?.home_city || currentCity;
  const safeBio = currentUser?.bio || (
    currentUser?.role === 'organization'
      ? 'Civic organization dedicated to creating verified experiential opportunities for university cohorts.'
      : 'Collegiate volunteer active in local ecological restoration, literacy tutoring, and inter-collegiate community initiatives.'
  );
  const safeRole = currentUser?.role || 'student';
  const safeSkills = parseSkills(currentUser?.skills || ['Digital Literacy', 'Environmental Action', 'First Aid']);

  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SG';

  const memberIdCode = String(currentUser?.id || 'GUEST').slice(-6).toUpperCase();

  // If user is not signed in and has no guest profile loaded:
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#0C3B2E] text-white flex items-center justify-center mx-auto text-2xl font-black shadow-md">
          🎓
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#141C18] tracking-tight font-display">
            Collegiate Volunteer Passport
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Sign in to access your verified NSS service passport, or explore immediately using the pre-configured Student Guest Profile with 3 verified certificates.
          </p>
        </div>

        {/* 1-Click Student Guest Profile Card under "Zero Password Required" */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#0C3B2E]/20 text-left space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#0C3B2E]/10">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0C3B2E] bg-[#0C3B2E]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span>🎓</span> Demo Student Persona
            </span>
            <span className="text-xs text-[#FF5A1F] font-extrabold uppercase tracking-wide">
              Zero Password Required
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-[#0C3B2E] font-display">
                Guest Student (Aarav Sharma)
              </h3>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Ready to Volunteer
              </span>
            </div>
            
            {/* Demo Data Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#0C3B2E]/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution</span>
                <span className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#0C3B2E]" />
                  <span>SRM Kattankulathur (KTR)</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#0C3B2E]/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active City</span>
                <span className="font-bold text-[#FF5A1F] mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{currentCity} Hub</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#0C3B2E]/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Collegiate Squad</span>
                <span className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0C3B2E]" />
                  <span>{currentCity} Community Action Squad</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FBF9F5] border border-[#0C3B2E]/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Volunteer Hours</span>
                <span className="font-black text-[#0C3B2E] text-sm mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>38 Verified Hours</span>
                </span>
              </div>
            </div>

            {/* Drives Joined */}
            <div className="mt-4 p-3.5 rounded-xl bg-[#FBF9F5] border border-[#0C3B2E]/10 text-xs text-slate-700">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                Drives Joined (4 Collegiate Drives)
              </div>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                <li><strong className="text-slate-900">Rural Community Health & Literacy Clinic</strong> (Completed · 16 hrs)</li>
                <li><strong className="text-slate-900">Wetland & Lake Restoration Ecological Drive</strong> (Completed · 12 hrs)</li>
                <li><strong className="text-slate-900">Digital Safety & Smartphone Literacy for Elders</strong> (Completed · 10 hrs)</li>
                <li><strong className="text-slate-900">Community Nutrition & Health Relief</strong> (Active Squad · In Progress)</li>
              </ul>
            </div>

            {/* Badges */}
            <div className="mt-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Earned Collegiate Badges</span>
              <div className="flex flex-wrap gap-1.5">
                {['🌟 First Responder', '🎓 Campus Squad Lead', '🌿 Eco Action Pioneer', '📱 Digital Literacy Mentor'].map((badge, idx) => (
                  <span key={idx} className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#0C3B2E]/5 text-[#0C3B2E] border border-[#0C3B2E]/10">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* 3 Verified Certificates Issued */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Verified Sample Certificates (3 Conferred)
              </span>
              {GUEST_CERTIFICATES.map((cert) => (
                <div
                  key={cert.certificateId}
                  className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950 text-xs">{cert.programmeName}</div>
                      <div className="text-[11px] text-amber-800">
                        {cert.certificateId} · {cert.organisationName} · <strong className="font-bold text-emerald-800">{cert.volunteerHours} Hours</strong>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/certificate/${cert.applicationId}`}
                    className="text-xs font-bold text-[#0C3B2E] hover:text-[#FF5A1F] flex items-center gap-1 shrink-0 self-end sm:self-center bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs"
                  >
                    <span>View Certificate</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* One-click Continue as Guest Student Button */}
          <button
            type="button"
            onClick={async () => {
              await loginAsGuestStudent(currentCity);
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0C3B2E] hover:bg-[#07251D] active:scale-[0.99] text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue as Guest Student</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs">
          <Link
            to="/login"
            className="text-[#0C3B2E] font-bold hover:underline"
          >
            Have an existing account? Sign in →
          </Link>
          <span>·</span>
          <Link
            to="/register"
            className="text-[#FF5A1F] font-bold hover:underline"
          >
            Join Sangam →
          </Link>
        </div>
      </div>
    );
  }

  // Handlers for authenticated edit mode
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = newSkill.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
        setNewSkill('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const effectiveCollege = college === 'Other / Not Listed' && otherCollegeCustom.trim()
      ? otherCollegeCustom.trim()
      : college.trim();

    const effectiveCity = homeCity === 'Other' && customCity.trim()
      ? customCity.trim()
      : homeCity.trim();

    if (!name.trim()) return setError('Name is required');
    if (!effectiveCollege) return setError('College / Organization is required');
    if (!effectiveCity) return setError('City is required');

    setLoading(true);
    try {
      await updateUserProfile(currentUser.id, {
        name: name.trim(),
        college: effectiveCollege,
        homeCity: effectiveCity,
        bio: bio.trim(),
        skills
      });

      await refreshUserProfile();
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const safeAppsList = Array.isArray(applications) ? applications : [];
  const activeApps = safeAppsList.filter((a) => a.status === 'applied' || a.status === 'accepted');
  const completedApps = safeAppsList.filter((a) => a.status === 'completed');

  // Compute volunteer hours: for guest student, show at least 38 verified hours
  const dbHours = completedApps.reduce((acc, a) => acc + (a.volunteerHours || a.hours_logged || 10), 0);
  const volunteerHours = isGuestStudent ? Math.max(38, dbHours) : (dbHours || (activeApps.length * 4));

  // Determine certificates to display
  const certificatesToDisplay = isGuestStudent
    ? GUEST_CERTIFICATES
    : completedApps.map(app => ({
        certificateId: app.certificateId || app.certificate_id || `SAN-2026-${(safeCollege || 'SRM').slice(0, 3).toUpperCase()}-0084`,
        applicationId: app.id,
        programmeName: app.opportunity?.title || 'Community Initiative',
        organisationName: app.opportunity?.organizationName || app.opportunity?.orgName || 'Host Organization',
        volunteerHours: app.volunteerHours || app.hours_logged || 16,
        completionDate: app.completedAt || app.completionDate || 'Recent',
        category: 'Community Service'
      }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Guest Student Upgrade Prompt Banner */}
      {isGuestStudent && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0C3B2E]/10 via-[#FF5A1F]/10 to-[#FBF9F5] border border-[#0C3B2E]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0C3B2E] bg-[#0C3B2E]/10 px-2 py-0.5 rounded">
                Guest Student Profile Active
              </span>
              <span className="text-xs font-bold text-[#FF5A1F]">{safeCity} Hub</span>
              <span className="text-[11px] text-slate-500 font-medium">· Zero Password Required</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              You are exploring as Guest Student with <strong>38 verified volunteer hours</strong> and <strong>3 official certificates</strong>. Sign in or join to claim this passport and keep your hours across devices.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="px-3.5 py-2 rounded-xl border border-[#0C3B2E]/25 bg-white text-xs font-bold text-[#0C3B2E] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>Upgrade / Join</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 pb-4 border-b border-[#1B4D3E]/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9762B]">
            {safeRole === 'student' ? 'Collegiate Citizen Passport' : 'Verified Host Organization Profile'}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#1D2421] mt-1 tracking-tight">
            Member Passport
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Profile updated
            </span>
          )}

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-white border border-[#1B4D3E]/20 hover:border-[#1B4D3E] text-xs font-semibold text-[#1D2421] transition-colors cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#1B4D3E]" />
              <span>Edit profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-transparent border border-[#1B4D3E]/20 text-xs font-medium text-[#6F756F] hover:text-[#1D2421] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: ID Passport Card OR Form */}
        <div className="lg:col-span-7 space-y-6">
          {!isEditing ? (
            /* Visual Collegiate Passport Card */
            <div className="bg-white rounded-2xl border border-[#1B4D3E]/15 overflow-hidden shadow-xs">
              <div className="h-2.5 bg-gradient-to-r from-[#0C3B2E] via-[#1B4D3E] to-[#FF5A1F]" />

              <div className="p-6 sm:p-8">
                {/* Header zone with Avatar & Monogram */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#1B4D3E]/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-display font-black text-lg shadow-sm">
                      {initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1D2421]">
                          {safeName}
                        </h2>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      </div>

                      <div className="text-xs text-[#6F756F] mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#1B4D3E]">{safeCollege}</span>
                        <span>·</span>
                        <span>{safeCity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] uppercase tracking-wider text-[#6F756F] font-bold">
                      Passport ID
                    </div>
                    <div className="font-mono text-xs font-bold text-[#1D2421] mt-0.5">
                      SGM-{memberIdCode}
                    </div>
                  </div>
                </div>

                {/* Bio / Civic Motivation */}
                <div className="py-5 border-b border-[#F0EBE0]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C5C] mb-1.5">
                    Civic Statement
                  </div>
                  <p className="text-xs text-[#1C1C1C] leading-relaxed">
                    {safeBio}
                  </p>
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-[#F0EBE0] text-xs">
                  <div>
                    <span className="text-[11px] text-[#5C5C5C] block">Email Address</span>
                    <span className="font-medium text-[#1C1C1C]">{currentUser.email || 'guest.student@srmist.edu.in'}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#5C5C5C] block">Institution / Affiliation</span>
                    <span className="font-medium text-[#1C1C1C]">{safeCollege}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#5C5C5C] block">City Location</span>
                    <span className="font-medium text-[#1C1C1C]">{safeCity}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#5C5C5C] block">Network Role</span>
                    <span className="font-medium text-[#1B4D3E] capitalize">
                      {safeRole === 'student' ? 'Collegiate Volunteer' : 'Organization Host'}
                    </span>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="pt-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5C5C] mb-2">
                    Verified Competencies & Focus Areas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {safeSkills.length > 0 ? (
                      safeSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1C1C1C] font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#5C5C5C] italic">No skills added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="bg-[#FAF7F2] px-6 py-3 border-t border-[#E8E2D5] flex items-center justify-between text-[11px] text-[#5C5C5C]">
                <span>Automatic campus grouping active for {safeCollege}</span>
                <span className="text-[#1B4D3E] font-bold">Sangam Network</span>
              </div>
            </div>
          ) : (
            /* Profile Edit Form */
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E8E2D5] p-6 sm:p-8 shadow-xs">
              <div className="pb-4 mb-5 border-b border-[#F0EBE0]">
                <h3 className="font-heading text-lg font-bold text-[#1C1C1C]">
                  Edit Profile & Preferences
                </h3>
                <p className="text-xs text-[#5C5C5C] mt-0.5">
                  Updates to your college will update your automatic team assignment for new programmes.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none"
                  />
                </div>

                {/* College / Institution */}
                <div>
                  <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                    {safeRole === 'student' ? 'College / University *' : 'Organisation Name *'}
                  </label>
                  {safeRole === 'student' ? (
                    <>
                      <select
                        required
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none cursor-pointer"
                      >
                        <option value="">Select your college / university</option>
                        {COLLEGE_GROUPS.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.colleges.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {college === 'Other / Not Listed' && (
                        <input
                          type="text"
                          required
                          placeholder="Enter your college or institution name"
                          value={otherCollegeCustom}
                          onChange={(e) => setOtherCollegeCustom(e.target.value)}
                          className="w-full mt-2 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none"
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none"
                    />
                  )}
                </div>

                {/* City Selection */}
                <div>
                  <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                    City Location *
                  </label>
                  <select
                    required
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none cursor-pointer"
                  >
                    <option value="">Select your city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>

                  {homeCity === 'Other' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter city name"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none"
                    />
                  )}
                </div>

                {/* Bio / Civic Statement */}
                <div>
                  <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                    Civic Statement / Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly state your volunteer interests or civic objectives..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none"
                  />
                </div>

                {/* Skills Tag Management */}
                <div>
                  <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
                    Skills & Competencies
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add a skill (e.g. Teaching, Python)..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={handleAddSkill}
                      className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-2 bg-[#1B4D3E] text-white rounded-md text-xs font-medium cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1C1C1C]"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="text-[#5C5C5C] hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Save and Cancel buttons */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#F0EBE0]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-[#E8E2D5] rounded-md text-xs font-medium text-[#5C5C5C] hover:text-[#1C1C1C]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#1B4D3E] hover:bg-[#13392D] text-white rounded-md text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Official Issued Certificates Section */}
          <div className="bg-white rounded-2xl border border-[#1B4D3E]/15 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1B4D3E]/10">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF5A1F]" />
                <h3 className="font-display text-lg font-bold text-[#1D2421]">
                  Verified Issued Certificates ({certificatesToDisplay.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Cryptographically Signed
              </span>
            </div>

            <div className="space-y-3">
              {certificatesToDisplay.map((cert) => (
                <div
                  key={cert.certificateId}
                  className="p-4 rounded-xl bg-[#FBF9F5] border border-[#0C3B2E]/10 hover:border-[#0C3B2E]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-[#0C3B2E] truncate">
                        {cert.programmeName}
                      </span>
                      <span className="text-[10px] font-bold text-white bg-[#0C3B2E] px-2 py-0.5 rounded-full shrink-0">
                        {cert.volunteerHours} Hours
                      </span>
                    </div>
                    <div className="text-xs text-[#57655F]">
                      Conferred by <strong>{cert.organisationName}</strong> · {cert.completionDate}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      ID: {cert.certificateId}
                    </div>
                  </div>

                  <Link
                    to={`/certificate/${cert.applicationId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-all shadow-2xs shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <span>View & Print</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Collegiate Impact & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Volunteer Impact Meter */}
          <div className="bg-white rounded-2xl border border-[#1B4D3E]/15 p-5 sm:p-6 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5C5C5C] mb-4">
              Collegiate Impact Record
            </h3>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#F0EBE0] pb-3">
                <span className="text-xs text-[#5C5C5C]">Contributed Service</span>
                <span className="font-heading text-2xl font-bold text-[#1B4D3E]">
                  {volunteerHours} hrs
                </span>
              </div>

              <div className="flex items-baseline justify-between border-b border-[#F0EBE0] pb-3">
                <span className="text-xs text-[#5C5C5C]">Active Squads</span>
                <span className="font-semibold text-sm text-[#1C1C1C]">
                  {isGuestStudent ? '1 active squad' : `${activeApps.length} active`}
                </span>
              </div>

              <div className="flex items-baseline justify-between pb-1">
                <span className="text-xs text-[#5C5C5C]">Verified Certificates</span>
                <span className="font-semibold text-sm text-emerald-800">
                  {certificatesToDisplay.length} issued
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#F0EBE0]">
              <Link
                to="/opportunities"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Explore More Opportunities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Campus Grouping Banner */}
          <div className="p-5 rounded-2xl bg-[#1B4D3E]/5 border border-[#1B4D3E]/20 text-xs shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#1B4D3E]">
              <Sparkles className="w-4 h-4 text-[#E9762B]" />
              <span>Campus Auto-Grouping Rule</span>
            </div>
            <p className="text-[11px] text-[#5C5C5C] leading-relaxed">
              When applying for any opportunity in Sangam, you are automatically paired into squads with other students from <strong>{safeCollege}</strong>.
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="text-xs font-bold text-[#0C3B2E] hover:underline inline-flex items-center gap-1"
              >
                <span>Check squad rosters & applications</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
