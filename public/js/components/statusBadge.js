// public/js/components/statusBadge.js

export function renderStatusBadge(status) {
  const norm = (status || '').toLowerCase();
  const badge = document.createElement('span');
  badge.className = `status-badge status-${norm}`;

  const dot = document.createElement('span');
  dot.className = 'status-dot';
  badge.appendChild(dot);

  const text = document.createElement('span');
  text.textContent = norm === 'closed' ? 'Closed / Full' : status;
  badge.appendChild(text);

  return badge;
}
