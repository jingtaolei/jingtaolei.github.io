-- Workers Analytics Engine dataset:
--   jingtao_academic_events
--
-- Field map:
--   blob1 = event
--   blob2 = page_path
--   blob3 = referrer_host
--   blob4 = country
--   blob5 = region
--   blob6 = city
--   blob7 = timezone
--   blob8 = device_class
--   blob9 = event_context
--   double1 = 1
--   timestamp = Analytics Engine event time
--
-- Use SUM(_sample_interval) rather than COUNT(*) so queries remain correct
-- if Analytics Engine ever samples a high-volume dataset.

-- 1) Overall event counts in the last 7 days
SELECT
  blob1 AS event,
  SUM(_sample_interval) AS events
FROM jingtao_academic_events
WHERE timestamp > NOW() - INTERVAL '7' DAY
GROUP BY event
ORDER BY events DESC;

-- 2) Anonymous page views by country / region / city in the last 30 days
SELECT
  blob4 AS country,
  blob5 AS region,
  blob6 AS city,
  SUM(_sample_interval) AS page_views
FROM jingtao_academic_events
WHERE
  timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'page_view'
GROUP BY country, region, city
ORDER BY page_views DESC
LIMIT 100;

-- 3) CV clicks by approximate city
SELECT
  blob4 AS country,
  blob5 AS region,
  blob6 AS city,
  SUM(_sample_interval) AS cv_clicks
FROM jingtao_academic_events
WHERE
  timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'click_cv'
GROUP BY country, region, city
ORDER BY cv_clicks DESC
LIMIT 100;

-- 4) GitHub / project-code clicks by location
SELECT
  blob1 AS event,
  blob4 AS country,
  blob5 AS region,
  blob6 AS city,
  SUM(_sample_interval) AS clicks
FROM jingtao_academic_events
WHERE
  timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 IN ('click_github_profile', 'click_project_code')
GROUP BY event, country, region, city
ORDER BY clicks DESC
LIMIT 100;

-- 5) Top referrer hosts for page views
SELECT
  blob3 AS referrer_host,
  SUM(_sample_interval) AS page_views
FROM jingtao_academic_events
WHERE
  timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'page_view'
GROUP BY referrer_host
ORDER BY page_views DESC
LIMIT 50;

-- 6) Major-section reach
SELECT
  blob1 AS section_event,
  SUM(_sample_interval) AS views
FROM jingtao_academic_events
WHERE
  timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 IN (
    'view_research',
    'view_publications',
    'view_skills',
    'view_awards',
    'view_contact'
  )
GROUP BY section_event
ORDER BY views DESC;

-- 7) Device-class distribution for page views
SELECT
  blob8 AS device_class,
  SUM(_sample_interval) AS page_views
FROM jingtao_academic_events
WHERE
  timestamp > NOW() - INTERVAL '30' DAY
  AND blob1 = 'page_view'
GROUP BY device_class
ORDER BY page_views DESC;

-- 8) Recent raw events (useful for initial testing; still contains no IP/user ID)
SELECT
  timestamp,
  blob1 AS event,
  blob2 AS page_path,
  blob3 AS referrer_host,
  blob4 AS country,
  blob5 AS region,
  blob6 AS city,
  blob7 AS timezone,
  blob8 AS device_class,
  blob9 AS event_context
FROM jingtao_academic_events
WHERE timestamp > NOW() - INTERVAL '1' DAY
ORDER BY timestamp DESC
LIMIT 100;
