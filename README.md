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

The current design is version 7. Complete checkpoints through version 6 are in the parent directory’s `ui-backups/`. Artistic research is documented in `design-notes/direction.md`; the latest changes are in `design-notes/v7-material-and-composition.md`.

## Preparing a static release

After editing HTML, root CSS/JS, or original artwork, run `python3 tools/prepare_assets.py` and `python3 tools/prepare_assets.py --check` before publishing. The generator updates page references to content-addressed copies in `assets/versioned/`, retains older copies for cached entry pages, and writes `site-version.json`. Publish those files along with the HTML and manifest. No hosting change is required. See `design-notes/cache-and-symbols.md` for the recovery behavior and the first-release limitation. UI arrows and the botanical asterisk are inline SVGs to avoid mobile emoji substitution.
