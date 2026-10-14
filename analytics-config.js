// Production URLs only: every endpoint must use the collector from monitor-site.
// Put a verified Pages/custom-domain ingress first after its deployment and network test.
// Do not add a guessed/uncreated pages.dev address or a third-party IP lookup service.
window.ANONYMOUS_ANALYTICS_ENDPOINTS = [
  'https://jingtao-collection.pages.dev/event',
  'https://jingtao-academic-analytics.leijingtao2005.workers.dev/event'
];
