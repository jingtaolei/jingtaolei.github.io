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

// Anonymous interaction analytics through a Cloudflare Worker + Analytics Engine.
// Anonymous event endpoint hosted on Cloudflare Workers.
const ANONYMOUS_ANALYTICS_ENDPOINT =
  'https://jingtao-academic-analytics.leijingtao2005.workers.dev/event';

const TRACKED_SECTIONS = ['research', 'publications', 'skills', 'awards', 'contact'];

function analyticsEndpointReady() {
  return (
    ANONYMOUS_ANALYTICS_ENDPOINT.startsWith('https://') &&
    !ANONYMOUS_ANALYTICS_ENDPOINT.includes('YOUR-WORKER-NAME') &&
    !ANONYMOUS_ANALYTICS_ENDPOINT.includes('YOUR-SUBDOMAIN')
  );
}

function currentReferrerHost() {
  if (!document.referrer) return 'direct';
  try {
    return new URL(document.referrer).hostname || 'direct';
  } catch (_) {
    return 'unknown';
  }
}

function sendAnonymousEvent(eventName, context = '') {
  if (!analyticsEndpointReady()) return;

  const payload = {
    event: eventName,
    page: window.location.pathname || '/',
    referrer_host: currentReferrerHost(),
    context
  };

  // The request contains no cookie, visitor ID, session ID, email address,
  // destination URL, or browser fingerprint. keepalive improves delivery when
  // a click immediately navigates away.
  fetch(ANONYMOUS_ANALYTICS_ENDPOINT, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    keepalive: true,
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8'
    },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Analytics must never interfere with normal site behavior.
  });
}

// One anonymous page-view event per page load. This is intentionally not tied
// to a persistent visitor or session identifier.
sendAnonymousEvent('page_view', 'page');

// Explicit clicks that are useful for an academic homepage.
document.querySelectorAll('[data-anon-event]').forEach(link => {
  link.addEventListener('click', () => {
    sendAnonymousEvent(
      link.dataset.anonEvent,
      link.dataset.anonContext || 'site'
    );
  });
});

// Record whether a visitor actually reaches major sections. Each section is
// counted at most once per page load and is not linked to later visits.
if ('IntersectionObserver' in window) {
  const seenSections = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;

      const id = entry.target.id;
      if (!id || seenSections.has(id)) return;

      seenSections.add(id);
      sendAnonymousEvent(`view_${id}`, id);
      observer.unobserve(entry.target);
    });
  }, { threshold: [0.35] });

  TRACKED_SECTIONS.forEach(id => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}
