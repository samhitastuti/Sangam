// public/js/components/filterBar.js

export function renderFilterBar(filters, onFilterChange, currentSort, onSortChange) {
  const bar = document.createElement('div');
  bar.className = 'filter-bar';

  // Controls
  const controls = document.createElement('div');
  controls.className = 'filter-controls';

  // Skill Search Input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search by skill (e.g. Teaching, Python)...';
  searchInput.value = filters.skill || '';
  searchInput.style.width = '240px';
  searchInput.addEventListener('input', (e) => onFilterChange('skill', e.target.value));
  controls.appendChild(searchInput);

  // Date Start
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.title = 'Earliest Date';
  dateInput.value = filters.startDate || '';
  dateInput.addEventListener('change', (e) => onFilterChange('startDate', e.target.value));
  controls.appendChild(dateInput);

  bar.appendChild(controls);

  // Sort toggle
  const sortBox = document.createElement('div');
  sortBox.className = 'sort-toggle';
  sortBox.innerHTML = `
    <span>SORT:</span>
    <span class="sort-link ${currentSort === 'newest' ? 'active' : ''}" data-sort="newest">Newest</span>
    <span>/</span>
    <span class="sort-link ${currentSort === 'closing' ? 'active' : ''}" data-sort="closing">Closing soon</span>
    <span>/</span>
    <span class="sort-link ${currentSort === 'teamed' ? 'active' : ''}" data-sort="teamed">Most teamed</span>
  `;

  sortBox.querySelectorAll('.sort-link').forEach(link => {
    link.addEventListener('click', () => {
      onSortChange(link.getAttribute('data-sort'));
    });
  });

  bar.appendChild(sortBox);

  return bar;
}
