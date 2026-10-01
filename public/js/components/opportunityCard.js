// public/js/components/opportunityCard.js
import { renderStatusBadge } from './statusBadge.js';
import { renderCapacityMeter } from './capacityMeter.js';

export function renderOpportunityCard(opp, userHomeCity = '', applicationStatus = null) {
  const card = document.createElement('article');
  card.className = 'opportunity-card';

  const isFull = opp.applied_count >= opp.capacity;
  const isHomeCity = userHomeCity && opp.city && opp.city.toLowerCase() === userHomeCity.toLowerCase();
  
  const formattedDate = new Date(opp.date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Top header with org + badge
  const top = document.createElement('div');
  top.className = 'card-top';

  const orgBox = document.createElement('div');
  orgBox.innerHTML = `
    <div class="card-org">${opp.orgName || 'Verified Org'}</div>
    ${isHomeCity ? '<span style="font-family: var(--font-mono); font-size: 10px; color: var(--color-primary); font-weight: 700;">[IN HOMETOWN]</span>' : ''}
  `;
  top.appendChild(orgBox);

  if (applicationStatus) {
    top.appendChild(renderStatusBadge(applicationStatus));
  } else {
    top.appendChild(renderStatusBadge(isFull ? 'closed' : opp.status));
  }
  card.appendChild(top);

  // Title
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.innerHTML = `<a href="/opportunity.html?id=${opp.id}">${opp.title}</a>`;
  card.appendChild(title);

  // Meta: city + date in mono
  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `
    <span>📍 ${opp.city}</span>
    <span>🗓 ${formattedDate}</span>
  `;
  card.appendChild(meta);

  // Skills
  const skills = opp.skillsNeeded || [];
  if (skills.length > 0) {
    const skillsBox = document.createElement('div');
    skillsBox.className = 'card-skills';
    skills.slice(0, 3).forEach(skill => {
      const chip = document.createElement('span');
      chip.className = 'skill-chip';
      chip.textContent = skill;
      skillsBox.appendChild(chip);
    });
    if (skills.length > 3) {
      const more = document.createElement('span');
      more.className = 'skill-chip';
      more.textContent = `+${skills.length - 3}`;
      skillsBox.appendChild(more);
    }
    card.appendChild(skillsBox);
  }

  // Capacity Meter
  const meter = renderCapacityMeter(opp.applied_count || 0, opp.capacity || 10, 16);
  card.appendChild(meter);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  actions.innerHTML = `
    <span class="gold-stamp">VERIFIED HOST</span>
    <a href="/opportunity.html?id=${opp.id}" class="btn btn-outline btn-sm">View Opportunity →</a>
  `;
  card.appendChild(actions);

  return card;
}
