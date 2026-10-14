// Put an owned, Cloudflare-bound custom domain first when one is available.
// Every configured host must serve this same Worker. Protect /dashboard* only;
// /event and /health must remain public. Never add a third-party proxy here.
window.ANONYMOUS_ANALYTICS_ENDPOINTS = [
  'https://jingtao-academic-analytics.leijingtao2005.workers.dev/event'
];
