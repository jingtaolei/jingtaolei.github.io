#!/usr/bin/env python3
"""
Small local helper for querying the Cloudflare Workers Analytics Engine dataset.

Required environment variables:
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN

The API token should have:
  Account -> Account Analytics -> Read

Example:
  python query_analytics.py cities
"""

import json
import os
import sys
import urllib.request

DATASET = "jingtao_academic_events"

QUERIES = {
    "events": f"""
SELECT blob1 AS event, SUM(_sample_interval) AS events
FROM {DATASET}
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY event
ORDER BY events DESC
""",
    "cities": f"""
SELECT blob4 AS country, blob5 AS region, blob6 AS city,
       SUM(_sample_interval) AS page_views
FROM {DATASET}
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'page_view'
GROUP BY country, region, city
ORDER BY page_views DESC
LIMIT 100
""",
    "referrers": f"""
SELECT blob3 AS referrer_host, SUM(_sample_interval) AS page_views
FROM {DATASET}
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'page_view'
GROUP BY referrer_host
ORDER BY page_views DESC
LIMIT 50
""",
    "clicks": f"""
SELECT blob1 AS event, blob4 AS country, blob5 AS region, blob6 AS city,
       SUM(_sample_interval) AS clicks
FROM {DATASET}
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 IN (
    'click_cv',
    'click_github_profile',
    'click_project_code',
    'click_publications_nav',
    'click_academic_email',
    'click_personal_email'
  )
GROUP BY event, country, region, city
ORDER BY clicks DESC
LIMIT 200
""",
    "sections": f"""
SELECT blob1 AS section_event, SUM(_sample_interval) AS views
FROM {DATASET}
WHERE timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 IN (
    'view_research',
    'view_publications',
    'view_skills',
    'view_awards',
    'view_contact'
  )
GROUP BY section_event
ORDER BY views DESC
""",
    "recent": f"""
SELECT timestamp, blob1 AS event, blob2 AS page_path, blob3 AS referrer_host,
       blob4 AS country, blob5 AS region, blob6 AS city, blob7 AS timezone,
       blob8 AS device_class, blob9 AS event_context
FROM {DATASET}
WHERE timestamp > NOW() - INTERVAL '1' DAY
ORDER BY timestamp DESC
LIMIT 100
"""
}

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in QUERIES:
        print("Usage: python query_analytics.py [events|cities|referrers|clicks|sections|recent]")
        raise SystemExit(2)

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not account_id or not token:
        print("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN first.", file=sys.stderr)
        raise SystemExit(2)

    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql"
    req = urllib.request.Request(
        url,
        data=QUERIES[sys.argv[1]].encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "text/plain"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        payload = json.load(resp)

    print(json.dumps(payload, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
