// public/js/pages/browse.js
import { api } from '../api.js';
import { getCurrentUser } from '../state.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderStatsStrip } from '../components/statsStrip.js';
import { renderCityIndexRail } from '../components/cityIndexRail.js';
import { renderFilterBar } from '../components/filterBar.js';
import { renderOpportunityCard } from '../components/opportunityCard.js';
import { renderEmptyState, renderLoadingSpinner } from '../components/emptyState.js';

let allOpportunities = [];
let userApplicationsMap = {};
let distinctCities = [];
let selectedCity = 'All';
let currentSort = 'newest';
let filters = {
  skill: '',
  startDate: ''
};

export async function initBrowsePage() {
  await renderNavbar('navbar-container');
  renderFooter('footer-container');

  const main = document.getElementById('browse-root');
  if (!main) return;

  main.innerHTML = '';
  main.appendChild(renderLoadingSpinner('Loading community opportunities...'));

  try {
    const user = getCurrentUser();
    const [opps, cities] = await Promise.all([
      api.get('/opportunities'),
      api.get('/users/distinct-cities')
    ]);

    allOpportunities = opps;
    distinctCities = cities;

    if (user) {
      try {
        const myApps = await api.get(`/applications?userId=${user.id}`);
        myApps.forEach(a => {
          userApplicationsMap[a.opportunityId] = a.status;
        });
      } catch (e) {
        // non-fatal
      }
    }

    renderPage();
  } catch (err) {
    main.innerHTML = '';
    main.appendChild(renderEmptyState('Failed to load opportunities', err.message));
  }
}

function renderPage() {
  const root = document.getElementById('browse-root');
  if (!root) return;
  root.innerHTML = '';

  const user = getCurrentUser();
  const userHomeCity = user ? (user.homeCity || user.home_city) : '';

  // StatsStrip at top
  const stats = renderStatsStrip(allOpportunities);
  root.appendChild(stats);

  // Main Browse Layout (Rail + Content)
  const layout = document.createElement('div');
  layout.className = 'browse-layout';

  // Left rail
  const rail = renderCityIndexRail(distinctCities, selectedCity, (city) => {
    selectedCity = city;
    renderPage();
  });
  layout.appendChild(rail);

  // Main content column
  const contentCol = document.createElement('div');
  contentCol.className = 'browse-content-col';

  // FilterBar
  const filterBar = renderFilterBar(
    filters,
    (key, val) => {
      filters[key] = val;
      renderOpportunitiesList(contentCol, userHomeCity);
    },
    currentSort,
    (sortKey) => {
      currentSort = sortKey;
      renderOpportunitiesList(contentCol, userHomeCity);
    }
  );
  contentCol.appendChild(filterBar);

  // Results area container
  const listArea = document.createElement('div');
  listArea.id = 'opportunities-list-area';
  contentCol.appendChild(listArea);

  layout.appendChild(contentCol);
  root.appendChild(layout);

  renderOpportunitiesList(contentCol, userHomeCity);
}

function renderOpportunitiesList(contentCol, userHomeCity) {
  const listArea = contentCol.querySelector('#opportunities-list-area');
  if (!listArea) return;
  listArea.innerHTML = '';

  // Apply filters
  let filtered = allOpportunities.filter(o => {
    if (selectedCity !== 'All' && o.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    if (filters.skill && filters.skill.trim()) {
      const q = filters.skill.toLowerCase().trim();
      const match = o.title.toLowerCase().includes(q) ||
                    o.description.toLowerCase().includes(q) ||
                    (o.skillsNeeded || []).some(s => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filters.startDate) {
      if (new Date(o.date) < new Date(filters.startDate)) return false;
    }
    return true;
  });

  // Apply sorting
  if (currentSort === 'newest') {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (currentSort === 'closing') {
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (currentSort === 'teamed') {
    filtered.sort((a, b) => (b.applied_count || 0) - (a.applied_count || 0));
  }

  // Split into "Near your hometown" and "All opportunities"
  const hometownOpps = userHomeCity
    ? filtered.filter(o => o.city && o.city.toLowerCase() === userHomeCity.toLowerCase())
    : [];

  // "Near your hometown" section
  if (hometownOpps.length > 0 && selectedCity === 'All') {
    const homeSection = document.createElement('section');
    homeSection.className = 'section-hometown';
    homeSection.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">Near your hometown (${userHomeCity})</h2>
          <p style="font-size: 13px; opacity: 0.8;">Initiatives operating directly in your base community</p>
        </div>
        <span class="mono" style="font-size: 12px; font-weight: 700; color: var(--color-primary);">
          ${hometownOpps.length} LOCAL
        </span>
      </div>
    `;

    const homeGrid = document.createElement('div');
    homeGrid.className = 'opportunity-grid';
    hometownOpps.forEach(opp => {
      homeGrid.appendChild(renderOpportunityCard(opp, userHomeCity, userApplicationsMap[opp.id]));
    });
    homeSection.appendChild(homeGrid);
    listArea.appendChild(homeSection);
  }

  // "All Opportunities" section
  const allSection = document.createElement('section');
  allSection.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">All Opportunities</h2>
      <span class="mono" style="font-size: 12px; color: var(--color-ink); opacity: 0.7;">
        ${filtered.length} postings
      </span>
    </div>
  `;

  if (filtered.length === 0) {
    allSection.appendChild(renderEmptyState('No opportunities match criteria', 'Try clearing your skill search or picking a different city.'));
  } else {
    const grid = document.createElement('div');
    grid.className = 'opportunity-grid';
    filtered.forEach(opp => {
      grid.appendChild(renderOpportunityCard(opp, userHomeCity, userApplicationsMap[opp.id]));
    });
    allSection.appendChild(grid);
  }

  listArea.appendChild(allSection);
}
