// public/js/components/navbar.js
import { getCurrentUser, setCurrentUser, switchDemoUser, refreshUser } from '../state.js';
import { api } from '../api.js';

export async function renderNavbar(containerId = 'navbar-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  await refreshUser();
  const user = getCurrentUser();
  const currentPath = window.location.pathname;

  let demoUsers = [];
  try {
    demoUsers = await api.get('/auth/demo-users');
  } catch (e) {
    // fallback
  }

  const header = document.createElement('header');
  header.className = 'site-header no-print';

  header.innerHTML = `
    <div class="container navbar">
      <a href="/browse.html" class="nav-brand">
        <div class="brand-seal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
        </div>
        <span class="brand-title">Sangam</span>
      </a>

      <nav>
        <ul class="nav-links">
          <li>
            <a href="/browse.html" class="${currentPath.includes('browse') ? 'active' : ''}">Browse</a>
          </li>
          ${user && user.role === 'student' ? `
            <li>
              <a href="/dashboard.html" class="${currentPath.includes('dashboard') && !currentPath.includes('org') ? 'active' : ''}">My Applications</a>
            </li>
          ` : ''}
          ${user && user.role === 'organization' ? `
            <li>
              <a href="/org-dashboard.html" class="${currentPath.includes('org-dashboard') ? 'active' : ''}">Org Dashboard</a>
            </li>
          ` : ''}
        </ul>
      </nav>

      <div class="nav-actions">
        ${user ? `
          <div class="streak-indicator" title="Consecutive semester active">
            <span>🔥</span>
            <span>3rd sem</span>
          </div>

          <!-- Live Persona Switcher for Hackathon Demo -->
          <select class="demo-selector" id="nav-demo-switcher" title="Switch persona to test college pairing">
            <option value="" disabled>Switch Persona</option>
            ${demoUsers.map(u => `
              <option value="${u.id}" ${u.id === user.id ? 'selected' : ''}>
                ${u.name} (${u.role === 'student' ? u.college : 'Org'})
              </option>
            `).join('')}
          </select>

          <span class="user-badge">${user.name}</span>
          <button type="button" id="nav-logout-btn" class="btn btn-outline btn-sm">Log out</button>
        ` : `
          <select class="demo-selector" id="nav-guest-demo-switcher" title="Quick Demo Login for Testing">
            <option value="" disabled selected>Demo Persona ▾</option>
            ${demoUsers.map(u => `
              <option value="${u.id}">
                ${u.name} (${u.role === 'student' ? u.college : 'Org'})
              </option>
            `).join('')}
          </select>
          <a href="/index.html" class="btn btn-primary btn-sm">Sign in / Register</a>
        `}
      </div>
    </div>
  `;

  container.replaceWith(header);

  // Bind demo switcher (logged in)
  const demoSelect = header.querySelector('#nav-demo-switcher');
  if (demoSelect) {
    demoSelect.addEventListener('change', async (e) => {
      const targetId = e.target.value;
      if (targetId) {
        const switched = await switchDemoUser(targetId);
        if (switched.role === 'organization' && window.location.pathname.includes('dashboard.html')) {
          window.location.href = '/org-dashboard.html';
        } else if (switched.role === 'student' && window.location.pathname.includes('org-dashboard.html')) {
          window.location.href = '/dashboard.html';
        } else {
          window.location.reload();
        }
      }
    });
  }

  // Bind demo switcher (guest)
  const guestSelect = header.querySelector('#nav-guest-demo-switcher');
  if (guestSelect) {
    guestSelect.addEventListener('change', async (e) => {
      const targetId = e.target.value;
      if (targetId) {
        const loggedUser = await switchDemoUser(targetId);
        if (loggedUser.role === 'organization') {
          window.location.href = '/org-dashboard.html';
        } else {
          window.location.href = '/browse.html';
        }
      }
    });
  }

  // Bind logout
  const logoutBtn = header.querySelector('#nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      setCurrentUser(null);
      window.location.href = '/index.html';
    });
  }
}
