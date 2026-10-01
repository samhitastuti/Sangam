// public/js/components/emptyState.js
// Open-ledger line-drawing empty state

export function renderEmptyState(title = 'Nothing logged yet', description = 'Browse opportunities near you to get started.') {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-state-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        <line x1="8" y1="6" x2="16" y2="6"></line>
        <line x1="8" y1="10" x2="16" y2="10"></line>
      </svg>
    </div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-desc">${description}</div>
  `;
  return div;
}

export function renderLoadingSpinner(text = 'Retrieving records...') {
  const div = document.createElement('div');
  div.style.textAlign = 'center';
  div.style.padding = '40px 0';
  div.innerHTML = `
    <div class="spinner"></div>
    <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-ink); opacity: 0.7;">${text}</div>
  `;
  return div;
}
