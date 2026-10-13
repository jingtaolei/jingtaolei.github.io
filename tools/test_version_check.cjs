// Validate recovery without a browser reload loop, lost anchors, or clearing user data.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(require('node:path').join(__dirname, '../version-check.js'), 'utf8');
async function run(current, latest, href, fail = false) {
  const effects = { replaced: [], cleaned: [], requests: [] };
  const fetch = async (url, options) => {
    effects.requests.push({ url: String(url), options });
    if (fail) throw new Error('offline');
    return { ok: true, json: async () => ({ id: latest }) };
  };
  vm.runInNewContext(code, {
    document: { querySelector: () => ({ content: current }) },
    window: { fetch, addEventListener: () => {} }, fetch, URL, Date, AbortController,
    setTimeout, clearTimeout,
    location: { href, replace: url => effects.replaced.push(url) },
    history: { state: { retained: true }, replaceState: (state, _, url) => effects.cleaned.push({ state, url }) }
  });
  await new Promise(resolve => setImmediate(resolve));
  return effects;
}
(async () => {
  const old = 'aaaaaaaaaaaa', next = 'bbbbbbbbbbbb';
  const href = 'https://example.com/sub/index.html?from=profile#research';
  let result = await run(old, next, href);
  assert.equal(result.replaced.length, 1);
  const page = new URL(result.replaced[0]);
  assert.equal(page.hash, '#research');
  assert.equal(page.searchParams.get('from'), 'profile');
  assert.equal(page.searchParams.get('site-version'), next);
  assert.equal(new URL(result.requests[0].url).pathname, '/sub/site-version.json');
  assert.equal(result.requests[0].options.cache, 'no-store');
  assert.equal((await run(old, next, page.href)).replaced.length, 0);
  result = await run(next, next, page.href);
  assert.equal(result.cleaned[0].url, href);
  assert.equal(result.cleaned[0].state.retained, true);
  assert.equal((await run(old, next, href, true)).replaced.length, 0);
  assert.equal((await run(old, 'invalid', href)).replaced.length, 0);
  console.log('Version recovery, loop guard, anchor retention and offline fallback passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
