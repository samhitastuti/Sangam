import React from 'react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Create your profile',
      description: 'Sign up in seconds and specify your skills, course branch, and civic interests.'
    },
    {
      num: '02',
      title: 'Tell us where you study',
      description: 'Select your college or university to activate automated campus clustering for every programme.'
    },
    {
      num: '03',
      title: 'Join a programme',
      description: 'Pick an initiative that excites you — from environmental restoration to digital literacy outreach.'
    },
    {
      num: '04',
      title: 'Get automatically grouped',
      description: 'Sangam clusters you with classmates from your campus into a cohesive, ready working squad.'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-b border-[#1B4D3E]/10 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-14 sm:mb-18">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9762B] mb-2">
            Simple 4-Step Mechanism
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1D2421] uppercase leading-none">
            How it works.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6F756F] leading-relaxed">
            Zero awkward solo volunteering. Every signup seamlessly channels into campus impact teams.
          </p>
        </div>

        {/* 4-Step Horizontal Timeline Mechanism */}
        <div className="relative">
          
          {/* Connecting Hairline */}
          <div className="hidden lg:block absolute top-7 left-8 right-8 h-[1px] bg-[#1B4D3E]/20 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={step.num} className="space-y-4">
                
                {/* Step Number Circle */}
                <div className="w-14 h-14 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-display font-black text-base shadow-xs">
                  {step.num}
                </div>

                <div className="space-y-1.5 pt-1">
                  <h3 className="font-display text-lg font-bold text-[#1D2421]">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6F756F] leading-relaxed">
                    {step.description}
                  </p>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
