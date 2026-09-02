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

// Analytics architecture:
// - Cloudflare Web Analytics runs independently (cookie-free).
// - The GA4 tag is bootstrapped in <head> with Consent Mode and automatic
//   page_view disabled. Detailed GA4 page-view/custom events are sent only
//   after explicit analytics opt-in.
// - Microsoft Clarity loads only after explicit opt-in.
const ANALYTICS_CONSENT_KEY = 'analytics_consent';
const CLARITY_PROJECT_ID = 'ybtnl0rk7v';

const consentBanner = document.getElementById('analytics-consent');
let analyticsGranted = false;
let sectionObserverStarted = false;

function getConsentChoice() {
  if (typeof window.__initialAnalyticsConsent !== 'undefined') {
    return window.__initialAnalyticsConsent;
  }
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY);
  } catch (_) {
    return null;
  }
}

function saveConsentChoice(choice) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
    window.__initialAnalyticsConsent = choice;
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

function updateGoogleConsent(choice) {
  ensureGtagQueue();
  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: choice === 'granted' ? 'granted' : 'denied'
  });
}

function sendConsentedPageViewOnce() {
  if (!analyticsGranted || window.__gaPageViewSent) return;
  ensureGtagQueue();

  // Explicit page_view after consent. This guarantees that the first detailed
  // GA4 hit for a newly consenting visitor is sent with analytics_storage=granted.
  const pageViewParams = {
    page_title: document.title,
    page_location: window.location.href
  };
  if (document.referrer) pageViewParams.page_referrer = document.referrer;

  window.gtag('event', 'page_view', pageViewParams);
  window.__gaPageViewSent = true;
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
  // Custom interaction events are sent only after explicit analytics opt-in.
  if (!analyticsGranted || typeof window.gtag !== 'function') return;
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
  if (analyticsGranted) return;
  analyticsGranted = true;
  updateGoogleConsent('granted');
  sendConsentedPageViewOnce();
  loadMicrosoftClarity();
  startSectionViewTracking();
}

function disableAnalyticsAndReloadIfNeeded() {
  const clarityWasLoaded = Boolean(document.querySelector('script[data-clarity-loader]'));

  updateGoogleConsent('denied');

  if (typeof window.clarity === 'function') {
    window.clarity('consentv2', {
      ad_Storage: 'denied',
      analytics_Storage: 'denied'
    });
  }

  analyticsGranted = false;

  // If Clarity was already loaded, reload so its recording script is removed.
  // The GA4 tag remains present after reload in consent-denied mode by design.
  if (clarityWasLoaded) window.location.reload();
}

function applyConsent(choice) {
  saveConsentChoice(choice);
  hideConsentBanner();

  if (choice === 'granted') {
    enableAnalytics();
  } else {
    disableAnalyticsAndReloadIfNeeded();
  }
}

// Explicit click events useful for an academic homepage.
// Never send email addresses (including mailto: URLs or visible email text) to GA4.
document.querySelectorAll('[data-analytics-event]').forEach(link => {
  link.addEventListener('click', () => {
    const params = {
      link_location: link.dataset.analyticsLocation || 'site'
    };

    const href = link.getAttribute('href') || '';
    const isEmailLink = href.trim().toLowerCase().startsWith('mailto:');

    if (!isEmailLink) {
      params.link_url = link.href || '';
      params.link_text = (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    }

    trackEvent(link.dataset.analyticsEvent, params);
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
  analyticsGranted = true;
  // Consent was already granted before the tag loaded (set in <head>), so send
  // this page's single detailed page_view now.
  sendConsentedPageViewOnce();
  loadMicrosoftClarity();
  startSectionViewTracking();
} else if (initialConsent !== 'denied') {
  showConsentBanner();
}
