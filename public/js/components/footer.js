// public/js/components/footer.js
import { getCurrentUser } from '../state.js';

export function renderFooter(containerId = 'footer-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = getCurrentUser();
  const collegeName = (user && user.college) ? user.college : 'Collegiate Volunteer Network';

  const footer = document.createElement('footer');
  footer.className = 'site-footer no-print';
  footer.innerHTML = `
    <div class="container footer-content">
      <div>Sangam · ${collegeName}</div>
      <div style="font-size: 11px; opacity: 0.7;">Automated Campus Squad Clustering · SQL Ledger</div>
    </div>
  `;

  container.replaceWith(footer);
}
