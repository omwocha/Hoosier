(function() {
  const KEYS = {
    choice: 'cookieConsent.v1.choice',
    optional: 'cookieConsent.v1.optional',
    ts: 'cookieConsent.v1.timestamp'
  };

  let consent = loadConsent();
  let optionalRan = false;

  function loadConsent() {
    try {
      const choice = localStorage.getItem(KEYS.choice);
      const optional = localStorage.getItem(KEYS.optional);
      const ts = localStorage.getItem(KEYS.ts);
      if (!choice) return null;
      return { choice, optional: optional === 'true', ts };
    } catch (e) {
      console.warn('Consent storage unavailable; defaulting to null');
      return null;
    }
  }

  function saveConsent(choice, optional) {
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem(KEYS.choice, choice);
      localStorage.setItem(KEYS.optional, optional ? 'true' : 'false');
      localStorage.setItem(KEYS.ts, timestamp);
    } catch (e) {
      console.warn('Unable to persist consent; continuing in-memory only');
    }
    consent = { choice, optional, ts: timestamp };
  }

  function runOptionalFeatures() {
    if (optionalRan) return;
    optionalRan = true;
    // Placeholder for optional scripts/analytics.
    console.log('Optional features enabled (analytics would initialize here).');
  }

  function applyConsent() {
    if (consent?.optional) {
      runOptionalFeatures();
    }
  }

  function createBanner() {
    if (document.getElementById('cookie-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies and Privacy');

    banner.innerHTML = `
      <div class="cookie-text">
        <h3>Cookies & Privacy</h3>
        <p>We use essential cookies/storage to make this demo work. Optional cookies would only be used for analytics/experience improvements and are OFF unless you accept.</p>
      </div>
      <div class="cookie-actions">
        <button class="button secondary" id="cookie-accept" type="button">Accept Optional</button>
        <button class="button ghost" id="cookie-reject" type="button">Reject Optional</button>
        <button class="button linkish" id="cookie-preferences" type="button">Preferences</button>
      </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector('#cookie-accept').addEventListener('click', () => {
      saveConsent('accepted', true);
      applyConsent();
      hideBanner();
    });

    banner.querySelector('#cookie-reject').addEventListener('click', () => {
      saveConsent('rejected', false);
      hideBanner();
    });

    banner.querySelector('#cookie-preferences').addEventListener('click', () => {
      openPreferences();
    });
  }

  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.remove();
  }

  function openPreferences() {
    let modal = document.getElementById('cookie-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cookie-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Cookie preferences');
      modal.innerHTML = `
        <div class="cookie-modal-content">
          <div class="cookie-modal-header">
            <h3>Cookie Preferences</h3>
            <button class="button ghost" id="cookie-close" type="button" aria-label="Close">Close</button>
          </div>
          <div class="cookie-group">
            <div class="cookie-group-header">
              <strong>Essential</strong> <span class="badge">Always On</span>
            </div>
            <p class="muted small">Required for basic demo functionality.</p>
          </div>
          <div class="cookie-group">
            <div class="cookie-group-header">
              <strong>Optional</strong> <span id="cookie-optional-status" class="badge"></span>
            </div>
            <label class="inline" aria-label="Optional analytics">
              <input id="cookie-optional-toggle" type="checkbox"> Enable optional (analytics/experience improvements)
            </label>
          </div>
          <div class="cookie-modal-actions">
            <button class="button primary" id="cookie-save" type="button">Save Preferences</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const toggle = modal.querySelector('#cookie-optional-toggle');
    const status = modal.querySelector('#cookie-optional-status');
    const closeBtn = modal.querySelector('#cookie-close');
    const saveBtn = modal.querySelector('#cookie-save');

    toggle.checked = !!consent?.optional;
    status.textContent = toggle.checked ? 'Enabled' : 'Disabled';

    toggle.addEventListener('change', () => {
      status.textContent = toggle.checked ? 'Enabled' : 'Disabled';
    }, { once: false });

    const close = () => modal.classList.remove('open');
    closeBtn.addEventListener('click', close, { once: true });

    saveBtn.addEventListener('click', () => {
      const optional = toggle.checked;
      saveConsent(optional ? 'custom' : 'custom', optional);
      applyConsent();
      hideBanner();
      close();
    }, { once: true });

    modal.classList.add('open');
    closeBtn.focus();
  }

  function addFooterLink() {
    const footerLink = document.getElementById('cookiePrefFooterLink');
    if (footerLink) {
      footerLink.style.display = 'inline';
      footerLink.addEventListener('click', (e) => {
        e.preventDefault();
        openPreferences();
      });
    }
  }

  function init() {
    if (!consent) {
      createBanner();
    } else {
      applyConsent();
    }
    addFooterLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
