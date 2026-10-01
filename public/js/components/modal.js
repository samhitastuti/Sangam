// public/js/components/modal.js

export function createModal({ title, content, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h3 class="modal-title">${title}</h3>
    <button type="button" class="close-btn" style="font-size: 18px; font-weight: bold; padding: 0 4px;">✕</button>
  `;
  modal.appendChild(header);

  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }
  modal.appendChild(body);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.gap = '8px';
  footer.style.marginTop = '20px';
  footer.style.borderTop = 'var(--border-thin)';
  footer.style.paddingTop = '12px';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline btn-sm';
  cancelBtn.textContent = cancelText;
  footer.appendChild(cancelBtn);

  if (onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn btn-primary btn-sm';
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', async () => {
      await onConfirm();
      overlay.remove();
    });
    footer.appendChild(confirmBtn);
  }

  modal.appendChild(footer);
  overlay.appendChild(modal);

  const close = () => overlay.remove();
  header.querySelector('.close-btn').addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
  return { overlay, close };
}
