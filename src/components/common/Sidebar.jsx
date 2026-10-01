import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLocation as useGeoLocation } from '../../contexts/LocationContext.jsx';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Building2,
  Trophy,
  LayoutDashboard,
  Compass,
  LogOut,
  Sparkles,
  ChevronDown,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

/**
 * Left Sidebar Component for Sangam
 * Fixed 220-240px (default 230px), collapsible to an icon rail (~64px).
 * Cream background (#FBF9F5) and thin border (border-r border-[#0C3B2E]/10).
 * Under 900px, renders as a slide-over drawer opened by the hamburger button.
 * Hosts:
 * - City selector (Chennai + change)
 * - Persona switcher (Guest / STUDENT, Host Org, etc.)
 * - Guest status
 * - Sign in & Join actions
 */
export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) {
  const { currentUser, logout, switchDemo, allDemoUsers, loginAsGuestStudent, isGuestStudent } = useAuth();
  const { userLocation, openLocationModal } = useGeoLocation();
  const navigate = useNavigate();
  const location = useLocation();

  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/org-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    if (onCloseMobile) onCloseMobile();
    navigate('/login');
  };

  const currentCityName = userLocation?.city || 'Chennai';
  const isStudentGuestActive = currentUser?.id === 'user_guest_student' || currentUser?.isGuest;

  return (
    <>
      {/* Mobile Backdrop for screens < 900px */}
      {mobileOpen && (
        <div
          className="min-[900px]:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#FBF9F5] border-r border-[#0C3B2E]/10 flex flex-col transition-all duration-200 ease-in-out select-none ${
          /* Responsive visibility: on <900px, acts as slide-over drawer */
          mobileOpen
            ? 'translate-x-0 w-[240px] shadow-2xl'
            : '-translate-x-full min-[900px]:translate-x-0'
        } ${
          /* Desktop width: 230px when expanded, 64px when collapsed */
          collapsed ? 'min-[900px]:w-[64px]' : 'min-[900px]:w-[230px]'
        }`}
      >
        {/* Top Header / Branding & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-[#0C3B2E]/10 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#0C3B2E] text-white flex items-center justify-center font-display font-black text-sm shadow-2xs shrink-0">
                S
              </div>
              <div className="min-w-0">
                <span className="font-display font-black text-sm text-[#0C3B2E] tracking-tight block truncate">
                  SANGAM
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#FF5A1F] block leading-none truncate">
                  Civic Hub
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#0C3B2E] text-white flex items-center justify-center font-display font-black text-sm shadow-2xs">
                S
              </div>
            </div>
          )}

          {/* Mobile close button (under 900px) */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="min-[900px]:hidden p-1.5 rounded-lg text-[#57655F] hover:text-[#141C18] hover:bg-[#0C3B2E]/5 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden min-[900px]:flex items-center justify-center w-7 h-7 rounded-lg text-[#57655F] hover:text-[#0C3B2E] hover:bg-[#0C3B2E]/5 cursor-pointer transition-colors"
            title={collapsed ? 'Expand sidebar (230px)' : 'Collapse to icon rail (64px)'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
          
          {/* 1. CITY SELECTOR (Chennai + change) */}
          <div className="space-y-1">
            {!collapsed ? (
              <div className="p-2.5 rounded-xl border border-[#0C3B2E]/15 bg-white/80 shadow-2xs">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#57655F] mb-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FF5A1F]" />
                    <span>Active Hub</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      openLocationModal();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="text-[#FF5A1F] hover:underline font-bold text-[10px] cursor-pointer"
                  >
                    change
                  </button>
                </div>
                <div
                  onClick={() => {
                    openLocationModal();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="font-display font-black text-sm text-[#0C3B2E] flex items-center justify-between cursor-pointer group"
                >
                  <span className="truncate">{currentCityName}</span>
                  <span className="text-[10px] font-semibold text-[#57655F] group-hover:text-[#0C3B2E]">
                    {userLocation?.isLive ? 'Live GPS' : 'Hub'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  openLocationModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-10 h-10 mx-auto rounded-xl border border-[#0C3B2E]/15 bg-white/80 hover:border-[#0C3B2E] flex items-center justify-center cursor-pointer transition-colors shadow-2xs group"
                title={`City: ${currentCityName} (Click to change)`}
              >
                <MapPin className="w-4 h-4 text-[#FF5A1F] group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          {/* 2. PERSONA SWITCHER (Guest / STUDENT) */}
          <div className="space-y-1">
            {!collapsed ? (
              <div className="relative">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#57655F] px-1 mb-1 flex items-center justify-between">
                  <span>Persona</span>
                  <span className="text-[9px] text-[#FF5A1F] font-bold">1-Click</span>
                </div>

                <button
                  type="button"
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="w-full p-2.5 rounded-xl border border-[#0C3B2E]/15 bg-white/80 hover:border-[#0C3B2E] transition-colors cursor-pointer text-left flex items-center justify-between shadow-2xs group"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-[#0C3B2E] flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">
                        {currentUser?.role === 'organization' ? 'HOST' : (isStudentGuestActive ? 'Guest / STUDENT' : 'STUDENT')}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#57655F] truncate mt-0.5">
                      {currentUser ? (currentUser.name ? currentUser.name.split(' ')[0] : 'Member') : 'Guest Student'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#57655F] group-hover:text-[#0C3B2E] shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {personaDropdownOpen && (
                  <div className="mt-1.5 p-1.5 bg-white rounded-xl border border-[#0C3B2E]/20 shadow-lg text-xs space-y-1 z-50">
                    {/* Primary Option: STUDENT (Loads Guest Student Profile) */}
                    <button
                      type="button"
                      onClick={async () => {
                        await loginAsGuestStudent();
                        setPersonaDropdownOpen(false);
                        if (onCloseMobile) onCloseMobile();
                        navigate('/profile');
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        isStudentGuestActive
                          ? 'bg-[#0C3B2E] text-white font-bold'
                          : 'hover:bg-[#0C3B2E]/5 text-slate-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1">
                          <span>🎓 Guest / STUDENT</span>
                        </div>
                        <div className={`text-[10px] ${isStudentGuestActive ? 'text-stone-200' : 'text-slate-500'}`}>
                          Aarav Sharma · {currentCityName}
                        </div>
                      </div>
                      {isStudentGuestActive && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {/* Secondary Option: Host Organization */}
                    {allDemoUsers
                      .filter((u) => u.role === 'organization')
                      .slice(0, 2)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchDemo(u.id);
                            setPersonaDropdownOpen(false);
                            if (onCloseMobile) onCloseMobile();
                            navigate('/org-dashboard');
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                            currentUser?.id === u.id
                              ? 'bg-[#FF5A1F] text-white font-bold'
                              : 'hover:bg-[#FF5A1F]/5 text-slate-900'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate">🏢 {u.name}</div>
                            <div className={`text-[10px] truncate ${currentUser?.id === u.id ? 'text-white/80' : 'text-slate-500'}`}>
                              Host Org · {u.homeCity || u.home_city || 'City Hub'}
                            </div>
                          </div>
                          {currentUser?.id === u.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await loginAsGuestStudent();
                  navigate('/profile');
                }}
                className={`w-10 h-10 mx-auto rounded-xl border flex items-center justify-center cursor-pointer shadow-2xs ${
                  isStudentGuestActive
                    ? 'border-[#0C3B2E] bg-[#0C3B2E] text-white'
                    : 'border-[#0C3B2E]/15 bg-white/80 text-[#0C3B2E]'
                }`}
                title="Persona: Guest / STUDENT (Click to load)"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3. GUEST STATUS */}
          <div className="space-y-1">
            {!collapsed ? (
              <div className="p-2.5 rounded-xl border border-[#0C3B2E]/10 bg-[#0C3B2E]/[0.03]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#57655F]">
                  Guest Status
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isStudentGuestActive ? 'bg-emerald-500' : (currentUser ? 'bg-blue-500' : 'bg-amber-500')}`} />
                  <span className="font-bold text-xs text-[#0C3B2E]">
                    {isStudentGuestActive
                      ? 'Student Guest (Active)'
                      : (currentUser ? 'Verified Member' : 'Guest Explorer')}
                  </span>
                </div>
                <p className="text-[10px] text-[#57655F] mt-0.5 leading-snug">
                  {isStudentGuestActive
                    ? 'Zero password required. Ready for geofenced check-in.'
                    : (currentUser ? `Signed in as ${currentUser.name || 'Member'}` : 'Explore drives freely without login.')}
                </p>
              </div>
            ) : null}
          </div>

          {/* 4. SIGN IN & JOIN ACTIONS */}
          <div className="space-y-2 pt-1 border-t border-[#0C3B2E]/10">
            {!collapsed ? (
              <>
                {currentUser && !isStudentGuestActive ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 px-3 rounded-lg border border-[#0C3B2E]/20 text-xs font-bold text-[#57655F] hover:text-[#141C18] hover:bg-white flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <Link
                      to="/login"
                      onClick={onCloseMobile}
                      className="w-full py-2 px-3 rounded-lg border border-[#0C3B2E]/20 text-xs font-bold text-[#0C3B2E] bg-white hover:bg-white/80 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                    >
                      Sign in
                    </Link>

                    <Link
                      to="/register"
                      onClick={onCloseMobile}
                      className="w-full py-2 px-3 rounded-lg bg-[#0C3B2E] text-white hover:bg-[#07251D] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#FF5A1F]" />
                      <span>Join Sangam</span>
                    </Link>

                    {isStudentGuestActive && (
                      <p className="text-[9px] text-[#57655F] text-center pt-0.5">
                        Signing in/joining will upgrade this guest profile!
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <Link
                  to="/login"
                  className="w-10 h-10 rounded-xl border border-[#0C3B2E]/15 bg-white flex items-center justify-center text-[#0C3B2E] shadow-2xs hover:border-[#0C3B2E]"
                  title="Sign in"
                >
                  <User className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="w-10 h-10 rounded-xl bg-[#0C3B2E] text-white flex items-center justify-center shadow-2xs hover:bg-[#07251D]"
                  title="Join Sangam"
                >
                  <Building2 className="w-4 h-4 text-[#FF5A1F]" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Hub Links (Leaderboard, NGOs, Squads) */}
          <div className="pt-2 border-t border-[#0C3B2E]/10 space-y-1">
            {!collapsed ? (
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#57655F] px-1 mb-1">
                Collegiate Network
              </div>
            ) : null}

            <Link
              to="/leaderboard"
              onClick={onCloseMobile}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors ${
                isActive('/leaderboard')
                  ? 'bg-[#FF5A1F]/15 text-[#FF5A1F]'
                  : 'text-[#57655F] hover:text-[#FF5A1F] hover:bg-white/60'
              } ${collapsed ? 'justify-center' : ''}`}
              title="Collegiate Leaderboard"
            >
              <Trophy className="w-4 h-4 text-[#FF5A1F] shrink-0" />
              {!collapsed && <span>Collegiate Cup</span>}
            </Link>

            <Link
              to="/organizations"
              onClick={onCloseMobile}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors ${
                isActive('/organizations')
                  ? 'bg-[#0C3B2E]/10 text-[#0C3B2E]'
                  : 'text-[#57655F] hover:text-[#0C3B2E] hover:bg-white/60'
              } ${collapsed ? 'justify-center' : ''}`}
              title="NGO Directory"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              {!collapsed && <span>NGO Directory</span>}
            </Link>

            <Link
              to={currentUser?.role === 'organization' ? '/org-dashboard' : '/dashboard'}
              onClick={onCloseMobile}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors ${
                isActive('/dashboard')
                  ? 'bg-[#0C3B2E]/10 text-[#0C3B2E]'
                  : 'text-[#57655F] hover:text-[#0C3B2E] hover:bg-white/60'
              } ${collapsed ? 'justify-center' : ''}`}
              title="My Squads & Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Squad Rosters</span>}
            </Link>
          </div>

        </div>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-[#0C3B2E]/10 text-[10px] text-[#57655F] flex items-center justify-between">
            <span>SRM & Collegiate Hub</span>
            <span className="font-mono text-[9px]">© 2026</span>
          </div>
        )}
      </aside>
    </>
  );
}
