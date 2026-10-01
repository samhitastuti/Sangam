// public/js/pages/dashboard.js
import { api } from '../api.js';
import { getCurrentUser } from '../state.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderStatusBadge } from '../components/statusBadge.js';
import { renderEmptyState, renderLoadingSpinner } from '../components/emptyState.js';
import { createModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function initDashboardPage() {
  await renderNavbar('navbar-container');
  renderFooter('footer-container');

  const root = document.getElementById('dashboard-root');
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  if (user.role === 'organization') {
    window.location.href = '/org-dashboard.html';
    return;
  }

  root.appendChild(renderLoadingSpinner('Loading volunteer ledger...'));
  await loadDashboard(user, root);
}

async function loadDashboard(user, root) {
  try {
    const apps = await api.get(`/applications?userId=${user.id}`);
    renderLedger(root, user, apps);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(renderEmptyState('Failed to load ledger', err.message));
  }
}

function renderLedger(root, user, applications) {
  root.innerHTML = '';

  const completedApps = applications.filter(a => a.status === 'completed');
  const activeApps = applications.filter(a => a.status === 'applied');
  
  // Calculate cumulative hours: 12 hours per completed application
  const totalHours = completedApps.length * 12;

  // Header and Metrics Strip
  const header = document.createElement('div');
  header.style.marginBottom = '24px';
  header.innerHTML = `
    <h1 style="font-size: 28px; margin-bottom: 4px;">Student Volunteer Ledger</h1>
    <div style="font-family: var(--font-mono); font-size: 13px; opacity: 0.8;">
      ${user.name} · ${user.college} · Base: ${user.homeCity || user.home_city}
    </div>
  `;
  root.appendChild(header);

  // Metrics Strip with large mono numeral
  const metrics = document.createElement('div');
  metrics.className = 'dashboard-metrics-strip';
  metrics.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">HOURS LOGGED</div>
      <div class="hours-counter">${totalHours}</div>
      <div style="font-family: var(--font-mono); font-size: 11px; opacity: 0.7; margin-top: 4px;">
        12 hours per certified initiative
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-label">ACTIVE INITIATIVES</div>
      <div class="hours-counter" style="color: var(--color-ink);">${activeApps.length}</div>
      <div style="font-family: var(--font-mono); font-size: 11px; opacity: 0.7; margin-top: 4px;">
        In active campus squads
      </div>
    </div>

    <div class="metric-card">
      <div class="metric-label">VERIFIED COMPLETIONS</div>
      <div class="hours-counter" style="color: #9E7422;">${completedApps.length}</div>
      <div style="font-family: var(--font-mono); font-size: 11px; opacity: 0.7; margin-top: 4px;">
        Certificates authorized
      </div>
    </div>
  `;
  root.appendChild(metrics);

  // Ledger timeline section
  const timelineSection = document.createElement('div');
  timelineSection.innerHTML = `
    <h2 style="font-size: 20px; margin-bottom: 16px;">Service Timeline</h2>
  `;

  if (applications.length === 0) {
    timelineSection.appendChild(
      renderEmptyState('Nothing logged yet', 'Browse opportunities near you to join a campus squad and log service hours.')
    );
  } else {
    const list = document.createElement('ul');
    list.className = 'timeline-ledger';

    applications.forEach(app => {
      const opp = app.opportunity || {};
      const team = app.team;
      const formattedDate = new Date(app.appliedAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const entry = document.createElement('li');
      entry.className = `timeline-entry ${app.status}`;

      entry.innerHTML = `
        <div class="timeline-card">
          <div class="timeline-meta">
            <span style="text-transform: uppercase;">${opp.orgName || 'Organization'}</span>
            <div id="badge-slot-${app.id}"></div>
          </div>

          <h3 style="font-size: 18px; margin-bottom: 6px;">
            <a href="/opportunity.html?id=${app.opportunityId}">${opp.title}</a>
          </h3>

          <div style="font-family: var(--font-mono); font-size: 12px; margin-bottom: 10px; opacity: 0.85;">
            <span>📍 ${opp.city || ''}</span> · 
            <span>Logged on: ${formattedDate}</span>
            ${team ? ` · <span style="color: var(--color-primary); font-weight: 700;">${team.college} Team</span>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--color-muted); padding-top: 10px; margin-top: 8px;">
            <div style="font-family: var(--font-mono); font-size: 11px; opacity: 0.7;">
              ID: ${app.id.substring(0, 10)}
            </div>
            <div id="actions-slot-${app.id}"></div>
          </div>
        </div>
      `;

      // Status badge
      entry.querySelector(`#badge-slot-${app.id}`).appendChild(renderStatusBadge(app.status));

      // Action links
      const actionsSlot = entry.querySelector(`#actions-slot-${app.id}`);
      if (app.status === 'completed') {
        actionsSlot.innerHTML = `
          <a href="/certificate.html?applicationId=${app.id}" class="btn btn-sm btn-primary" style="background: var(--color-gold); color: #4F3810; border-color: #B58525;">
            View Certificate 🏅
          </a>
        `;
      } else if (app.status === 'applied') {
        const withdrawBtn = document.createElement('button');
        withdrawBtn.type = 'button';
        withdrawBtn.className = 'btn btn-outline btn-sm';
        withdrawBtn.textContent = 'Withdraw';
        withdrawBtn.addEventListener('click', () => {
          createModal({
            title: 'Confirm Withdrawal',
            content: `Withdraw application for "${opp.title}"? This will remove you from your college squad.`,
            confirmText: 'Yes, Withdraw',
            onConfirm: async () => {
              try {
                await api.post(`/applications/${app.id}/withdraw`, {});
                showToast('Withdrawn from opportunity');
                await loadDashboard(user, root);
              } catch (err) {
                showToast(err.message || 'Withdrawal failed');
              }
            }
          });
        });
        actionsSlot.appendChild(withdrawBtn);
      }

      list.appendChild(entry);
    });

    timelineSection.appendChild(list);
  }

  root.appendChild(timelineSection);
}
