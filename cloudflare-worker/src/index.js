const ALLOWED_ORIGIN = 'https://jingtaolei.github.io';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'view_research',
  'view_publications',
  'view_skills',
  'view_awards',
  'view_contact',
  'click_cv',
  'click_github_profile',
  'click_project_code',
  'click_publications_nav',
  'click_academic_email',
  'click_personal_email'
]);

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function cleanString(value, maxLength, fallback = 'unknown') {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLength);
}

function cleanPagePath(value) {
  const page = cleanString(value, 160, '/');
  if (!page.startsWith('/')) return '/';
  return page;
}

function cleanHost(value) {
  const host = cleanString(value, 120, 'direct').toLowerCase();
  if (host === 'direct' || host === 'unknown') return host;
  // Keep only hostname-like characters; never store a full referrer URL.
  return /^[a-z0-9.-]+$/.test(host) ? host : 'unknown';
}

function deviceClass(request) {
  const mobileHint = request.headers.get('sec-ch-ua-mobile');
  if (mobileHint === '?1') return 'mobile';

  // Use the User-Agent only transiently to derive a coarse class.
  // The raw User-Agent string is never stored.
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android/.test(ua)) return 'mobile';
  if (ua) return 'desktop';
  return 'unknown';
}

function response(status, origin, body = null) {
  const headers = corsHeaders(origin);
  headers['Cache-Control'] = 'no-store';
  if (body !== null) headers['Content-Type'] = 'text/plain; charset=utf-8';
  return new Response(body, { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (url.pathname !== '/event') {
      return new Response('Not found', { status: 404 });
    }

    if (request.method === 'OPTIONS') {
      if (origin !== ALLOWED_ORIGIN) {
        return new Response(null, { status: 403 });
      }
      return response(204, origin);
    }

    if (request.method !== 'POST') {
      return response(405, origin || ALLOWED_ORIGIN, 'Method not allowed');
    }

    // Browser requests from the public academic site should carry this Origin.
    // This is a pollution-reduction check, not an authentication mechanism.
    if (origin !== ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403 });
    }

    const declaredLength = Number(request.headers.get('content-length') || '0');
    if (declaredLength > 2048) {
      return response(413, origin, 'Payload too large');
    }

    const raw = await request.text();
    if (raw.length > 2048) {
      return response(413, origin, 'Payload too large');
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (_) {
      return response(400, origin, 'Invalid JSON');
    }

    const event = cleanString(data.event, 64, '');
    if (!ALLOWED_EVENTS.has(event)) {
      return response(400, origin, 'Unknown event');
    }

    const pagePath = cleanPagePath(data.page);
    const referrerHost = cleanHost(data.referrer_host);
    const context = cleanString(data.context, 64, 'site');

    const cf = request.cf || {};
    const country = cleanString(cf.country, 8);
    const region = cleanString(cf.region, 80);
    const city = cleanString(cf.city, 80);
    const timezone = cleanString(cf.timezone, 80);
    const device = deviceClass(request);

    // Analytics Engine provides its own timestamp column, so no client timestamp
    // or visitor identifier is needed.
    env.ANALYTICS.writeDataPoint({
      indexes: ['academic-site-v1'],
      blobs: [
        event,          // blob1
        pagePath,       // blob2
        referrerHost,   // blob3
        country,        // blob4
        region,         // blob5
        city,           // blob6
        timezone,       // blob7
        device,         // blob8
        context         // blob9
      ],
      doubles: [1]
    });

    return response(204, origin);
  }
};
