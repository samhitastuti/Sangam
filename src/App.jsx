import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LocationProvider } from './contexts/LocationContext.jsx';
import Navbar from './components/common/Navbar.jsx';
import Sidebar from './components/common/Sidebar.jsx';
import GoogleMapsQuotaBanner from './components/common/GoogleMapsQuotaBanner.jsx';
import DeviceLocationBanner from './components/common/DeviceLocationBanner.jsx';
import LocationPromptModal from './components/common/LocationPromptModal.jsx';
import GeminiChatWidget from './components/ai/GeminiChatWidget.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import OpportunitiesPage from './pages/OpportunitiesPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import OrganizationsPage from './pages/OrganizationsPage.jsx';
import StoriesPage from './pages/StoriesPage.jsx';
import OpportunityPage from './pages/OpportunityPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrgDashboardPage from './pages/OrgDashboardPage.jsx';
import CertificatePage from './pages/CertificatePage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#FBF9F5] text-[#141C18] selection:bg-[#FF5A1F]/20 selection:text-[#0C3B2E] overflow-x-hidden">
            
            {/* Left Sidebar (220-240px, collapsible to ~64px rail, slide-over drawer under 900px) */}
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              mobileOpen={mobileSidebarOpen}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />

            {/* Main Layout Area: padding equal to sidebar width on >= 900px, max-width contained, no horizontal scroll */}
            <div
              className={`min-h-screen flex flex-col transition-[padding] duration-200 ease-in-out w-full max-w-full overflow-x-hidden ${
                sidebarCollapsed ? 'min-[900px]:pl-[64px]' : 'min-[900px]:pl-[230px]'
              }`}
            >
              {/* Google Maps Quota Exceeded Sticky Top Bar */}
              <GoogleMapsQuotaBanner />

              {/* Slim Top Navigation Bar */}
              <Navbar onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

              {/* Device Location Notification Banner */}
              <DeviceLocationBanner />

              {/* Interactive Location Permission & City Selector Modal */}
              <LocationPromptModal />

              <main className="flex-1 w-full max-w-full overflow-x-hidden">
                <Routes>
                  <Route path="/" element={<BrowsePage />} />
                  <Route path="/browse" element={<BrowsePage />} />
                  <Route path="/opportunities" element={<OpportunitiesPage />} />
                  <Route path="/explore" element={<OpportunitiesPage />} />
                  <Route path="/opportunities/:id" element={<OpportunityPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/organizations" element={<OrganizationsPage />} />
                  <Route path="/stories" element={<StoriesPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/org-dashboard" element={<OrgDashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/certificate/:applicationId" element={<CertificatePage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/register" element={<SignupPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={<Navigate to="/browse" replace />} />
                </Routes>
              </main>

              {/* Persistent Gemini Chatbot & Google Maps Data Agent Widget */}
              <GeminiChatWidget />

              {/* Footer (hidden in print) */}
              <footer className="no-print bg-[#FBF9F5] border-t border-[#0C3B2E]/10 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <div className="font-display text-xl font-black text-[#0C3B2E] tracking-tight">
                        SANGAM
                      </div>
                      <p className="text-xs text-[#57655F] mt-1 font-normal">
                        Student volunteer & internship network. Automatic collegiate squad formation.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs text-[#57655F] font-semibold">
                      <a href="/opportunities" className="hover:text-[#0C3B2E] transition-colors">
                        Opportunities
                      </a>
                      <a href="/leaderboard" className="hover:text-[#0C3B2E] transition-colors font-bold text-[#FF5A1F]">
                        🏆 Collegiate Leaderboard
                      </a>
                      <a href="/organizations" className="hover:text-[#0C3B2E] transition-colors">
                        NGO Directory
                      </a>
                      <a href="/stories" className="hover:text-[#0C3B2E] transition-colors">
                        Dispatches & Blog
                      </a>
                      <a href="/browse#campus-squads" className="hover:text-[#0C3B2E] transition-colors">
                        Campus Squads
                      </a>
                      <a href="/dashboard" className="hover:text-[#0C3B2E] transition-colors">
                        My Squads
                      </a>
                      <span>·</span>
                      <span className="font-mono text-[11px] font-normal">© 2026 SANGAM NETWORK</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}
