# Jingtao Lei

This repository contains the source code for my personal academic website:

**https://jingtaolei.github.io**

I am an Applied Mathematics undergraduate at Central South University, studying in the Dundee International Institute through a dual-degree programme with the University of Dundee.

My current research interests are mainly in **multimodal learning, generative models, video diffusion models, and world models**. I am particularly interested in how vision and video can give AI systems richer perception of the physical world, and how generative models can move beyond producing content for people toward learning representations that support prediction, reasoning, and eventually interaction with the world.

My recent research includes:

- studying physical dynamics representations in **CogVideoX-2B** and exploring how video diffusion models could be extended toward world-model capabilities;
- developing a **sample-wise dynamic prompt truncation** method for parameter-efficient multimodal learning.

The website includes a summary of my research experience, current manuscript, technical background, awards, and CV.

For academic or research-related communication, please contact me at **2617549@dundee.ac.uk**.  
For general communication, you can also reach me at **leijingtao2005@gmail.com**.


## Analytics and privacy

The site uses **Cloudflare Web Analytics** plus a small anonymous event collector built with **Cloudflare Workers + Workers Analytics Engine**.

The custom collector records only coarse, non-persistent information such as event type, page path, referring host, approximate country/region/city, timezone, coarse device class, and event time. It does **not** store IP addresses, cookies, persistent visitor IDs, session IDs, email addresses, precise coordinates, full user-agent strings, or browser fingerprints.

Tracked interactions include page views, major-section views, and clicks on the CV, GitHub profile, project code, Publications navigation, and contact links.

The site does not use Google Analytics, Microsoft Clarity, session recording, advertising trackers, or analytics cookies. See `privacy.html` for the public disclosure.

The anonymous event endpoint is deployed at `https://jingtao-academic-analytics.leijingtao2005.workers.dev/event`. The Worker source and query helpers are included in `cloudflare-worker/` for maintenance and inspection.
