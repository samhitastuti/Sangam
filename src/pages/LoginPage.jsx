import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, switchDemo, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in with permanent non-guest account, redirect
  React.useEffect(() => {
    if (currentUser && !currentUser.isGuest && currentUser.id !== 'user_guest_student') {
      if (currentUser.role === 'organization') {
        navigate('/org-dashboard');
      } else {
        navigate('/browse');
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user?.role === 'organization') {
        navigate('/org-dashboard');
      } else {
        navigate('/browse');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (userId) => {
    setIsSubmitting(true);
    try {
      const user = await switchDemo(userId);
      if (user?.role === 'organization') {
        navigate('/org-dashboard');
      } else {
        navigate('/browse');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      
      {/* Editorial Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Brand Statement */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9762B] mb-3">
              Network Access
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-[#1D2421] uppercase leading-[0.95]">
              Sign in to<br />
              <span className="text-[#1B4D3E]">Sangam</span>.
            </h1>
          </div>

          <p className="text-base text-[#6F756F] leading-relaxed max-w-md">
            Access your campus volunteer team, certificates, and opportunities.
          </p>

          {/* Quick Demo Switcher Panel */}
          <div className="pt-6 border-t border-[#1B4D3E]/10">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1B4D3E] mb-3">
              One-Click Demo Personas:
            </div>

            <div className="space-y-2">
              {/* Primary Student Guest Profile */}
              <button
                type="button"
                onClick={() => handleQuickLogin('user_guest_student')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-[#1B4D3E] bg-[#1B4D3E]/5 text-left text-xs transition-all cursor-pointer group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#1D2421] group-hover:text-[#1B4D3E]">
                    <span>Aarav Sharma</span>
                    <span className="text-[10px] bg-[#E9762B] text-white px-1.5 py-0.2 rounded font-bold">
                      Student Guest
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6F756F]">
                    SRM Kattankulathur (KTR) · Chennai
                  </div>
                </div>
                <span className="text-[#1B4D3E] font-bold">Instant Access →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user_aarav_vit')}
                className="w-full flex items-center justify-between p-3 rounded border border-[#1B4D3E]/15 hover:border-[#1B4D3E] bg-white text-left text-xs transition-colors cursor-pointer group shadow-xs"
              >
                <div>
                  <div className="font-bold text-[#1D2421] group-hover:text-[#1B4D3E]">
                    Aarav Nair
                  </div>
                  <div className="text-[11px] text-[#6F756F]">
                    VIT Vellore · Vellore (Student)
                  </div>
                </div>
                <span className="text-[#1B4D3E] font-semibold">Enter as Student →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user_karthik_srm')}
                className="w-full flex items-center justify-between p-3 rounded border border-[#1B4D3E]/15 hover:border-[#1B4D3E] bg-white text-left text-xs transition-colors cursor-pointer group shadow-xs"
              >
                <div>
                  <div className="font-bold text-[#1D2421] group-hover:text-[#1B4D3E]">
                    Karthik Subramanian
                  </div>
                  <div className="text-[11px] text-[#6F756F]">
                    SRM Kattankulathur (KTR) · Chennai (Student)
                  </div>
                </div>
                <span className="text-[#1B4D3E] font-semibold">Enter as Student →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user_divya_srm')}
                className="w-full flex items-center justify-between p-3 rounded border border-[#1B4D3E]/15 hover:border-[#1B4D3E] bg-white text-left text-xs transition-colors cursor-pointer group shadow-xs"
              >
                <div>
                  <div className="font-bold text-[#1D2421] group-hover:text-[#1B4D3E]">
                    Divya Sundaram
                  </div>
                  <div className="text-[11px] text-[#6F756F]">
                    SRM KTR · Has Completed Certificate
                  </div>
                </div>
                <span className="text-[#1B4D3E] font-semibold">Enter as Student →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('org_srm_outreach')}
                className="w-full flex items-center justify-between p-3 rounded border border-[#E9762B]/30 hover:border-[#E9762B] bg-[#FFF8F3] text-left text-xs transition-colors cursor-pointer group shadow-xs"
              >
                <div>
                  <div className="font-bold text-[#1D2421] group-hover:text-[#E9762B]">
                    SRM Community Action & Outreach
                  </div>
                  <div className="text-[11px] text-[#6F756F]">
                    Host Organisation · Chennai
                  </div>
                </div>
                <span className="text-[#E9762B] font-semibold">Enter as Host →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('org_greenearth')}
                className="w-full flex items-center justify-between p-3 rounded border border-[#E9762B]/30 hover:border-[#E9762B] bg-[#FFF8F3] text-left text-xs transition-colors cursor-pointer group shadow-xs"
              >
                <div>
                  <div className="font-bold text-[#1D2421] group-hover:text-[#E9762B]">
                    GreenEarth India Foundation
                  </div>
                  <div className="text-[11px] text-[#6F756F]">
                    Host Organisation · Delhi
                  </div>
                </div>
                <span className="text-[#E9762B] font-semibold">Enter as Host →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Editorial Form */}
        <div className="lg:col-span-7">
          
          {error && (
            <div className="mb-6 p-3 rounded border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1D2421] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="aarav.nair@vit.ac.in, karthik.s@srmist.edu.in, or outreach@srmist.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-transparent border border-[#1B4D3E]/20 focus:border-[#1B4D3E] focus:bg-white rounded text-sm text-[#1D2421] placeholder-[#6F756F]/60 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1D2421] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="•••••••• (default: password123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-transparent border border-[#1B4D3E]/20 focus:border-[#1B4D3E] focus:bg-white rounded text-sm text-[#1D2421] placeholder-[#6F756F]/60 focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded bg-[#1B4D3E] hover:bg-[#13392D] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-6 mt-8 border-t border-[#1B4D3E]/10 text-xs text-[#6F756F]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#1B4D3E] hover:underline">
              Register with your college to enable automatic team grouping →
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
