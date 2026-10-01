import React, { useState } from 'react';
import { Quote, ArrowRight, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ImpactStorySection() {
  const [activeStory, setActiveStory] = useState(0);
  const navigate = useNavigate();

  const stories = [
    {
      id: 0,
      name: 'Karthik Subramanian',
      college: 'SRM Kattankulathur (KTR)',
      course: 'B.Tech Computer Science & Eng.',
      programme: 'Rural Digital Literacy & Smartphone Safety',
      opportunityId: 'opp_digital_literacy',
      location: 'Chennai',
      image: '/src/assets/images/srm_student_lead_1790532310998.jpg',
      quote:
        'Walking in with my SRM Kattankulathur peers changed everything. We coordinated carpools from the KTR campus, distributed hardware setup and teaching modules, and within three weekends trained 240 children and self-help group mothers in computer and mobile payment fundamentals.',
      details:
        'Karthik led the SRM engineering cohort at the North Chennai Community Learning Center, delivering hands-on Python and web basics to middle school students.'
    },
    {
      id: 1,
      name: 'Sneha Krishnan & Arjun Varma',
      college: 'SRM Kattankulathur (KTR)',
      course: 'Biotech & Civil Eng.',
      programme: 'Kovalam Beach & Besant Nagar Marine Waste Audit',
      opportunityId: 'opp_coastal_waste_audit',
      location: 'Chennai',
      image: '/src/assets/images/srm_coastal_cleanup_1790532259292.jpg',
      quote:
        'Starting at 6 AM at Kovalam beach with 45 fellow SRMites, we collected 850kg of plastic debris and logged tidal microplastics with marine researchers. Having our campus squad beside us made every hour deeply rewarding.',
      details:
        'Mobilized SRM Green Cell members to conduct shoreline debris recovery and operated citizen sorting booths alongside Chennai Climate Action.'
    },
    {
      id: 2,
      name: 'Divya Sundaram',
      college: 'SRM Kattankulathur (KTR)',
      course: 'B.Tech Biotechnology',
      programme: 'Community Health & Preventive Wellness Camp',
      opportunityId: 'opp_community_health_camp',
      location: 'Chennai',
      image: '/src/assets/images/opp_vision_clinic_1790570208128.jpg',
      quote:
        'When you conduct health vitals screening with your university classmates, the clinic runs like clockwork. We screened over 800 rural residents and pediatric students in Kanchipuram district alongside SRM Medical College doctors.',
      details:
        'Biotechnology pre-med student coordinating primary vitals recording, vision acuity testing, and diabetes awareness counseling for peri-urban families.'
    },
    {
      id: 3,
      name: 'Aarav Nair & Meera Raman',
      college: 'VIT Vellore',
      course: 'B.Tech CS & ECE',
      programme: 'Children Community Library & Book Bank Drive',
      opportunityId: 'opp_slum_library_setup',
      location: 'Hyderabad',
      image: '/src/assets/images/srm_library_story_1790570169598.jpg',
      quote:
        'Setting up open-access reading nooks and storytelling hours in municipal schools was pure joy. Watching 120 children eagerly line up for picture books showed us how collegiate youth can ignite real reading habits.',
      details:
        'Curated over 1,500 children books, painted vibrant reading corners, and conducted interactive bilingual read-aloud sessions.'
    },
    {
      id: 4,
      name: 'Vikram Raghavan & Kavya Balaji',
      college: 'IIT Madras',
      course: 'B.Tech Mechanical & Electrical',
      programme: 'Rooftop Solar & Energy Access Baseline Survey',
      opportunityId: 'opp_rural_solar_survey',
      location: 'Delhi',
      image: '/src/assets/images/story_solar_village_1790570221710.jpg',
      quote:
        'Deploying digital multimeters and solar rooftop feasibility audits with artisan weavers showed us classroom engineering in the real world. We audited 200 off-grid micro-workshops in two weeks.',
      details:
        'Evaluated solar battery setups, estimated peak load requirements, and delivered clean energy transition roadmaps for peri-urban weaving cooperatives.'
    },
    {
      id: 5,
      name: 'Rahul Malhotra & Priya Verma',
      college: 'University of Delhi',
      course: 'B.Sc. Environmental Science',
      programme: 'Bellandur & Yamuna Micro-Wetland Rejuvenation',
      opportunityId: 'opp_bengaluru_lake_revival',
      location: 'Bengaluru',
      image: '/src/assets/images/opp_lake_restoration_1790570182484.jpg',
      quote:
        'Waking up before dawn to test water quality, map native flora, and clear secondary feeder channels proved the power of campus cohorts. We logged 180 field data points and restored shoreline biodiversity.',
      details:
        'Partnered with citizen scientists to monitor water clarity, nitrate levels, and bird migratory corridors along key suburban urban lakes.'
    }
  ];

  const current = stories[activeStory];

  return (
    <section id="stories" className="py-16 sm:py-20 border-b border-[#0C3B2E]/10 bg-[#FBF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#0C3B2E] mb-2 font-display">
              Voices of Sangam · Field Dispatches
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#141C18] uppercase leading-tight">
              The people behind<br />
              <span className="text-[#FF5A1F]">the community impact</span>.
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-xs sm:text-sm text-[#57655F] max-w-sm leading-relaxed">
              Real SRM Kattankulathur student volunteers who stepped outside lecture halls to build real community solutions alongside peers.
            </p>
            <Link
              to="/stories"
              className="px-4 py-2.5 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Read All Stories / Blog</span>
            </Link>
          </div>
        </div>

        {/* Horizontal Editorial Image Strip (6-story visual showcase) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-10">
          {stories.map((story, idx) => {
            const isSelected = activeStory === idx;
            return (
              <div
                key={story.id}
                onClick={() => setActiveStory(idx)}
                className={`group relative rounded overflow-hidden cursor-pointer transition-all duration-300 border ${
                  isSelected
                    ? 'border-[#0C3B2E] ring-2 ring-[#0C3B2E] shadow-md scale-[1.02]'
                    : 'border-[#0C3B2E]/15 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="h-56 sm:h-64 lg:h-72 w-full bg-stone-200 overflow-hidden relative">
                  <img
                    src={story.image}
                    alt={story.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isSelected ? 'scale-105' : 'group-hover:scale-102'
                    }`}
                  />
                  {/* Subtle Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                </div>

                {/* Editorial Caption on Image */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-white">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-[#F5A623] font-display line-clamp-1">
                    {story.college}
                  </div>
                  <div className="font-display text-sm sm:text-base font-bold leading-tight mt-0.5 line-clamp-1">
                    {story.name}
                  </div>
                  <div className="text-[11px] text-white/80 mt-0.5 font-medium line-clamp-1">
                    {story.programme}
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Reference 1 Styled Quote & Reading Box */}
        <div className="border border-[#FF5A1F]/30 rounded-lg p-6 sm:p-10 lg:p-12 bg-white relative shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Big Quotation Mark & Blockquote */}
            <div className="lg:col-span-8 space-y-4">
              <Quote className="w-10 h-10 text-[#FF5A1F] opacity-80" />
              <blockquote className="font-serif-quote italic text-xl sm:text-2xl lg:text-3xl text-[#141C18] leading-relaxed">
                "{current.quote}"
              </blockquote>

              <div className="pt-4 border-t border-[#0C3B2E]/10">
                <div className="font-display text-base font-bold text-[#0C3B2E]">
                  — {current.name}, {current.course}
                </div>
                <div className="text-xs text-[#57655F]">
                  {current.college} · {current.programme}
                </div>
              </div>
            </div>

            {/* Right Column: Key Details & Direct Action Buttons */}
            <div className="lg:col-span-4 bg-[#FBF9F5] p-5 sm:p-6 rounded border border-[#0C3B2E]/10 space-y-4 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#0C3B2E] font-display">
                Programme Overview
              </div>
              <p className="text-[#57655F] leading-relaxed">
                {current.details}
              </p>
              <div className="pt-3 border-t border-[#0C3B2E]/10 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#57655F]">Institution:</span>
                  <span className="font-bold text-[#141C18]">{current.college}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655F]">Location:</span>
                  <span className="font-bold text-[#141C18]">{current.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#57655F]">Cohort Format:</span>
                  <span className="font-bold text-[#0C3B2E]">Collegiate Squad</span>
                </div>
              </div>

              {/* Action Buttons connected to Programme and Stories */}
              <div className="pt-4 border-t border-[#0C3B2E]/10 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate(`/opportunities/${current.opportunityId}`)}
                  className="w-full py-2.5 px-3 rounded bg-[#0C3B2E] hover:bg-[#07251D] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Join this programme</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/stories')}
                  className="w-full py-2 px-3 rounded border border-[#0C3B2E]/20 hover:border-[#0C3B2E] text-[#141C18] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  <span>Read full dispatch / blog</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
