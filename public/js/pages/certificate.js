// public/js/pages/certificate.js
import { api } from '../api.js';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { renderEmptyState, renderLoadingSpinner } from '../components/emptyState.js';

export async function initCertificatePage() {
  await renderNavbar('navbar-container');
  renderFooter('footer-container');

  const root = document.getElementById('certificate-root');
  if (!root) return;

  const urlParams = new URLSearchParams(window.location.search);
  const applicationId = urlParams.get('applicationId');

  if (!applicationId) {
    root.appendChild(renderEmptyState('Missing application ID', 'Navigate from your dashboard or opportunity page.'));
    return;
  }

  root.appendChild(renderLoadingSpinner('Authorizing official credential...'));

  try {
    const cert = await api.get(`/applications/${applicationId}`);
    renderCertificate(root, cert);
  } catch (err) {
    root.innerHTML = '';
    root.appendChild(renderEmptyState('Certificate not available', err.message));
  }
}

function renderCertificate(root, cert) {
  root.innerHTML = '';

  const formattedDate = new Date(cert.completionDate || cert.appliedAt).toLocaleDateString('en-IN', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Deterministic serial number e.g. SG-2026-0142
  const hashVal = Math.abs(
    (cert.id || 'SG')
      .split('')
      .reduce((acc, char) => acc * 31 + char.charCodeAt(0), 7) % 9000
  ) + 1000;
  const serialNo = `SG-2026-${hashVal}`;

  // Top action bar (no-print)
  const topBar = document.createElement('div');
  topBar.className = 'no-print';
  topBar.style.display = 'flex';
  topBar.style.justifyContent = 'space-between';
  topBar.style.alignItems = 'center';
  topBar.style.maxWidth = '860px';
  topBar.style.margin = '0 auto 16px auto';

  topBar.innerHTML = `
    <div>
      <a href="/dashboard.html" style="font-family: var(--font-mono); font-size: 13px;">← Return to Ledger</a>
    </div>
    <div>
      <button type="button" id="print-cert-btn" class="btn btn-primary" style="padding: 8px 18px;">
        🖨 Print / Save as PDF
      </button>
    </div>
  `;
  root.appendChild(topBar);

  topBar.querySelector('#print-cert-btn').addEventListener('click', () => {
    window.print();
  });

  // Certificate Box
  const certBox = document.createElement('div');
  certBox.className = 'certificate-container';

  certBox.innerHTML = `
    <div class="certificate-header">
      <div class="certificate-subtitle">SANGAM COLLEGIATE VOLUNTEER NETWORK</div>
      <h1 class="certificate-headline">Certificate of Community Service</h1>
      <div class="certificate-serial">CREDENTIAL ID: ${serialNo}</div>
    </div>

    <div style="text-align: center; font-family: var(--font-mono); font-size: 13px; text-transform: uppercase; opacity: 0.75; margin-bottom: 8px;">
      This record certifies that
    </div>

    <div class="certificate-recipient">
      ${cert.studentName}
    </div>

    <div style="text-align: center; font-weight: 600; color: var(--color-primary); margin-bottom: 24px;">
      Representing ${cert.college}
    </div>

    <div class="certificate-body">
      has successfully completed active volunteer service and peer collegiate teamwork in the authorized civic initiative
      <br /><br />
      <strong style="font-size: 19px; color: var(--color-ink); display: block; border: 1px solid var(--color-ink); background: var(--color-background); padding: 8px 12px; margin: 8px auto; max-width: 500px;">
        "${cert.opportunityTitle}"
      </strong>
      <div style="font-size: 14px; opacity: 0.85; margin-top: 6px;">
        Under the direction of <strong>${cert.orgName}</strong>
      </div>
    </div>

    <div class="certificate-footer">
      <div style="text-align: left;">
        <div style="font-family: var(--font-heading); font-weight: 700; font-size: 14px; border-bottom: 1px solid var(--color-ink); padding-bottom: 2px; width: 180px;">
          ${cert.orgName}
        </div>
        <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; opacity: 0.7; margin-top: 4px;">
          Authorizing Sponsor
        </div>
      </div>

      <div style="text-align: right; margin-right: 140px;">
        <div style="font-family: var(--font-mono); font-size: 13px; border-bottom: 1px solid var(--color-ink); padding-bottom: 2px; width: 160px;">
          ${formattedDate}
        </div>
        <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; opacity: 0.7; margin-top: 4px;">
          Date of Certification
        </div>
      </div>
    </div>

    <!-- Gold Wax-Seal Stamp (Rotated -8deg, absolute bottom-right) -->
    <div class="wax-seal">
      <span>★ SANGAM ★</span>
      <span style="font-size: 11px;">VERIFIED</span>
      <span>${serialNo.split('-')[1]}</span>
    </div>
  `;

  root.appendChild(certBox);
}
