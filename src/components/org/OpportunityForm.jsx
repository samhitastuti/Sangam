import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Zap, Megaphone, Clock, CheckCircle2 } from 'lucide-react';

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

export default function OpportunityForm({
  initialData = null,
  onSubmit,
  onCancel,
  isSubmitting = false
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Education');
  const [activityFormat, setActivityFormat] = useState('weekly');
  const [timingDetails, setTimingDetails] = useState('');
  const [city, setCity] = useState('Chennai');
  const [customCity, setCustomCity] = useState('');
  const [address, setAddress] = useState('');
  const [duration, setDuration] = useState('2 Weeks');
  const [hours, setHours] = useState(20);
  const [schedule, setSchedule] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [date, setDate] = useState('');
  const [capacity, setCapacity] = useState(25);
  const [skillInput, setSkillInput] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState([]);
  const [error, setError] = useState('');

  // Landmark shortcuts for rapid coordinate & address autofill by city
  const CITY_LANDMARKS = {
    Chennai: [
      { label: 'SRM KTR Campus / Potheri', lat: 12.8230, lng: 80.0444, addr: 'GST Road, Near SRM Arch Gate, Kattankulathur 603203' },
      { label: 'Maraimalai Nagar Community Center', lat: 12.7983, lng: 80.0245, addr: 'Panchayat Community Hall, GST Road, Maraimalai Nagar, Chengalpattu 603209' },
      { label: 'Tambaram Transit & Relief Kitchen', lat: 12.9249, lng: 80.1000, addr: 'Mudichur Road, West Tambaram, Chennai 600045' },
      { label: 'Besant Nagar / Elliot Beach', lat: 12.9984, lng: 80.2678, addr: 'Beach Road, Besant Nagar & Kovalam Center, Chennai 600090' },
      { label: 'Marina Beach Promenade', lat: 13.0500, lng: 80.2824, addr: 'Marina Beach, Kamarajar Salai, Triplicane, Chennai 600005' },
      { label: 'Guindy / IIT Madras', lat: 13.0067, lng: 80.2025, addr: 'Sardar Patel Road, Guindy, Chennai 600036' },
      { label: 'Guduvanchery Health Center', lat: 12.8420, lng: 80.0620, addr: 'Govt Higher Secondary School, Guduvanchery, Chennai 603202' }
    ],
    Delhi: [
      { label: 'Delhi University North Campus', lat: 28.6892, lng: 77.2090, addr: 'Chhatra Marg, North Campus, University of Delhi, Delhi 110007' },
      { label: 'IIT Delhi, Hauz Khas', lat: 28.5450, lng: 77.1926, addr: 'Hauz Khas, New Delhi 110016' },
      { label: 'Yamuna Biodiversity Park Corridor', lat: 28.7180, lng: 77.2340, addr: 'Yamuna Biodiversity Park, Main Wazirabad Road, Delhi 110054' },
      { label: 'Central Delhi Civic Center', lat: 28.6328, lng: 77.2197, addr: 'Connaught Place / Minto Road, New Delhi 110001' }
    ],
    Bengaluru: [
      { label: 'Bellandur Lake Eco-Center', lat: 12.9320, lng: 77.6840, addr: 'Government Model High School, Outer Ring Road, Bellandur, Bengaluru 560103' },
      { label: 'Koramangala Social Work Hub', lat: 12.9352, lng: 77.6245, addr: '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034' },
      { label: 'IISc / Malleshwaram Center', lat: 13.0219, lng: 77.5671, addr: 'CV Raman Rd, Malleshwaram, Bengaluru 560012' }
    ],
    Mumbai: [
      { label: 'Bandra West Community Center', lat: 19.0596, lng: 72.8295, addr: 'Hill Road, Bandra West, Mumbai 400050' },
      { label: 'Thane Flamingo Sanctuary', lat: 19.1800, lng: 72.9800, addr: 'Eastern Express Hwy, Mulund / Thane Mangrove Belt, Mumbai 400081' }
    ],
    Hyderabad: [
      { label: 'Charminar Heritage Learning Center', lat: 17.3616, lng: 78.4747, addr: 'Salar Jung Marg, Pathargatti, Old City, Hyderabad 500002' },
      { label: 'HITEC City Tech for Good Hub', lat: 17.4474, lng: 78.3762, addr: 'Madhapur / HITEC City Corridor, Hyderabad 500081' }
    ],
    Vellore: [
      { label: 'VIT Vellore Campus / Katpadi', lat: 12.9698, lng: 79.1559, addr: 'Tiruvalam Road, Katpadi, Vellore 632014' }
    ]
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'Education');
      setActivityFormat(initialData.activity_format || initialData.activityFormat || 'weekly');
      setTimingDetails(initialData.timing_details || initialData.timingDetails || initialData.schedule || '');
      setAddress(initialData.address || '');
      setDuration(initialData.duration || '2 Weeks');
      setHours(initialData.hours || 20);
      setSchedule(initialData.schedule || '');
      setLatitude(initialData.latitude != null ? String(initialData.latitude) : '');
      setLongitude(initialData.longitude != null ? String(initialData.longitude) : '');

      if (initialData.city && !CITIES.includes(initialData.city)) {
        setCity('Other');
        setCustomCity(initialData.city);
      } else {
        setCity(initialData.city || 'Chennai');
        setCustomCity('');
      }
      if (initialData.date) {
        const d = new Date(initialData.date);
        const iso = d.toISOString().slice(0, 16);
        setDate(iso);
      }
      setCapacity(initialData.capacity || 25);
      setSkillsNeeded(initialData.skillsNeeded || initialData.skills_needed || []);
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      defaultDate.setHours(9, 30, 0, 0);
      setDate(defaultDate.toISOString().slice(0, 16));
      setAddress('Panchayat Community Hall, GST Road, Maraimalai Nagar, Chengalpattu');
      setSchedule('Saturdays & Sundays, 9:30 AM – 1:30 PM');
      setLatitude('12.7983');
      setLongitude('80.0245');
    }
  }, [initialData]);

  const handleLandmarkSelect = (lm) => {
    setAddress(lm.addr);
    setLatitude(String(lm.lat));
    setLongitude(String(lm.lng));
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skillsNeeded.includes(val)) {
        setSkillsNeeded([...skillsNeeded, val]);
        setSkillInput('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsNeeded(skillsNeeded.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Opportunity title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description and impact objectives are required.');
      return;
    }
    const effectiveCity = city === 'Other' && customCity.trim()
      ? customCity.trim()
      : city.trim();

    if (!effectiveCity) {
      setError('City location is required.');
      return;
    }
    if (!address.trim()) {
      setError('Venue / Physical address is required so student volunteers can view location and calculate distance.');
      return;
    }
    if (!date) {
      setError('Date and time are required.');
      return;
    }

    const selectedDate = new Date(date);
    if (selectedDate <= new Date()) {
      setError('Opportunity date must be in the future.');
      return;
    }

    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      setError('Capacity must be at least 1 volunteer spot.');
      return;
    }

    const numHours = parseInt(hours, 10);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      activity_format: activityFormat,
      activityFormat,
      timing_details: timingDetails.trim() || schedule.trim(),
      timingDetails: timingDetails.trim() || schedule.trim(),
      city: effectiveCity,
      address: address.trim(),
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      duration: duration.trim() || '2 Weeks',
      hours: !isNaN(numHours) && numHours > 0 ? numHours : 20,
      schedule: schedule.trim() || timingDetails.trim() || 'Weekend batches',
      date: new Date(date).toISOString(),
      capacity: numCapacity,
      skillsNeeded: skillsNeeded.length > 0 ? skillsNeeded : ['General Volunteering']
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#E8E2D5] p-6 sm:p-8">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F0EBE0]">
        <div>
          <h3 className="font-heading text-xl font-bold text-[#1C1C1C]">
            {initialData ? 'Edit opportunity' : 'Post new volunteer opportunity'}
          </h3>
          <p className="text-xs text-[#5C5C5C] mt-0.5">
            Sangam will automatically organize student applicants from the same college into dedicated squads.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-md text-[#5C5C5C] hover:text-[#1C1C1C] hover:bg-[#FAF7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
            Opportunity title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Yamuna Riverbank Afforestation Drive"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
            Description & impact objectives *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe what the student volunteers will be doing, who they are supporting, and schedule notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
          />
        </div>

        {/* Activity Format Classification & Timing Slots */}
        <div className="p-4 rounded-lg bg-stone-50 border border-[#E8E2D5] space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#0C3B2E] uppercase tracking-wider mb-1">
              Volunteering Activity Format *
            </label>
            <p className="text-[11px] text-[#5C5C5C]">
              Distinguish recurring weekly commitments from single-day blitzes and multi-week public awareness sprints.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Weekly */}
            <button
              type="button"
              onClick={() => {
                setActivityFormat('weekly');
                if (!timingDetails) setTimingDetails('Every Saturday & Sunday, 8:00 AM – 11:30 AM');
              }}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activityFormat === 'weekly'
                  ? 'bg-white border-[#0C3B2E] shadow-sm ring-1 ring-[#0C3B2E]'
                  : 'bg-white/60 border-stone-200 hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  {activityFormat === 'weekly' && <CheckCircle2 className="w-4 h-4 text-[#0C3B2E]" />}
                </div>
                <div className="text-xs font-bold text-[#141C18]">Weekly with Timings</div>
                <p className="text-[10px] text-[#5C5C5C] mt-1 leading-snug">
                  Regular weekly commitments with fixed cohort timing slots (e.g. animal shelter care, weekly tutoring, soup kitchens).
                </p>
              </div>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-2 inline-block self-start">
                Cohort Schedule
              </span>
            </button>

            {/* One-Day Drive */}
            <button
              type="button"
              onClick={() => {
                setActivityFormat('one_day_drive');
                if (!timingDetails) setTimingDetails('Single Day Drive: Saturday, 6:00 AM – 11:30 AM (5.5 hrs)');
              }}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activityFormat === 'one_day_drive'
                  ? 'bg-white border-[#0C3B2E] shadow-sm ring-1 ring-[#0C3B2E]'
                  : 'bg-white/60 border-stone-200 hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  {activityFormat === 'one_day_drive' && <CheckCircle2 className="w-4 h-4 text-[#0C3B2E]" />}
                </div>
                <div className="text-xs font-bold text-[#141C18]">One-Day Drive</div>
                <p className="text-[10px] text-[#5C5C5C] mt-1 leading-snug">
                  High-intensity single-day blitz (e.g. coastal beach cleanup, tree plantation, mega health camp).
                </p>
              </div>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-2 inline-block self-start">
                Single Day Blitz
              </span>
            </button>

            {/* Campaign Sprint */}
            <button
              type="button"
              onClick={() => {
                setActivityFormat('campaign');
                if (!timingDetails) setTimingDetails('3-Week Campaign Sprint: Tue/Thu campus booths + Sat rallies');
              }}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activityFormat === 'campaign'
                  ? 'bg-white border-[#0C3B2E] shadow-sm ring-1 ring-[#0C3B2E]'
                  : 'bg-white/60 border-stone-200 hover:border-stone-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  {activityFormat === 'campaign' && <CheckCircle2 className="w-4 h-4 text-[#0C3B2E]" />}
                </div>
                <div className="text-xs font-bold text-[#141C18]">Awareness Campaign</div>
                <p className="text-[10px] text-[#5C5C5C] mt-1 leading-snug">
                  Multi-week milestone sprint (e.g. voter election awareness, civic literacy, road safety drives).
                </p>
              </div>
              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-2 inline-block self-start">
                Milestone Sprint
              </span>
            </button>
          </div>

          {/* Detailed Timings / Slots field */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#0C3B2E]" />
              <span>
                {activityFormat === 'weekly'
                  ? 'Weekly Timing Slots * (e.g. Saturdays 8:00 AM – 11:30 AM)'
                  : activityFormat === 'one_day_drive'
                  ? 'Drive Hours & Timings * (e.g. Saturday 6:00 AM – 11:30 AM)'
                  : 'Campaign Schedule & Milestones * (e.g. 3-Week Sprint: Weekday booths + Sat rallies)'}
              </span>
            </label>
            <input
              type="text"
              required
              placeholder={
                activityFormat === 'weekly'
                  ? 'e.g., Every Saturday & Sunday, 8:00 AM – 11:30 AM (Weekly Cohort)'
                  : activityFormat === 'one_day_drive'
                  ? 'e.g., Single Day Drive: Saturday, 6:00 AM – 11:30 AM (5.5 hrs)'
                  : 'e.g., 3-Week Sprint: Tue/Thu campus booths (4-6 PM) + Sat public rallies (9 AM-1 PM)'
              }
              value={timingDetails}
              onChange={(e) => {
                setTimingDetails(e.target.value);
                setSchedule(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white border border-[#E8E2D5] focus:border-[#1B4D3E] rounded-md text-xs text-[#1C1C1C] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category and Host City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Initiative Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="Education">Education & Digital Literacy</option>
              <option value="Environment">Ecology & Conservation</option>
              <option value="Healthcare">Healthcare & Wellness</option>
              <option value="Technology">Technology & Rural Engineering</option>
              <option value="Community Action">Community Relief & Civic Action</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Host city *
            </label>
            <select
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">Select host city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'Chennai' ? 'Chennai (SRM Flagship Region)' : c}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>

            {city === 'Other' && (
              <input
                type="text"
                required
                placeholder="Enter city name"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
              />
            )}
          </div>
        </div>

        {/* Physical Address / Venue Location */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-[#1C1C1C]">
              Physical Address / Venue * (Used to calculate distance from students)
            </label>
            <span className="text-[10px] text-[#5C5C5C]">Street, Landmark, Village, Pincode</span>
          </div>
          <input
            type="text"
            required
            placeholder="e.g., Panchayat Community Hall, GST Road, Maraimalai Nagar, Chengalpattu 603209"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
          />

          {/* Quick Landmark Autocomplete */}
          {((CITY_LANDMARKS[city] && CITY_LANDMARKS[city].length > 0) || CITY_LANDMARKS['Chennai']) && (
            <div className="mt-2 p-2.5 rounded bg-[#FAF7F2] border border-[#E8E2D5]/70 text-xs">
              <span className="text-[11px] font-bold text-[#1B4D3E] block mb-1">
                📍 Quick-fill from verified {city && CITY_LANDMARKS[city] ? city : 'Chennai'} venue locations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(CITY_LANDMARKS[city] || CITY_LANDMARKS['Chennai']).map((lm) => (
                  <button
                    key={lm.label}
                    type="button"
                    onClick={() => handleLandmarkSelect(lm)}
                    className="px-2 py-0.5 rounded bg-white hover:bg-[#1B4D3E] hover:text-white border border-[#E8E2D5] text-[11px] text-[#1C1C1C] transition-colors cursor-pointer"
                  >
                    {lm.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Duration and Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Duration of Programme *
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="1 Day">1 Day</option>
              <option value="1 Weekend">1 Weekend (2 Days)</option>
              <option value="2 Weeks">2 Weeks</option>
              <option value="3 Weeks">3 Weeks</option>
              <option value="4 Weeks">4 Weeks (1 Month)</option>
              <option value="6 Weeks">6 Weeks</option>
              <option value="Semester">Full Semester</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Total Volunteer Hours *
            </label>
            <input
              type="number"
              min="1"
              max="200"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Volunteer capacity (spots) *
            </label>
            <input
              type="number"
              min="1"
              max="500"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Schedule & Timing Details */}
        <div>
          <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
            Schedule & Time Slots * (e.g., weekend shifts)
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Saturdays & Sundays, 9:30 AM – 1:30 PM (Bus provided from Campus Arch)"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
          />
        </div>

        {/* Coordinates (Optional / Geocoded) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Latitude (Auto-filled or GPS)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g., 12.8230"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-xs text-[#1C1C1C] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
              Longitude (Auto-filled or GPS)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g., 80.0444"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-xs text-[#1C1C1C] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Start Date and Time */}
        <div>
          <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
            Event date & time * (must be in the future)
          </label>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
          />
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-xs font-medium text-[#1C1C1C] mb-1">
            Skills / tags needed
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. Teaching, Social Media, Python (Press Enter to add)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D5] focus:border-[#1B4D3E] focus:bg-white rounded-md text-sm text-[#1C1C1C] focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3 py-2 bg-[#1B4D3E] hover:bg-[#13392D] text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            {skillsNeeded.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1C1C1C]"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-[#5C5C5C] hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#F0EBE0] mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-[#E8E2D5] text-xs font-medium text-[#5C5C5C] hover:text-[#1C1C1C] transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-md bg-[#1B4D3E] hover:bg-[#13392D] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update opportunity' : 'Publish opportunity'}
        </button>
      </div>
    </form>
  );
}
