// public/js/pages/opportunity.js
import { api } from '../api.js';
import { getCurrentUser } from '../state.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderCapacityMeter } from '../components/capacityMeter.js';
import { renderTeamBanner } from '../components/teamBanner.js';
import { renderStatusBadge } from '../components/statusBadge.js';
import { renderEmptyState, renderLoadingSpinner } from '../components/emptyState.js';
import { createModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export async function initOpportunityPage() {
  await renderNavbar('navbar-container');
  renderFooter('footer-container');

  const root = document.getElementById('opportunity-root');
  if (!root) return;

  const urlParams = new URLSearchParams(window.location.search);
  const oppId = urlParams.get('id');

  if (!oppId) {
    root.appendChild(renderEmptyState('Missing opportunity ID', 'Please navigate from the Browse page.'));
    return;
  }

  root.appendChild(renderLoadingSpinner('Loading opportunity details...'));
  await loadAndRender(oppId, root);
}

async function loadAndRender(oppId, root) {
  try {
    const user = getCurrentUser();
    const opp = await api.get(`/opportunities/${oppId}`);

    let userApp = null;
    let team = null;

    if (user) {
      const myApps = await api.get(`/applications?userId=${user.id}&opportunityId=${oppId}`);
      if (myApps && myApps.length > 0) {
        userApp = myApps[0];
        if (userApp.teamId) {
          team = await api.get(`/teams/${userApp.teamId}`);
        }
      }
    }

    renderView(root, opp, user, userApp, team);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(renderEmptyState('Opportunity not found', err.message));
  }
}

function renderView(root, opp, user, userApp, team) {
  root.innerHTML = '';

  const view = document.createElement('div');
  view.className = 'opportunity-detail-view';

  // Back link
  const backLink = document.createElement('div');
  backLink.style.marginBottom = '16px';
  backLink.innerHTML = `<a href="/browse.html">← Back to all opportunities</a>`;
  view.appendChild(backLink);

  const isApplied = userApp && userApp.status === 'applied';
  const isCompleted = userApp && userApp.status === 'completed';
  const isFull = opp.applied_count >= opp.capacity;

  // If applied, render TeamBanner at the top!
  if (isApplied && team) {
    const banner = renderTeamBanner(team, user ? user.id : '', user ? user.college : '');
    if (banner) view.appendChild(banner);
  }

  // Main Card
  const card = document.createElement('div');
  card.className = 'detail-header-card';

  // Top meta
  const topMeta = document.createElement('div');
  topMeta.className = 'detail-top-meta';
  topMeta.innerHTML = `
    <span class="gold-stamp">VERIFIED ORGANIZER</span>
    <div id="status-badge-container"></div>
  `;
  card.appendChild(topMeta);

  const badgeTarget = topMeta.querySelector('#status-badge-container');
  if (userApp) {
    badgeTarget.appendChild(renderStatusBadge(userApp.status));
  } else {
    badgeTarget.appendChild(renderStatusBadge(isFull ? 'closed' : opp.status));
  }

  // Title
  const title = document.createElement('h1');
  title.className = 'detail-title';
  title.textContent = opp.title;
  card.appendChild(title);

  // Meta row (city, date)
  const formattedDate = new Date(opp.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const metaRow = document.createElement('div');
  metaRow.style.display = 'flex';
  metaRow.style.gap = '20px';
  metaRow.style.fontFamily = 'var(--font-mono)';
  metaRow.style.fontSize = '13px';
  metaRow.style.marginBottom = '20px';
  metaRow.innerHTML = `
    <span>📍 Location: <strong>${opp.city}</strong></span>
    <span>🗓 Service Date: <strong>${formattedDate}</strong></span>
  `;
  card.appendChild(metaRow);

  // Capacity Meter
  const meter = renderCapacityMeter(opp.applied_count || 0, opp.capacity || 10, 20);
  card.appendChild(meter);

  // Organizer info panel
  const orgPanel = document.createElement('div');
  orgPanel.className = 'organizer-panel';
  orgPanel.innerHTML = `
    <div>
      <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--color-ink); opacity: 0.7;">
        HOST INITIATIVE
      </div>
      <div style="font-weight: 700; font-size: 15px;">${opp.orgName}</div>
    </div>
    <div style="font-family: var(--font-mono); font-size: 13px;">
      Contact: <a href="mailto:${opp.orgEmail}">${opp.orgEmail}</a>
    </div>
  `;
  card.appendChild(orgPanel);

  // Description
  const desc = document.createElement('div');
  desc.className = 'opportunity-description';
  desc.textContent = opp.description;
  card.appendChild(desc);

  // Skills
  const skills = opp.skillsNeeded || [];
  if (skills.length > 0) {
    const skillsSection = document.createElement('div');
    skillsSection.style.marginBottom = '24px';
    skillsSection.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; margin-bottom: 8px;">
        SKILLS & TALENTS DESIRED
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
      </div>
    `;
    card.appendChild(skillsSection);
  }

  // Action Strip
  const actionStrip = document.createElement('div');
  actionStrip.className = 'detail-action-strip';

  const actionInfo = document.createElement('div');
  actionInfo.style.fontSize = '13px';
  actionInfo.style.opacity = '0.85';

  if (!user) {
    actionInfo.textContent = 'Sign in with your student account to apply and be grouped into a campus team.';
  } else if (user.role === 'organization') {
    actionInfo.textContent = 'Organizations cannot apply as volunteers.';
  } else if (isCompleted) {
    actionInfo.innerHTML = `🌟 Initiative completed! <a href="/certificate.html?applicationId=${userApp.id}">View Certificate</a>`;
  } else if (isApplied) {
    actionInfo.textContent = `You are grouped into the ${user.college} team for this opportunity.`;
  } else if (isFull) {
    actionInfo.textContent = 'This volunteer cohort has reached its capacity limit.';
  } else {
    actionInfo.textContent = `Applying will automatically pair you with fellow students from ${user.college}.`;
  }
  actionStrip.appendChild(actionInfo);

  // Action Buttons
  const btnBox = document.createElement('div');

  if (!user) {
    btnBox.innerHTML = `<a href="/index.html" class="btn btn-primary">Sign in to Apply</a>`;
  } else if (user.role === 'student') {
    if (isCompleted) {
      btnBox.innerHTML = `
        <a href="/certificate.html?applicationId=${userApp.id}" class="btn btn-primary" style="background: var(--color-gold); color: #4F3810; border-color: #B58525;">
          View Verified Certificate 🏅
        </a>
      `;
    } else if (isApplied) {
      const withdrawBtn = document.createElement('button');
      withdrawBtn.type = 'button';
      withdrawBtn.className = 'btn btn-outline';
      withdrawBtn.textContent = 'Withdraw Application';
      withdrawBtn.addEventListener('click', () => {
        createModal({
          title: 'Confirm Withdrawal',
          content: 'Are you sure you want to withdraw? You will be removed from your college team.',
          confirmText: 'Yes, Withdraw',
          onConfirm: async () => {
            try {
              await api.post(`/applications/${userApp.id}/withdraw`, {});
              showToast('Application withdrawn');
              await loadAndRender(opp.id, root);
            } catch (err) {
              showToast(err.message || 'Withdrawal failed');
            }
          }
        });
      });
      btnBox.appendChild(withdrawBtn);
    } else {
      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'btn btn-primary';
      applyBtn.disabled = isFull || opp.status !== 'open';
      applyBtn.textContent = isFull ? 'Cohort Full' : 'Apply & Join Campus Squad';
      applyBtn.addEventListener('click', async () => {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Auto-matching...';
        try {
          await api.post('/applications', {
            userId: user.id,
            opportunityId: opp.id
          });
          showToast('Application logged! You have been auto-paired with your college squad.');
          await loadAndRender(opp.id, root);
        } catch (err) {
          showToast(err.message || 'Apply failed');
          applyBtn.disabled = false;
          applyBtn.textContent = 'Apply & Join Campus Squad';
        }
      });
      btnBox.appendChild(applyBtn);
    }
  }

  actionStrip.appendChild(btnBox);
  card.appendChild(actionStrip);
  view.appendChild(card);
  root.appendChild(view);
}
