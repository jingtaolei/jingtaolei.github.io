# Jingtao Lei

This repository contains the source code for my personal academic website:

**https://jingtaolei.github.io**

I am an Applied Mathematics undergraduate at Central South University, studying in the Dundee International Institute through a dual-degree programme with the University of Dundee.

My current research interests are mainly in **multimodal learning, generative models, video diffusion models, and world models**. I am particularly interested in how vision and video can give AI systems richer perception of the physical world, and how generative models can move beyond producing content for people toward learning representations that support prediction, reasoning, and eventually interaction with the world.

My recent research includes:

- studying physical dynamics representations in **CogVideoX-2B** and exploring how video diffusion models could be extended toward world-model capabilities;
- developing a **layer-wise gate-controlled prompt truncation** method for parameter-efficient multimodal learning, now available as an arXiv preprint: **[arXiv:2609.06590](https://arxiv.org/abs/2609.06590)**.

The website includes a summary of my research experience, current arXiv preprint, technical background, awards, and CV.

For academic or research-related communication, please contact me at **2617549@dundee.ac.uk**.  
For general communication, you can also reach me at **leijingtao2005@gmail.com**.


## Analytics and privacy

The site uses **Cloudflare Web Analytics** plus a small anonymous event collector built with **Cloudflare Workers + Workers Analytics Engine**.

The custom collector records only coarse, non-persistent information such as event type, page path, referring host, approximate country/region/city, timezone, coarse device class, and event time. It does **not** store IP addresses, cookies, persistent visitor IDs, session IDs, email addresses, precise coordinates, full user-agent strings, or browser fingerprints.

Tracked interactions include page views, major-section views, and clicks on the CV, GitHub profile, project code, Publications navigation, and contact links.

The site does not use Google Analytics, Microsoft Clarity, session recording, advertising trackers, or analytics cookies. See `privacy.html` for the public disclosure.

The anonymous event endpoint is deployed at `https://jingtao-academic-analytics.leijingtao2005.workers.dev/event`. The Worker source and query helpers are included in `cloudflare-worker/` for maintenance and inspection.

## Local UI preview

From this directory, run `python3 -m http.server 4173 --bind 127.0.0.1`, then open `http://127.0.0.1:4173`.

The interface combines Monet’s *Cliff Walk at Pourville* and Sisley’s *The Banks of the Oise* with a paper palette and frosted navigation. The ∀ mark connects the Turn A influence with mathematical inquiry. Lightweight SVG studies illustrate video observations, physical interaction, prompt gating, and the research toolkit. Motion runs only while the corresponding illustration is visible, pauses when the page is hidden, and respects reduced-motion preferences. Publication, toolkit, and contact-message illustrations animate on hover or keyboard focus. The navigation blends into the homepage painting at the top and softly gains a glass surface on scroll. Research notes smoothly expand and collapse using the keyboard or a click, while adjacent illustrations stay still. Local previews do not send production analytics.

The current design is version 9. It preserves the version 8 appearance and interactions while reducing publication files and conservatively compacting CSS/JS. Complete checkpoints and archived artistic research are in the parent directory’s `ui-backups/` and `website-archive/`. See `maintenance/v9-resources.md` for the audit and cache-retention policy.

## Building and publishing

Run `npm ci` once, then `npm run build`. Verify with `npm run check` and `npm test`. Editable source CSS/JS and artwork remain in this repository. The build generates content-addressed resources and a minimal `dist/` preview; it does not publish or change GitHub automatically.

GitHub Pages can continue building the main branch root. Commit the generated HTML/resources and `_config.yml`, which excludes developer files, source artwork, local dependencies and documentation from the public site. For other static hosting, deploy only `dist/`. Do not upload `node_modules/` or local archives.

After Pages confirms a release, record its actual commit with `python3 tools/build_site.py --record-published COMMIT_SHA`. Old published assets stay protected during the cache grace period; local drafts do not become permanent retained releases. `python3 tools/build_site.py --archive-unused` moves unprotected fingerprints into a recoverable local archive and rebuilds the lean preview. See the maintenance guide before retiring older resources. UI arrows and the botanical asterisk are inline SVGs to avoid mobile emoji substitution.
