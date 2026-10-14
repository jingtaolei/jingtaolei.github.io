const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

if (toggle && nav) {
  const mobileNavigation = matchMedia('(max-width: 760px)');
  function setNavigationOpen(open) {
    const expanded = mobileNavigation.matches && open;
    // Keep the panel mounted throughout the transition; closed mobile links cannot receive focus.
    if (!expanded && mobileNavigation.matches && nav.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
    nav.classList.toggle('open', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    nav.inert = mobileNavigation.matches && !expanded;
  }
  setNavigationOpen(false);
  toggle.addEventListener('click', () => {
    setNavigationOpen(!nav.classList.contains('open'));
  });
  mobileNavigation.addEventListener('change', () => setNavigationOpen(false));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setNavigationOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-wrap')) setNavigationOpen(false);
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNavigationOpen(false));
  });
}

// Anonymous interaction analytics through a Cloudflare Worker + Analytics Engine.
// Anonymous event endpoint hosted on Cloudflare Workers.
const ANONYMOUS_ANALYTICS_ENDPOINT =
  'https://jingtao-academic-analytics.leijingtao2005.workers.dev/event';

const TRACKED_SECTIONS = ['research', 'publications', 'skills', 'awards', 'contact'];

function analyticsEndpointReady() {
  return (
    !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) &&
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

// Keep the floating navigation in step with the visible fieldnote.
if ('IntersectionObserver' in window) {
  const links = document.querySelectorAll('.nav a[href^="#"]');
  const activeSections = new Map();
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => activeSections.set(entry.target.id, entry.isIntersecting));
    const current = Array.from(activeSections).find(([, visible]) => visible)?.[0];
    links.forEach(link => {
      const active = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
}
