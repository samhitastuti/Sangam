// public/js/pages/orgDashboard.js
import { api } from '../api.js';
import { getCurrentUser } from '../state.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderStatusBadge } from '../components/statusBadge.js';
import { renderEmptyState, renderLoadingSpinner } from '../components/emptyState.js';
import { createModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function initOrgDashboardPage() {
  await renderNavbar('navbar-container');
  renderFooter('footer-container');

  const root = document.getElementById('org-dashboard-root');
  if (!root) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  if (user.role !== 'organization') {
    window.location.href = '/dashboard.html';
    return;
  }

  root.appendChild(renderLoadingSpinner('Loading host initiatives...'));
  await loadOrgData(user, root);
}

async function loadOrgData(user, root) {
  try {
    const opps = await api.get(`/opportunities?orgId=${user.id}`);
    renderOrgDashboard(root, user, opps);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(renderEmptyState('Failed to load organization dashboard', err.message));
  }
}

function renderOrgDashboard(root, user, opportunities) {
  root.innerHTML = '';

  // Top header with "Post an opportunity"
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.flexWrap = 'wrap';
  header.style.gap = '16px';
  header.style.marginBottom = '28px';

  header.innerHTML = `
    <div>
      <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--color-primary); font-weight: 700;">
        ORGANIZATION PORTAL
      </div>
      <h1 style="font-size: 28px; margin-top: 2px;">${user.name}</h1>
      <div style="font-family: var(--font-mono); font-size: 13px; opacity: 0.8;">
        Location: ${user.homeCity || user.home_city} · ${user.college}
      </div>
    </div>
    <div>
      <button type="button" id="post-opp-btn" class="btn btn-primary" style="padding: 10px 18px;">
        + Post an opportunity
      </button>
    </div>
  `;
  root.appendChild(header);

  // Bind Post Opportunity Modal
  header.querySelector('#post-opp-btn').addEventListener('click', () => {
    openOpportunityModal(null, user, root);
  });

  if (opportunities.length === 0) {
    root.appendChild(renderEmptyState('No opportunities posted yet', 'Click "+ Post an opportunity" to create your first community volunteer posting.'));
    return;
  }

  // Opportunities Table
  const tableWrap = document.createElement('div');
  tableWrap.className = 'ledger-table-wrap';

  tableWrap.innerHTML = `
    <table class="ledger-table">
      <thead>
        <tr>
          <th>Opportunity Title</th>
          <th>City</th>
          <th>Date</th>
          <th>Cohort Capacity</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="opps-tbody"></tbody>
    </table>
  `;

  const tbody = tableWrap.querySelector('#opps-tbody');
  opportunities.forEach(opp => {
    const tr = document.createElement('tr');
    const isFull = opp.applied_count >= opp.capacity;

    tr.innerHTML = `
      <td>
        <strong><a href="/opportunity.html?id=${opp.id}">${opp.title}</a></strong>
      </td>
      <td class="mono">${opp.city}</td>
      <td class="mono">${new Date(opp.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td class="mono"><strong>${opp.applied_count}</strong> / ${opp.capacity} filled</td>
      <td id="opp-status-${opp.id}"></td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-outline btn-sm manage-btn" data-id="${opp.id}">
            Manage Roster
          </button>
          ${opp.status === 'open' ? `
            <button type="button" class="btn btn-outline btn-sm close-btn" data-id="${opp.id}">
              Close
            </button>
          ` : ''}
        </div>
      </td>
    `;

    tr.querySelector(`#opp-status-${opp.id}`).appendChild(renderStatusBadge(isFull ? 'closed' : opp.status));
    tbody.appendChild(tr);
  });

  root.appendChild(tableWrap);

  // Details Container for expanded roster
  const detailsArea = document.createElement('div');
  detailsArea.id = 'roster-details-area';
  root.appendChild(detailsArea);

  // Bind Close Button
  tableWrap.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const oppId = btn.getAttribute('data-id');
      try {
        await api.patch(`/opportunities/${oppId}`, { status: 'closed' });
        showToast('Opportunity closed');
        await loadOrgData(user, root);
      } catch (err) {
        showToast(err.message || 'Action failed');
      }
    });
  });

  // Bind Manage Roster Button
  tableWrap.querySelectorAll('.manage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oppId = btn.getAttribute('data-id');
      const opp = opportunities.find(o => o.id === oppId);
      loadRosterDetails(opp, detailsArea);
    });
  });

  // Automatically open first opportunity roster
  if (opportunities.length > 0) {
    loadRosterDetails(opportunities[0], detailsArea);
  }
}

async function loadRosterDetails(opp, container) {
  container.innerHTML = '';
  container.appendChild(renderLoadingSpinner(`Loading applicants & teams for "${opp.title}"...`));

  try {
    const [apps, teams] = await Promise.all([
      api.get(`/applications?opportunityId=${opp.id}`),
      api.get(`/teams/opportunity/${opp.id}`)
    ]);

    container.innerHTML = `
      <div style="background: #FFF; border: var(--border-thick); padding: 24px; margin-top: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: var(--border-thin); padding-bottom: 12px;">
          <div>
            <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--color-primary);">
              COHORT ROSTER & AUTO-MATCHED SQUADS
            </div>
            <h2 style="font-size: 22px;">${opp.title}</h2>
          </div>
          <div class="mono" style="font-size: 13px;">
            ${apps.length} Applicants · ${teams.length} Campus Squads
          </div>
        </div>

        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; font-family: var(--font-mono); text-transform: uppercase;">
            College Squad Clusters (Auto-Grouped)
          </h3>
          <div id="teams-cluster-list"></div>
        </div>

        <div>
          <h3 style="font-size: 16px; margin-bottom: 12px; font-family: var(--font-mono); text-transform: uppercase;">
            Applicant Verification & Certification Ledger
          </h3>
          <div id="applicants-table-wrap"></div>
        </div>
      </div>
    `;

    // Render Team Clusters
    const clusterList = container.querySelector('#teams-cluster-list');
    if (teams.length === 0) {
      clusterList.innerHTML = `<p style="font-size: 13px; opacity: 0.7;">No teams formed yet.</p>`;
    } else {
      teams.forEach(t => {
        const cluster = document.createElement('div');
        cluster.className = 'team-cluster';
        cluster.innerHTML = `
          <div class="team-cluster-header">
            <span>🏫 ${t.college} Squad</span>
            <span class="mono" style="font-size: 12px; color: var(--color-primary);">${t.members.length} volunteer${t.members.length > 1 ? 's' : ''}</span>
          </div>
          <div class="teammates-strip">
            ${t.members.map(m => `
              <div class="teammate-pill">
                <strong>${m.name}</strong> (${m.homeCity || 'City'}) · <span style="opacity: 0.7;">${m.joined_via}</span>
              </div>
            `).join('')}
          </div>
        `;
        clusterList.appendChild(cluster);
      });
    }

    // Render Applicants Table
    const appsWrap = container.querySelector('#applicants-table-wrap');
    if (apps.length === 0) {
      appsWrap.innerHTML = `<p style="font-size: 13px; opacity: 0.7;">No student applications received yet.</p>`;
    } else {
      const table = document.createElement('table');
      table.className = 'ledger-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Student Volunteer</th>
            <th>College</th>
            <th>City</th>
            <th>Skills</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${apps.map(a => `
            <tr>
              <td><strong>${a.user ? a.user.name : 'Student'}</strong></td>
              <td>${a.user ? a.user.college : ''}</td>
              <td class="mono">${a.user ? a.user.homeCity : ''}</td>
              <td>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${(a.user && a.user.skills ? a.user.skills : []).slice(0, 2).map(s => `<span class="skill-chip">${s}</span>`).join('')}
                </div>
              </td>
              <td id="app-badge-${a.id}"></td>
              <td>
                ${a.status === 'applied' ? `
                  <button type="button" class="btn btn-sm btn-primary complete-btn" data-id="${a.id}" style="background: var(--color-gold); color: #4F3810; border-color: #B58525;">
                    Mark Complete 🏅
                  </button>
                ` : a.status === 'completed' ? `
                  <a href="/certificate.html?applicationId=${a.id}" class="btn btn-sm btn-outline">
                    View Cert
                  </a>
                ` : `<span style="font-size: 12px; opacity: 0.6;">Withdrawn</span>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      `;

      apps.forEach(a => {
        table.querySelector(`#app-badge-${a.id}`).appendChild(renderStatusBadge(a.status));
      });

      // Bind Mark Complete
      table.querySelectorAll('.complete-btn').forEach(b => {
        b.addEventListener('click', async () => {
          const appId = b.getAttribute('data-id');
          b.disabled = true;
          b.textContent = 'Certifying...';
          try {
            await api.patch(`/applications/${appId}`, { status: 'completed' });
            showToast('Student volunteer service marked complete! Certificate unlocked.');
            await loadRosterDetails(opp, container);
          } catch (e) {
            showToast(e.message || 'Update failed');
            b.disabled = false;
          }
        });
      });

      appsWrap.appendChild(table);
    }
  } catch (err) {
    container.innerHTML = `<p style="color: var(--color-ink); padding: 16px;">Failed to load roster: ${err.message}</p>`;
  }
}

function openOpportunityModal(existingOpp = null, user, root) {
  const form = document.createElement('form');
  form.innerHTML = `
    <div class="form-group">
      <label>Opportunity Title *</label>
      <input type="text" id="opp-modal-title" placeholder="e.g. Yamuna Riverbank Afforestation" required />
    </div>

    <div class="form-group">
      <label>Description & Mission *</label>
      <textarea id="opp-modal-desc" rows="3" placeholder="Explain the community project and goals..." required></textarea>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div class="form-group">
        <label>City Location *</label>
        <input type="text" id="opp-modal-city" placeholder="e.g. Delhi, Bengaluru" required />
      </div>

      <div class="form-group">
        <label>Volunteer Capacity (Spots) *</label>
        <input type="number" id="opp-modal-capacity" min="1" max="500" value="15" required />
      </div>
    </div>

    <div class="form-group">
      <label>Service Date & Time * (Must be in the future)</label>
      <input type="datetime-local" id="opp-modal-date" required />
    </div>

    <div class="form-group">
      <label>Skills Needed (comma-separated)</label>
      <input type="text" id="opp-modal-skills" placeholder="e.g. Teaching, Python, Media" />
    </div>

    <div id="modal-error" class="field-error-msg" style="display: none; margin-top: 8px;"></div>
  `;

  // Pre-fill date with 14 days in future
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  defaultDate.setHours(9, 0, 0, 0);
  form.querySelector('#opp-modal-date').value = defaultDate.toISOString().slice(0, 16);

  createModal({
    title: 'Post New Opportunity',
    content: form,
    confirmText: 'Publish Posting',
    onConfirm: async () => {
      const title = form.querySelector('#opp-modal-title').value.trim();
      const description = form.querySelector('#opp-modal-desc').value.trim();
      const city = form.querySelector('#opp-modal-city').value.trim();
      const capacity = parseInt(form.querySelector('#opp-modal-capacity').value, 10);
      const date = form.querySelector('#opp-modal-date').value;
      const skillsStr = form.querySelector('#opp-modal-skills').value.trim();

      if (!title || !description || !city || !date || !capacity) {
        throw new Error('All required fields must be completed.');
      }

      if (new Date(date) <= new Date()) {
        throw new Error('Service date must be in the future.');
      }

      await api.post('/opportunities', {
        title,
        description,
        city,
        capacity,
        date: new Date(date).toISOString(),
        skillsNeeded: skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : []
      });

      showToast('Opportunity posted successfully!');
      await loadOrgData(user, root);
    }
  });
}
