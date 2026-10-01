// public/js/auth.js
import { api } from './api.js';
import { getCurrentUser, setCurrentUser, switchDemoUser } from './state.js';
import { showToast } from './components/toast.js';

let isLoginMode = false;
let selectedRole = 'student';

export function initAuthPage() {
  const panel = document.getElementById('auth-panel-container');
  if (!panel) return;

  renderForm();
  renderDemoPicker();
}

function renderForm() {
  const container = document.getElementById('auth-form-content');
  if (!container) return;

  const user = getCurrentUser();
  const sessionBanner = user ? `
    <div style="background: var(--color-background); border: var(--border-thin); padding: 12px; margin-bottom: 18px; font-size: 13px;">
      <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--color-primary); font-weight: 700; margin-bottom: 2px;">
        ACTIVE SESSION
      </div>
      <div>Logged in as <strong>${user.name}</strong> (${user.role === 'student' ? user.college : 'Organization'})</div>
      <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="${user.role === 'organization' ? '/org-dashboard.html' : '/browse.html'}" class="btn btn-primary btn-sm">
          Go to ${user.role === 'organization' ? 'Org Dashboard' : 'Browse Opportunities'} →
        </a>
        ${user.role === 'student' ? `
          <a href="/dashboard.html" class="btn btn-outline btn-sm">
            My Applications →
          </a>
        ` : ''}
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    ${sessionBanner}

    <div class="role-toggle-tabs">
      <button type="button" class="role-tab-btn ${selectedRole === 'student' ? 'active' : ''}" id="tab-student">
        Student Volunteer
      </button>
      <button type="button" class="role-tab-btn ${selectedRole === 'organization' ? 'active' : ''}" id="tab-org">
        Organization Host
      </button>
    </div>

    <form id="auth-form" novalidate>
      <div id="general-error" class="field-error-msg" style="margin-bottom: 12px; display: none;"></div>

      ${!isLoginMode ? `
        <div class="form-group" id="group-name">
          <label for="input-name">${selectedRole === 'organization' ? 'Organization Name' : 'Full Name'} *</label>
          <input type="text" id="input-name" placeholder="${selectedRole === 'organization' ? 'e.g. GreenEarth Foundation' : 'e.g. Aarav Sharma'}" required />
          <div class="field-error-msg" id="err-name" style="display: none;"></div>
        </div>
      ` : ''}

      <div class="form-group" id="group-email">
        <label for="input-email">Email Address *</label>
        <input type="email" id="input-email" placeholder="you@college.edu or host@org.in" required />
        <div class="field-error-msg" id="err-email" style="display: none;"></div>
      </div>

      <div class="form-group" id="group-password">
        <label for="input-password">Password (min 6 characters) *</label>
        <input type="password" id="input-password" placeholder="••••••••" required />
        <div class="field-error-msg" id="err-password" style="display: none;"></div>
      </div>

      ${!isLoginMode ? `
        <div class="form-group" id="group-college">
          <label for="input-college">${selectedRole === 'organization' ? 'Organization HQ / Campus' : 'College / University'} *</label>
          <input type="text" id="input-college" placeholder="${selectedRole === 'organization' ? 'e.g. GreenEarth Org HQ' : 'e.g. Delhi University'}" required />
          <div class="field-error-msg" id="err-college" style="display: none;"></div>
        </div>

        <div class="form-group" id="group-city">
          <label for="input-city">${selectedRole === 'organization' ? 'Operating City' : 'Home City'} *</label>
          <input type="text" id="input-city" placeholder="e.g. Delhi, Bengaluru, Mumbai" required />
          <div class="field-error-msg" id="err-city" style="display: none;"></div>
        </div>

        <div class="form-group" id="group-skills">
          <label for="input-skills">Skills & Focus Areas (comma-separated) *</label>
          <input type="text" id="input-skills" placeholder="e.g. Teaching, Python, Media, Logistics" required />
          <div class="skills-live-chips" id="skills-chips"></div>
          <div class="field-error-msg" id="err-skills" style="display: none;"></div>
        </div>
      ` : ''}

      <div style="margin-top: 24px;">
        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">
          ${isLoginMode ? 'Log in to Sangam →' : 'Create Sangam Account →'}
        </button>
      </div>

      <div class="auth-switch">
        ${isLoginMode ? `
          Don't have an account? <a href="#" id="toggle-mode-btn">Create one now</a>
        ` : `
          Already registered? <a href="#" id="toggle-mode-btn">Log in instead</a>
        `}
      </div>
    </form>
  `;

  // Bind role tabs
  const tabStudent = container.querySelector('#tab-student');
  const tabOrg = container.querySelector('#tab-org');
  if (tabStudent && tabOrg) {
    tabStudent.addEventListener('click', () => {
      selectedRole = 'student';
      renderForm();
    });
    tabOrg.addEventListener('click', () => {
      selectedRole = 'organization';
      renderForm();
    });
  }

  // Toggle login vs signup
  const toggleBtn = container.querySelector('#toggle-mode-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isLoginMode = !isLoginMode;
      renderForm();
    });
  }

  // Live skills chips parser
  const skillsInput = container.querySelector('#input-skills');
  const chipsContainer = container.querySelector('#skills-chips');
  if (skillsInput && chipsContainer) {
    skillsInput.addEventListener('input', () => {
      const parts = skillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
      chipsContainer.innerHTML = parts.map(p => `<span class="chip">${p}</span>`).join('');
    });
  }

  // Bind submit
  const form = container.querySelector('#auth-form');
  form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  const emailEl = document.getElementById('input-email');
  const passwordEl = document.getElementById('input-password');
  const email = emailEl ? emailEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : '';

  let hasError = false;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showFieldError('email', 'Please provide a valid email address');
    hasError = true;
  }

  // Validate password
  if (!password || password.length < 6) {
    showFieldError('password', 'Password must be at least 6 characters');
    hasError = true;
  }

  if (isLoginMode) {
    if (hasError) return;
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('sangam_token', res.token);
      setCurrentUser(res.user);
      showToast(`Welcome back, ${res.user.name}`);
      redirectByRole(res.user.role);
    } catch (err) {
      showGeneralError(err.message || 'Login failed');
    }
    return;
  }

  // Signup extra validation
  const nameEl = document.getElementById('input-name');
  const collegeEl = document.getElementById('input-college');
  const cityEl = document.getElementById('input-city');
  const skillsEl = document.getElementById('input-skills');

  const name = nameEl ? nameEl.value.trim() : '';
  const college = collegeEl ? collegeEl.value.trim() : '';
  const homeCity = cityEl ? cityEl.value.trim() : '';
  const skillsStr = skillsEl ? skillsEl.value.trim() : '';

  if (!name) {
    showFieldError('name', 'Name is required');
    hasError = true;
  }
  if (!college) {
    showFieldError('college', 'College or organization name is required');
    hasError = true;
  }
  if (!homeCity) {
    showFieldError('city', 'City location is required');
    hasError = true;
  }
  if (!skillsStr) {
    showFieldError('skills', 'At least one skill or focus area is required');
    hasError = true;
  }

  if (hasError) return;

  const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const res = await api.post('/auth/signup', {
      name,
      email,
      password,
      college,
      homeCity,
      skills,
      role: selectedRole
    });

    localStorage.setItem('sangam_token', res.token);
    setCurrentUser(res.user);
    showToast(`Account created for ${res.user.name}!`);
    redirectByRole(res.user.role);
  } catch (err) {
    showGeneralError(err.message || 'Signup failed');
  }
}

function showFieldError(field, msg) {
  const grp = document.getElementById(`group-${field}`);
  const err = document.getElementById(`err-${field}`);
  if (grp) grp.classList.add('has-error');
  if (err) {
    err.style.display = 'block';
    err.textContent = `⚠ ${msg}`;
  }
}

function showGeneralError(msg) {
  const el = document.getElementById('general-error');
  if (el) {
    el.style.display = 'block';
    el.textContent = `⚠ ${msg}`;
  }
}

function clearErrors() {
  document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  document.querySelectorAll('.field-error-msg').forEach(e => {
    e.style.display = 'none';
    e.textContent = '';
  });
}

function redirectByRole(role) {
  if (role === 'organization') {
    window.location.href = '/org-dashboard.html';
  } else {
    window.location.href = '/browse.html';
  }
}

async function renderDemoPicker() {
  const container = document.getElementById('demo-picker-container');
  if (!container) return;

  let demoUsers = [];
  try {
    demoUsers = await api.get('/auth/demo-users');
  } catch (e) {
    return;
  }

  container.innerHTML = `
    <div class="demo-accounts-picker">
      <div class="demo-accounts-title">Quick Demo Logins (Click to Test)</div>
      <div class="demo-account-buttons">
        ${demoUsers.slice(0, 4).map(u => `
          <button type="button" class="demo-account-btn" data-id="${u.id}">
            <div>
              <strong>${u.name}</strong> (${u.role === 'student' ? u.college : 'Organization'})
            </div>
            <span style="font-family: var(--font-mono); font-size: 11px; color: var(--color-primary);">Login →</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.demo-account-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.getAttribute('data-id');
      try {
        const user = await switchDemoUser(userId);
        showToast(`Logged in as ${user.name}`);
        redirectByRole(user.role);
      } catch (e) {
        showToast('Demo login error');
      }
    });
  });
}
