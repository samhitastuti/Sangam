import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  Menu,
  QrCode,
  Compass,
  BookOpen,
  User,
  ArrowRight
} from 'lucide-react';
import GeofencedCheckinModal from '../checkin/GeofencedCheckinModal.jsx';

/**
 * Slim Persistent Top Navigation Bar
 * Contains ONLY:
 * - Hamburger button (on screens < 900px)
 * - Brand Logo
 * - Main nav links: Drives (/opportunities), Dispatches (/stories), Profile (/profile)
 * - Primary CTA: Check-In button (40px height, 10px radius, nowrap, 8px gap)
 * - One avatar/account button (40px height, 10px radius)
 * Pinned to the right with >= 16px gap from Profile, zero overflow, vertically centered.
 */
export default function Navbar({ onOpenMobileSidebar }) {
  const { currentUser, isGuestStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [checkinModalOpen, setCheckinModalOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const getInitials = () => {
    if (!currentUser?.name) return 'GS';
    return currentUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="no-print sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#0C3B2E]/10">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Left Zone: Hamburger (screens < 900px) + Brand Logo + Main Nav */}
            <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 min-w-0">
              
              {/* Hamburger Button: visible on screens under 900px to open the Left Sidebar drawer */}
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="min-[900px]:hidden h-10 w-10 flex items-center justify-center rounded-[10px] border border-[#0C3B2E]/15 bg-white text-[#0C3B2E] hover:border-[#0C3B2E] active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
                aria-label="Open sidebar menu"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Brand Wordmark & Icon */}
              <Link to="/browse" className="group flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="w-9 h-9 rounded-[10px] bg-[#0C3B2E] text-white flex items-center justify-center font-display font-black text-base shadow-2xs group-hover:bg-[#07251D] transition-colors">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-[#0C3B2E] block leading-none">
                    SANGAM
                  </span>
                  <span className="hidden sm:block text-[8px] uppercase tracking-[0.2em] font-bold text-[#FF5A1F] mt-0.5 leading-none">
                    Collegiate Network
                  </span>
                </div>
              </Link>

              {/* Main Nav Links: Exactly 3 links (Drives, Dispatches, Profile) */}
              <nav className="hidden sm:flex items-center gap-5 md:gap-7 text-sm font-semibold ml-2 sm:ml-4">
                
                {/* 1. Explore Opportunities (/opportunities) */}
                <Link
                  to="/opportunities"
                  className={`py-1.5 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive('/opportunities') || isActive('/explore')
                      ? 'text-[#0C3B2E] font-bold border-b-2 border-[#0C3B2E]'
                      : 'text-[#57655F] hover:text-[#141C18]'
                  }`}
                >
                  <Compass className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Explore Opportunities</span>
                </Link>

                {/* 2. Dispatches (/stories) */}
                <Link
                  to="/stories"
                  className={`py-1.5 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive('/stories')
                      ? 'text-[#0C3B2E] font-bold border-b-2 border-[#0C3B2E]'
                      : 'text-[#57655F] hover:text-[#141C18]'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-[#0C3B2E]" />
                  <span>Dispatches</span>
                </Link>

                {/* 3. Profile (/profile) */}
                <Link
                  to="/profile"
                  className={`py-1.5 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive('/profile')
                      ? 'text-[#0C3B2E] font-bold border-b-2 border-[#0C3B2E]'
                      : 'text-[#57655F] hover:text-[#141C18]'
                  }`}
                >
                  <User className="w-4 h-4 text-[#57655F]" />
                  <span>Profile</span>
                </Link>
              </nav>
            </div>

            {/* Right Action Zone: Flexbox Container for Check-In and Avatar */}
            {/* Pinned to the right with at least 16px gap (ml-auto + gap-3 sm:gap-4), all header actions 40px height */}
            <div className="flex items-center justify-end gap-3 sm:gap-4 ml-auto shrink-0">

              {/* Primary CTA: Geofenced Check-In Button */}
              {/* Flexbox container, 40px height (h-10), vertically centered (align-items: center), 10px radius, nowrap, 8px gap */}
              <button
                type="button"
                onClick={() => setCheckinModalOpen(true)}
                className="h-10 inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 rounded-[10px] bg-[#FF5A1F] hover:bg-[#E04810] active:scale-[0.98] text-white text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer group shrink-0"
                title="Verify on-site GPS and scan event QR code"
              >
                <QrCode className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap">Check-In</span>
              </button>

              {/* One Avatar / Account Button: Exact 40px height, vertically centered */}
              <Link
                to="/profile"
                className="h-10 w-10 inline-flex items-center justify-center rounded-[10px] bg-[#0C3B2E] text-white font-display font-black text-xs tracking-tight shadow-2xs hover:bg-[#07251D] active:scale-95 transition-all cursor-pointer shrink-0"
                title={currentUser ? `Signed in as ${currentUser.name} (View Profile)` : 'Guest Profile & Account'}
                aria-label="User Profile and Account"
              >
                {getInitials()}
              </Link>
            </div>

          </div>

          {/* Under 640px (Mobile screen): Compact Sub-row for 3 Main Nav Links */}
          <div className="sm:hidden flex items-center justify-around py-2 border-t border-[#0C3B2E]/10 text-xs font-semibold">
            <Link
              to="/opportunities"
              className={`px-3 py-1 rounded-md transition-colors ${
                isActive('/opportunities') || isActive('/explore') ? 'bg-[#0C3B2E]/10 text-[#0C3B2E] font-bold' : 'text-[#57655F]'
              }`}
            >
              Explore
            </Link>
            <Link
              to="/stories"
              className={`px-3 py-1 rounded-md transition-colors ${
                isActive('/stories') ? 'bg-[#0C3B2E]/10 text-[#0C3B2E] font-bold' : 'text-[#57655F]'
              }`}
            >
              Dispatches
            </Link>
            <Link
              to="/profile"
              className={`px-3 py-1 rounded-md transition-colors ${
                isActive('/profile') ? 'bg-[#0C3B2E]/10 text-[#0C3B2E] font-bold' : 'text-[#57655F]'
              }`}
            >
              Profile
            </Link>
          </div>

        </div>
      </header>

      {/* Global Geofenced Check-In Modal */}
      <GeofencedCheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onCheckinSuccess={() => {
          if (location.pathname === '/dashboard') {
            window.location.reload();
          }
        }}
      />
    </>
  );
}
