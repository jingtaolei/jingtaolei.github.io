// Small CSS illustrations run only while visible and respect reduced-motion preferences.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  function sync() {
    document.body.classList.toggle('motion-paused', preference.matches);
    document.body.classList.toggle('motion-suspended', document.hidden);
  }
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
  const elements = document.querySelectorAll('[data-motion]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('motion-active', entry.isIntersecting);
        if (entry.isIntersecting) entry.target.classList.add('has-entered');
      });
    }, { threshold: .08 });
    elements.forEach(element => observer.observe(element));
    const sentinel = document.querySelector('.header-sentinel');
    const header = document.querySelector('.site-header');
    if (sentinel && header) {
      new IntersectionObserver(entries => {
        header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
      }, { threshold: 0 }).observe(sentinel);
    }
  } else {
    elements.forEach(element => element.classList.add('motion-active', 'has-entered'));
    document.querySelector('.site-header')?.classList.add('is-scrolled');
  }
})();
