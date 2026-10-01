import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { referenceApi } from '../services/api.js';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Building2,
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Compass,
  MapPin,
  BookOpen
} from 'lucide-react';

const CATEGORY_LABELS = {
  IIT: 'IITs',
  NIT: 'NITs',
  VIT: 'VIT',
  SRM: 'SRM',
  UNIVERSITY: 'Central / State Universities',
  OTHER: 'Other Institutions'
};

const POPULAR_CAMPUSES = [
  'SRM Institute of Science and Technology (SRMIST)',
  'VIT Vellore',
  'IIT Madras',
  'Delhi University (DU)',
  'Anna University',
  'IIT Delhi',
  'BITS Pilani',
  'NIT Trichy'
];

const SUGGESTED_SKILLS = [
  'Digital Literacy',
  'Teaching',
  'STEM Mentorship',
  'Environmental Action',
  'Community Mobilization',
  'First Aid & Health',
  'Public Speaking',
  'Python & Web Dev'
];

export default function SignupPage() {
  const { register, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') === 'organization' ? 'organization' : 'student';
  const initialCollegeParam = searchParams.get('college') || searchParams.get('campus') || '';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student specific - college input for automatic team grouping
  const [collegeInput, setCollegeInput] = useState(initialCollegeParam);
  const [course, setCourse] = useState('');

  // Organization specific
  const [organizationName, setOrganizationName] = useState('');
  const [organizationRole, setOrganizationRole] = useState('');

  // City
  const [homeCity, setHomeCity] = useState('');
  const [customCity, setCustomCity] = useState('');

  // Skills
  const [skillsInput, setSkillsInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccessUser, setRegisteredSuccessUser] = useState(null);

  // Dynamic reference data from backend SQL
  const [allCollegesList, setAllCollegesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [isLoadingRefData, setIsLoadingRefData] = useState(true);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        setIsLoadingRefData(true);
        const [collegesRes, citiesRes] = await Promise.all([
          referenceApi.getColleges(),
          referenceApi.getCities()
        ]);

        const colleges = Array.isArray(collegesRes) ? collegesRes : (collegesRes?.data || []);
        const colNames = colleges.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
        // Deduplicate
        const uniqueColleges = Array.from(new Set([...POPULAR_CAMPUSES, ...colNames]));
        setAllCollegesList(uniqueColleges);

        const cities = Array.isArray(citiesRes) ? citiesRes : (citiesRes?.data || []);
        setCitiesList(cities.map(c => typeof c === 'string' ? c : c.name));
      } catch (err) {
        console.warn('Failed to load reference data from API:', err);
        setAllCollegesList(POPULAR_CAMPUSES);
      } finally {
        setIsLoadingRefData(false);
      }
    }

    loadReferenceData();
  }, []);

  // Redirect if authenticated with permanent non-guest account (and not in the middle of showing the success modal)
  useEffect(() => {
    if (currentUser && !currentUser.isGuest && currentUser.id !== 'user_guest_student' && !registeredSuccessUser) {
      if (currentUser.role === 'organization') {
        navigate('/org-dashboard');
      } else {
        navigate('/browse');
      }
    }
  }, [currentUser, registeredSuccessUser, navigate]);

  // Prefill college and city if upgrading from Guest Student profile
  useEffect(() => {
    if (currentUser?.isGuest || currentUser?.id === 'user_guest_student') {
      if (!collegeInput && currentUser.college) {
        setCollegeInput(currentUser.college);
      }
      if (!homeCity && (currentUser.homeCity || currentUser.home_city)) {
        setHomeCity(currentUser.homeCity || currentUser.home_city);
      }
    }
  }, [currentUser]);

  const handleToggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleQuickCampusSelect = (campusName) => {
    setCollegeInput(campusName);
    if (!homeCity) {
      if (campusName.includes('SRM') || campusName.includes('Madras') || campusName.includes('Anna')) {
        setHomeCity('Chennai');
      } else if (campusName.includes('VIT')) {
        setHomeCity('Vellore');
      } else if (campusName.includes('Delhi')) {
        setHomeCity('Delhi');
      } else if (campusName.includes('Bengaluru') || campusName.includes('IISc')) {
        setHomeCity('Bengaluru');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const effectiveCollege = role === 'student' ? collegeInput.trim() : '';

    const effectiveCity = homeCity === 'Other' && customCity.trim()
      ? customCity.trim()
      : homeCity.trim();

    // Validations
    if (!name.trim()) return setError('Full name is required.');
    if (!email.trim()) return setError('Email address is required.');
    if (!password) return setError('Password is required.');
    if (password.length < 6) return setError('Password must be at least 6 characters long.');

    if (role === 'student') {
      if (!effectiveCollege) {
        return setError('Please input your college or university name to activate automatic team grouping.');
      }
      if (!effectiveCity) {
        return setError('Please select your home or campus city.');
      }
    } else {
      if (!organizationName.trim()) return setError('Organization name is required.');
      if (!effectiveCity) return setError('Please select your organization base city.');
    }

    // Merge chip skills with manual typed skills
    const typedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const combinedSkills = Array.from(new Set([...selectedSkills, ...typedSkills]));

    if (combinedSkills.length === 0) {
      return setError(role === 'organization' ? 'Please specify at least one focus area.' : 'Please select or enter at least one skill or interest.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return setError('Please enter a valid email address.');
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        homeCity: effectiveCity,
        city: effectiveCity,
        skills: combinedSkills
      };

      if (role === 'student') {
        payload.college = effectiveCollege;
        payload.course = course.trim();
      } else {
        payload.organization_name = organizationName.trim();
        payload.organizationName = organizationName.trim();
        payload.organization_city = effectiveCity;
        payload.organization_role = organizationRole.trim() || 'Coordinator';
        payload.focus_areas = combinedSkills.join(', ');
      }

      const user = await register(payload);
      setRegisteredSuccessUser(user);
    } catch (err) {
      setError(err.message || 'Failed to sign up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derive predicted squad name from college input
  const predictedSquadName = collegeInput.trim()
    ? `${collegeInput.trim()} Squad`
    : 'Your Campus Squad';

  const isSrm = collegeInput.toLowerCase().includes('srm');
  const isVit = collegeInput.toLowerCase().includes('vit');
  const isDu = collegeInput.toLowerCase().includes('delhi');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Registration Success Modal with Automatic Team Grouping Confirmation */}
      {registeredSuccessUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#0C3B2E]/20 text-center animate-fadeIn space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0C3B2E] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5A1F] mb-1">
                Collegiate Team Grouping Active
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#141C18] uppercase">
                Welcome to Sangam,<br />{registeredSuccessUser.name}!
              </h2>
            </div>

            <div className="p-4 rounded-lg bg-[#0C3B2E]/5 border border-[#0C3B2E]/15 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#0C3B2E]">
                <Building2 className="w-4 h-4 text-[#FF5A1F]" />
                <span>Assigned Campus Squad:</span>
              </div>
              <div className="text-sm font-extrabold text-[#141C18]">
                {registeredSuccessUser.college ? `${registeredSuccessUser.college} Squad` : 'Sangam Squad'}
              </div>
              <p className="text-[#57655F] leading-relaxed pt-1">
                Your automatic team grouping feature is now enabled. Whenever you apply to any community initiative, you will automatically be paired with fellow students from <strong>{registeredSuccessUser.college}</strong>!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/opportunities')}
                className="flex-1 py-3 px-4 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Browse Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="py-3 px-4 rounded border border-[#0C3B2E]/20 hover:bg-[#0C3B2E]/5 text-[#0C3B2E] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                View My Squads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* LEFT COLUMN: Editorial Brand & Automatic Team Grouping Explainer */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5A1F]/10 text-[#FF5A1F] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Collegiate Squad Network</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-[#141C18] uppercase leading-[0.95]">
              Register<br />
              with your<br />
              <span className="text-[#0C3B2E]">Campus</span>.
            </h1>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-[#141C18] font-medium leading-relaxed">
            <p className="border-l-2 border-[#FF5A1F] pl-3">
              Input your college name to enable Sangam's <strong>Automatic Team Grouping Feature</strong>.
            </p>
            <p className="text-xs sm:text-sm text-[#57655F]">
              No more awkward solo signups. When you apply for any civic programme, our algorithm groups you into an institutional team with students from your campus.
            </p>
          </div>

          {/* Key Pillars */}
          <div className="space-y-3 pt-4 border-t border-[#0C3B2E]/10 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-[#0C3B2E]/10 text-[#0C3B2E] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-[#141C18] block">Automatic Collegiate Squads</strong>
                <span className="text-[#57655F]">Shared transport, coordinated volunteer shifts, and collaborative impact with classmates.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-[#FF5A1F]/10 text-[#FF5A1F] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-[#141C18] block">Verified Campus Credentials</strong>
                <span className="text-[#57655F]">Cryptographically signed completion certificates co-branded with your institution.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-[#141C18] block">Proximity & Duration Filtering</strong>
                <span className="text-[#57655F]">Sort opportunities by transit distance and filter by duration (1 Day, Weekend, 2–4 Weeks).</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#0C3B2E]/10">
            <div className="italic text-xs text-[#57655F] leading-relaxed">
              "Sangam paired 9 of us from SRM Kattankulathur into a unified squad for the digital literacy outreach. Having your classmates alongside makes all the difference."
            </div>
            <div className="text-[11px] font-bold text-[#0C3B2E] mt-1">
              — Divya S., SRMIST B.Tech Biotech
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Registration Form with Interactive College Input */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-[#0C3B2E]/15 shadow-sm">
          
          {/* Role Toggle */}
          <div className="flex items-center gap-6 pb-5 mb-6 border-b border-[#0C3B2E]/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                setError('');
              }}
              className={`pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                role === 'student'
                  ? 'border-b-2 border-[#0C3B2E] font-bold text-[#0C3B2E]'
                  : 'text-[#57655F] hover:text-[#141C18]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student volunteer (Auto-Grouping)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('organization');
                setError('');
              }}
              className={`pb-1 transition-colors cursor-pointer flex items-center gap-1.5 ${
                role === 'organization'
                  ? 'border-b-2 border-[#0C3B2E] font-bold text-[#0C3B2E]'
                  : 'text-[#57655F] hover:text-[#141C18]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Host organization / NGO</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                {role === 'organization' ? 'Representative / Coordinator name' : 'Student Full Name'} <span className="text-[#FF5A1F]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={role === 'organization' ? 'e.g. Dr. Ramesh Kumar' : 'e.g. Aarav Nair or Sneha Krishnan'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                {role === 'organization' ? 'Organization Email' : 'Email Address'} <span className="text-[#FF5A1F]">*</span>
              </label>
              <input
                type="email"
                required
                placeholder={role === 'organization' ? 'outreach@foundation.org' : 'e.g. student@srmist.edu.in or name@gmail.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-[#57655F] mt-1">
                Institutional college emails (.edu.in, .ac.in) or personal email addresses are both welcome.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                Password <span className="font-normal text-[#57655F] lowercase">(minimum 6 characters)</span> <span className="text-[#FF5A1F]">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
              />
            </div>

            {/* STUDENT SPECIFIC: COLLEGE NAME INPUT & AUTOMATIC TEAM GROUPING ENGINE */}
            {role === 'student' ? (
              <div className="space-y-3 pt-2">
                <div className="bg-[#0C3B2E]/5 border border-[#0C3B2E]/15 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#0C3B2E] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#FF5A1F]" />
                      <span>College / University Name</span>
                      <span className="text-[#FF5A1F]">*</span>
                    </label>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Team Grouping Trigger
                    </span>
                  </div>

                  {/* Free-text input with datalist auto-suggestions */}
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="colleges-datalist"
                      placeholder="Type or select your college (e.g. SRM Institute of Science and Technology)"
                      value={collegeInput}
                      onChange={(e) => setCollegeInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#0C3B2E]/30 focus:border-[#0C3B2E] rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none font-medium shadow-2xs"
                    />

                    {/* Datalist for automatic browser suggestions */}
                    <datalist id="colleges-datalist">
                      {allCollegesList.map((colName) => (
                        <option key={colName} value={colName} />
                      ))}
                    </datalist>
                  </div>

                  {/* Quick-Select Campus Chips for 1-click input */}
                  <div>
                    <div className="text-[11px] font-bold text-[#57655F] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <span>Quick Select Popular Campuses:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_CAMPUSES.map((campus) => {
                        const isSelected = collegeInput === campus;
                        return (
                          <button
                            key={campus}
                            type="button"
                            onClick={() => handleQuickCampusSelect(campus)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0C3B2E] text-white shadow-2xs font-bold'
                                : 'bg-white hover:bg-stone-100 text-[#141C18] border border-[#0C3B2E]/20'
                            }`}
                          >
                            {campus.includes('SRMIST') ? '★ SRMIST KTR' : campus}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Automatic Team Grouping Feature Card */}
                  <div className={`p-3.5 rounded-lg border transition-all ${
                    collegeInput.trim()
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : 'bg-white border-stone-200 text-[#57655F]'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold pb-1.5 border-b border-emerald-200/60 mb-2">
                      <span className="flex items-center gap-1.5 text-emerald-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Automatic Team Grouping Feature:</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        collegeInput.trim() ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {collegeInput.trim() ? '✓ Active' : 'Enter College'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="font-extrabold text-sm text-[#0C3B2E]">
                        Target Squad: {predictedSquadName}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#141C18]/80">
                        Whenever you apply to any civic programme on Sangam, the auto-matching engine places you directly in the <strong>{predictedSquadName}</strong> with fellow students from your campus.
                      </p>

                      {/* Campus specific peer callouts */}
                      {isSrm && (
                        <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>3 active squads in Chennai · 9 student volunteers registered from SRMIST</span>
                        </div>
                      )}

                      {isVit && (
                        <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active collegiate cohort in Vellore & Chennai · 4 student peers</span>
                        </div>
                      )}

                      {isDu && (
                        <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active collegiate cohort in Delhi · Riverbank afforestation drive</span>
                        </div>
                      )}

                      {!isSrm && !isVit && !isDu && collegeInput.trim() && (
                        <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>You'll be registered as a member of {predictedSquadName}! Classmates will auto-join you.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Course / Degree / Major */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                    Degree / Course / Major <span className="font-normal text-[#57655F] lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech Computer Science, Biotechnology, B.A. Economics"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-[#57655F] mt-1">
                    Displayed alongside your squad profile for skill-based team role assignment.
                  </p>
                </div>
              </div>
            ) : (
              /* ORGANIZATION SPECIFIC FIELDS */
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                    Organization name <span className="text-[#FF5A1F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GreenEarth India Foundation, TeachAll Trust"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Outreach Coordinator, Program Director"
                    value={organizationRole}
                    onChange={(e) => setOrganizationRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* City Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                {role === 'organization' ? 'Organization Base City' : 'Home / Campus City'} <span className="text-[#FF5A1F]">*</span>
              </label>
              <select
                required
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] focus:outline-none transition-colors cursor-pointer font-medium"
              >
                <option value="">Select your city</option>
                {citiesList.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName === 'Chennai' ? '★ Chennai (SRM Flagship Region)' : cityName}
                  </option>
                ))}
              </select>

              {homeCity === 'Other' && (
                <input
                  type="text"
                  required
                  placeholder="Enter your city name"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full mt-2 px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] focus:outline-none"
                />
              )}
            </div>

            {/* Skills & Focus Areas */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141C18] mb-1">
                {role === 'organization' ? 'Focus areas & causes' : 'Skills and Interests'} <span className="text-[#FF5A1F]">*</span>
              </label>
              
              {/* Quick skill selection pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {SUGGESTED_SKILLS.map((skill) => {
                  const isChecked = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        isChecked
                          ? 'bg-[#0C3B2E] text-white shadow-2xs font-bold'
                          : 'bg-[#0C3B2E]/5 text-[#0C3B2E] hover:bg-[#0C3B2E]/10 border border-[#0C3B2E]/15'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder={role === 'organization' ? 'e.g. Education, Health, Environment' : 'Add custom skills (comma-separated, e.g. Design, Logistics)'}
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FBF9F5] border border-[#0C3B2E]/20 focus:border-[#0C3B2E] focus:bg-white rounded text-xs sm:text-sm text-[#141C18] placeholder-[#57655F]/60 focus:outline-none transition-colors"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingRefData}
                className="w-full py-3.5 px-6 bg-[#0C3B2E] hover:bg-[#07251D] text-white font-bold text-xs uppercase tracking-wider transition-all rounded shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Registering & Activating Squad...</span>
                ) : (
                  <>
                    <span>
                      {role === 'student'
                        ? 'Complete Registration & Enable Team Grouping'
                        : 'Register Organization Host'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Already registered */}
            <div className="pt-4 border-t border-[#0C3B2E]/10 text-xs text-[#57655F] text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0C3B2E] font-bold hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
