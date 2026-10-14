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

// Delivery is handled by collection.js; interactions remain independent of transport.
const TRACKED_SECTIONS = ['research', 'publications', 'skills', 'awards', 'contact'];
function sendAnonymousEvent(eventName, context = '') {
  return window.AnonymousCollection?.send(eventName, context);
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
