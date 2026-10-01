import React, { useState } from 'react';
import { ArrowDown, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CollegeMatchingSection() {
  const [selectedCollege, setSelectedCollege] = useState('SRM Kattankulathur (KTR)');
  const navigate = useNavigate();

  const rosters = {
    'SRM Kattankulathur (KTR)': {
      college: 'SRM KATTANKULATHUR (KTR)',
      city: 'Chennai',
      campusLocation: 'Kattankulathur Campus, Chennai',
      members: [
        { name: 'Karthik Subramanian', branch: 'B.Tech CSE', role: 'Fullstack & Squad Lead' },
        { name: 'Divya Sundaram', branch: 'B.Tech Biotech', role: 'Field Health & Triage' },
        { name: 'Sneha Krishnan', branch: 'B.Tech CSE', role: 'Interactive Curriculum' },
        { name: 'You', branch: 'Your Course', role: 'Squad Teammate' }
      ],
      programme: 'DIGITAL LITERACY OUTREACH',
      programmeId: 'opp_digital_literacy',
      location: 'Chennai · North Learning Centers',
      dates: '18 October 2026'
    },
    'VIT Vellore': {
      college: 'VIT VELLORE',
      city: 'Vellore',
      campusLocation: 'Vellore Campus',
      members: [
        { name: 'Aarav Sharma', branch: 'Computer Science', role: 'Fullstack & Mentorship' },
        { name: 'Meera Patel', branch: 'Electronics & Comm', role: 'Hardware & Audio Lab' },
        { name: 'Riya Singh', branch: 'Computer Science', role: 'Curriculum & Outreach' },
        { name: 'You', branch: 'Your Course', role: 'Squad Teammate' }
      ],
      programme: 'DIGITAL LITERACY OUTREACH',
      programmeId: 'opp_digital_literacy',
      location: 'Chennai · North Learning Centers',
      dates: '18 October 2026'
    },
    'Anna University': {
      college: 'ANNA UNIVERSITY',
      city: 'Chennai',
      campusLocation: 'Guindy Campus, Chennai',
      members: [
        { name: 'Meera Krishnan', branch: 'Marine Science', role: 'Estuary Telemetry' },
        { name: 'Vignesh R', branch: 'Environmental Eng', role: 'Soil & Water Sampling' },
        { name: 'Kavitha S', branch: 'Chemical Eng', role: 'Microplastics Audit' },
        { name: 'You', branch: 'Your Course', role: 'Squad Teammate' }
      ],
      programme: 'ADYAR ESTUARY MANGROVE NURSERY',
      programmeId: 'opp_chennai_coastal',
      location: 'Chennai · Adyar Estuary',
      dates: '24 October 2026'
    },
    'Delhi University': {
      college: 'DELHI UNIVERSITY',
      city: 'Delhi',
      campusLocation: 'North Campus, Delhi',
      members: [
        { name: 'Priya Verma', branch: 'Literature & Media', role: 'Communications & Photo' },
        { name: 'Rohan Mehta', branch: 'Environmental Sci', role: 'Soil & Sapling Prep' },
        { name: 'Sneha Patel', branch: 'Economics', role: 'Field Audits' },
        { name: 'You', branch: 'Your Course', role: 'Squad Teammate' }
      ],
      programme: 'YAMUNA BIODIVERSITY CORRIDOR DRIVE',
      programmeId: 'opp_tree_plantation',
      location: 'Delhi · Riverbank Corridor',
      dates: '15 October 2026'
    }
  };

  const currentRoster = rosters[selectedCollege] || rosters['SRM Kattankulathur (KTR)'];

  const handleFindForCampus = () => {
    // Navigate directly to opportunities filtered for this campus/city
    navigate(`/opportunities?city=${encodeURIComponent(currentRoster.city)}&campus=${encodeURIComponent(currentRoster.college)}`);
  };

  return (
    <section id="campus-squads" className="py-14 sm:py-20 bg-[#0C3B2E] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header with Clean Left Alignment and Balanced Sizing */}
        <div className="max-w-3xl mb-10 sm:mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623] mb-2 font-display">
            Automatic Collegiate Teaming
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white uppercase">
            Who you study with<br />
            can shape who you <span className="text-[#FF5A1F]">work with</span>.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed font-normal">
            Sangam groups students from SRM Kattankulathur into unified teams when they apply for the same initiative. No awkward solo signups or isolated volunteering.
          </p>

          {/* College Selector Buttons for Live Demonstration */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/60 mr-2 font-medium">Select Campus Squad:</span>
            {Object.keys(rosters).map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollege(col)}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  selectedCollege === col
                    ? 'bg-white text-[#0C3B2E] shadow-sm ring-2 ring-[#FF5A1F]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {col === 'SRM Kattankulathur (KTR)' ? '★ ' + col : col}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Editorial Composition Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#07251D] border border-white/10 rounded-lg p-6 sm:p-10 lg:p-12 relative">
          
          {/* Left Column: Campus Squad Roster */}
          <div className="lg:col-span-6 space-y-6">
            <div className="pb-4 border-b border-white/15">
              <div className="text-xs font-bold tracking-widest text-[#F5A623] uppercase font-display">
                Collegiate Squad Match
              </div>
              <div className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
                {currentRoster.college}
              </div>
              <div className="text-xs text-white/70 mt-1">
                4 Students paired automatically by institutional affiliation
              </div>
            </div>

            {/* Teammates List with Minimal Editorial Bullets */}
            <div className="space-y-3.5">
              {currentRoster.members.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F]" />
                    <div>
                      <span className="font-semibold text-sm text-white">
                        {member.name}
                      </span>
                      {member.name === 'You' && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-[#FF5A1F] text-white px-1.5 py-0.5 rounded">
                          Your Slot
                        </span>
                      )}
                      <div className="text-xs text-white/60">
                        {member.branch}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-white/80 font-mono hidden sm:inline">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-white/60 flex items-center gap-1.5 pt-2">
              <Check className="w-4 h-4 text-[#F5A623]" />
              <span>Matched through your institution — zero coordination overhead.</span>
            </div>
          </div>

          {/* Middle Flow Arrow */}
          <div className="lg:col-span-1 flex justify-center py-2 lg:py-0">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[#F5A623]">
              <ArrowDown className="w-6 h-6 lg:transform lg:-rotate-90" />
            </div>
          </div>

          {/* Right Column: Matched Programme Result */}
          <div className="lg:col-span-5 bg-[#0C3B2E] p-6 sm:p-8 rounded border border-white/15 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold tracking-widest text-[#FF5A1F] uppercase mb-1 font-display">
                Joined Programme
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-white leading-tight">
                {currentRoster.programme}
              </h3>

              <div className="text-xs text-white/70 mt-3 space-y-1">
                <div>Location: <strong className="text-white">{currentRoster.location}</strong></div>
                <div>Timeline: <strong className="text-white">{currentRoster.dates}</strong></div>
                <div>Squad Format: <strong className="text-white">Cohort of 4 peers</strong></div>
              </div>

              <p className="text-xs text-white/80 leading-relaxed mt-4 pt-4 border-t border-white/10">
                You travel together, collaborate in the field, and receive a joint verified completion credential endorsed by the host organization.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={handleFindForCampus}
                className="w-full py-3 px-4 rounded bg-[#FF5A1F] hover:bg-[#E04810] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <span>Find programmes for {currentRoster.college}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/signup?role=student&college=${encodeURIComponent(currentRoster.college)}`)}
                className="w-full py-2.5 px-3 rounded bg-white hover:bg-stone-100 text-[#0C3B2E] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Register Your College & Enable Auto-Grouping</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/opportunities/${currentRoster.programmeId}`)}
                className="w-full py-2 px-3 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View {currentRoster.programme}</span>
                <span>→</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
