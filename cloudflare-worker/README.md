# Anonymous Cloudflare event analytics

This Worker records a deliberately small set of anonymous website interaction events in **Workers Analytics Engine**.

## What it stores

For each event:

- event type
- page path
- referring website **host only**
- approximate country
- approximate region/state
- approximate city
- timezone
- coarse device class (`desktop`, `mobile`, `tablet`, or `unknown`)
- event context (for example `hero`, `contact`, or `publications`)
- Analytics Engine's server-side event timestamp

It intentionally does **not** store IP addresses, precise coordinates, postal codes, cookies, visitor IDs, session IDs, email addresses, destination URLs, full referrer URLs, full user-agent strings, or browser fingerprints.

The Worker briefly sees the incoming request information needed for Cloudflare to derive approximate location, but only the fields listed above are written to Analytics Engine.

## Tracked events

- `page_view`
- `view_research`
- `view_publications`
- `view_skills`
- `view_awards`
- `view_contact`
- `click_cv`
- `click_github_profile`
- `click_project_code`
- `click_publications_nav`
- `click_academic_email`
- `click_personal_email`

## Deploy

You do not need a custom domain. The Worker can run on a free `workers.dev` URL.

1. Install Node.js if needed.
2. In this directory:

   ```bash
   npm install
   npx wrangler login
   npm run deploy
   ```

3. The current deployed Worker URL is:

   ```text
   https://jingtao-academic-analytics.leijingtao2005.workers.dev
   ```

4. The website root `script.js` is already configured to send anonymous events to:

   ```text
   https://jingtao-academic-analytics.leijingtao2005.workers.dev/event
   ```

5. Upload the website files to GitHub Pages.

The Analytics Engine dataset `jingtao_academic_events` is created automatically when the Worker first writes to it.

## Test

Open `https://jingtaolei.github.io`, browse several sections, and click a test link.

Then query the dataset using `queries.sql`, or use `query_analytics.py`.

## Query with the SQL API

Create a Cloudflare API token with:

```text
Account -> Account Analytics -> Read
```

Set:

```bash
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
export CLOUDFLARE_API_TOKEN="your_token"
```

Then run, for example:

```bash
python query_analytics.py recent
python query_analytics.py cities
python query_analytics.py clicks
python query_analytics.py referrers
```

Never commit the API token to GitHub.

## Security note

The Worker accepts only a small allowlist of event names, limits request bodies, and only permits browser CORS requests from `https://jingtaolei.github.io`. This reduces accidental or casual data pollution, but the endpoint is public and these checks are not authentication. No secret is embedded in the public website.
