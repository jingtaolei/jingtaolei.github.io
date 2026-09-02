const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Optional analytics are loaded only after an explicit opt-in.
// Cloudflare Web Analytics remains separate because it is cookie-free and
// does not collect/use visitors' personal data according to Cloudflare.
const ANALYTICS_CONSENT_KEY = 'analytics_consent';
const GA_MEASUREMENT_ID = 'G-N79HTK8MHH';
const CLARITY_PROJECT_ID = 'ybtnl0rk7v';

const consentBanner = document.getElementById('analytics-consent');
let analyticsLoaded = false;
let sectionObserverStarted = false;

function getConsentChoice() {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch (_) {
    return null;
  }
}

function saveConsentChoice(choice) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
  } catch (_) {
    // If localStorage is unavailable, honor the choice for the current page only.
  }
}

function showConsentBanner() {
  if (!consentBanner) return;
  consentBanner.hidden = false;
  requestAnimationFrame(() => consentBanner.classList.add('visible'));
}

function hideConsentBanner() {
  if (!consentBanner) return;
  consentBanner.classList.remove('visible');
  window.setTimeout(() => {
    consentBanner.hidden = true;
  }, 180);
}

function ensureGtagQueue() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
}

function loadGoogleAnalytics() {
  if (document.querySelector('script[data-ga-loader]')) return;

  ensureGtagQueue();

  // Basic consent mode: Google Analytics is not loaded before opt-in.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });
  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true
  });

  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  gaScript.dataset.gaLoader = 'true';
  document.head.appendChild(gaScript);
}

function loadMicrosoftClarity() {
  if (document.querySelector('script[data-clarity-loader]')) return;

  // Queue calls made before the Clarity library finishes loading.
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  // This site does not use Clarity for advertising.
  window.clarity('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: 'granted'
  });

  const clarityScript = document.createElement('script');
  clarityScript.async = true;
  clarityScript.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`;
  clarityScript.dataset.clarityLoader = 'true';
  document.head.appendChild(clarityScript);
}

function trackEvent(eventName, params = {}) {
  if (!analyticsLoaded || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

function startSectionViewTracking() {
  if (sectionObserverStarted || !('IntersectionObserver' in window)) return;
  sectionObserverStarted = true;

  const trackedSections = ['research', 'publications', 'skills', 'awards', 'contact'];
  const seen = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
      const id = entry.target.id;
      if (!id || seen.has(id)) return;
      seen.add(id);
      trackEvent(`view_${id}`, { section_id: id });
      observer.unobserve(entry.target);
    });
  }, { threshold: [0.35] });

  trackedSections.forEach(id => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function enableAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  loadGoogleAnalytics();
  loadMicrosoftClarity();
  startSectionViewTracking();
}

function disableLoadedAnalyticsAndReloadIfNeeded() {
  const hadLoadedAnalytics = analyticsLoaded || Boolean(
    document.querySelector('script[data-ga-loader], script[data-clarity-loader]')
  );

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
  }

  if (typeof window.clarity === 'function') {
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: 'denied'
    });
  }

  analyticsLoaded = false;

  // Reload so optional analytics scripts are no longer present in the page.
  if (hadLoadedAnalytics) window.location.reload();
}

function applyConsent(choice) {
  saveConsentChoice(choice);
  hideConsentBanner();

  if (choice === 'granted') {
    enableAnalytics();
  } else {
    disableLoadedAnalyticsAndReloadIfNeeded();
  }
}

// Explicit click events useful for an academic homepage.
document.querySelectorAll('[data-analytics-event]').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent(link.dataset.analyticsEvent, {
      link_url: link.href || '',
      link_text: (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
      link_location: link.dataset.analyticsLocation || 'site'
    });
  });
});

document.querySelectorAll('[data-consent]').forEach(button => {
  button.addEventListener('click', () => applyConsent(button.dataset.consent));
});

document.querySelectorAll('[data-open-consent]').forEach(button => {
  button.addEventListener('click', showConsentBanner);
});

const initialConsent = getConsentChoice();
if (initialConsent === 'granted') {
  enableAnalytics();
} else if (initialConsent !== 'denied') {
  showConsentBanner();
}
