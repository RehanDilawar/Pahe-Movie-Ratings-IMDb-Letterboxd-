# 🎬 Pahe Movie Ratings (IMDb & Letterboxd)

[![Version](https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge)](https://github.com/rehandilawar)
[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-Install%20Script-red?style=for-the-badge&logo=greasyfork)](https://greasyfork.org/en/scripts/595505)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Supported-green?style=for-the-badge&logo=tampermonkey)](https://www.tampermonkey.net/)
[![Violentmonkey](https://img.shields.io/badge/Violentmonkey-Supported-orange?style=for-the-badge)](https://violentmonkey.github.io/)
[![IMDb](https://img.shields.io/badge/IMDb-Ratings-F5C518?style=for-the-badge&logo=imdb&logoColor=black)](https://www.imdb.com/)
[![Letterboxd](https://img.shields.io/badge/Letterboxd-Scores-00E054?style=for-the-badge&logo=letterboxd&logoColor=white)](https://letterboxd.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

A fast, lightweight userscript designed to display live IMDb and Letterboxd rating badges directly on title cards across **pahe.ink** listing feeds[cite: 1]. It features intelligent regex title cleansing, two-tier ID-based score resolution, and persistent local storage caching to eliminate unnecessary API overhead[cite: 1].

---

> [!IMPORTANT]
> **Precision Two-Tier Resolution Engine:**  
> The script queries the **OMDb API** first to retrieve both the IMDb rating and official IMDb ID (`tt...`)[cite: 1]. It then routes directly through `letterboxd.com/imdb/{imdbId}/` to resolve exact Letterboxd pages, bypassing title-search disambiguation screens[cite: 1].

> [!WARNING]
> **Listing-Only Execution (Single Post Safe-Mode):**  
> Script execution is strictly disabled on single movie pages (`body.single`, `body.single-post`) where post metadata already exists[cite: 1]. This eliminates redundant background API requests and prevents layout shifts[cite: 1].

> [!TIP]
> **Smart 3-Day Local Caching:**  
> All fetched scores are preserved in browser `localStorage` with a 3-day time-to-live (TTL)[cite: 1]. Navigating between pages or returning to previous listings renders scores instantly without extra network lookups[cite: 1].

---

## ✨ Features

- ⭐ **Dual Rating Badges:** Injects dark-themed rating pills with official IMDb and Letterboxd score stars next to post headline titles[cite: 1].
- 🧹 **Regex Title Sanitization:** Strips media tags (`BluRay`, `WEB-DL`), resolutions (`720p`, `1080p`), encodings (`x264`, `HEVC`), and brackets to isolate the accurate release title and year[cite: 1].
- 🎯 **Direct IMDb ID Mapping:** Resolves Letterboxd ratings using the verified IMDb ID directly, avoiding incorrect movie matches[cite: 1].
- 🔍 **Multi-Target Scraper Fallback:** Parses Letterboxd scores via JSON-LD structured data, Twitter card meta attributes, and HTML data tags if fallback search is needed[cite: 1].
- 🗄️ **Persistent Local Cache:** Stores fetched results for 72 hours (`CACHE_TTL_MS`), ensuring minimal API usage and instant page navigation[cite: 1].
- ⚡ **Zero Layout Flashing:** Operates asynchronously at `document-idle` on `h2.post-box-title a` elements so media browsing remains smooth[cite: 1].

---

## 🌐 Scope & Service Integrations

| Target / Endpoint | Details | Scope | Function |
| :--- | :--- | :---: | :--- |
| **Pahe Listing Feeds**[cite: 1] | `pahe.ink/*`, `pahe./*`[cite: 1] | ✅ Active[cite: 1] | Injects rating badges across Home, Search, Archive, Category, and Tag feeds[cite: 1]. |
| **Pahe Single Posts**[cite: 1] | `body.single`, `body.single-post`[cite: 1] | ❌ **Excluded**[cite: 1] | **Safe-Mode:** Halts execution to eliminate unnecessary lookups on single post pages[cite: 1]. |
| **OMDb API**[cite: 1] | `omdbapi.com`[cite: 1] | ✅ Connected[cite: 1] | Retrieves IMDb ratings and extracts verified `imdbID` strings[cite: 1]. |
| **Letterboxd Direct**[cite: 1] | `letterboxd.com/imdb/*`[cite: 1] | ✅ Connected[cite: 1] | Direct ID redirect matching for high-precision Letterboxd scoring[cite: 1]. |
| **Letterboxd Search**[cite: 1] | `letterboxd.com/search/*`[cite: 1] | ✅ Connected[cite: 1] | Secondary fallback parser using sanitized title and release year queries[cite: 1]. |

---

## 🚀 Installation

### Step 1: Install a Userscript Manager
Make sure you have an active userscript manager extension installed:
* 🐵 **[Tampermonkey](https://www.tampermonkey.net/)** *(Recommended)*
* 🐒 **[Violentmonkey](https://violentmonkey.github.io/)**

### Step 2: Install the Script
Install via your userscript manager or install directly from Greasy Fork:  
👉 **[Install from Greasy Fork](https://greasyfork.org/en/scripts/595505)**

*(Alternatively, create a new script in your dashboard and paste the raw `.user.js` code[cite: 1]).*

### Step 3: Browse Pahe Listing Pages
Open `https://pahe.ink`[cite: 1]. As you browse home feeds or search results, rating badges will automatically append beside each title[cite: 1].

---

## 📄 License

This project is open source and distributed under the **[MIT License](LICENSE)**[cite: 1].

---

## 🛠️ Author & Support
* Developed and maintained by **[Rehan Dilawar](https://github.com/rehandilawar)**[cite: 1].
* Encountered an unparsed movie title or broken selector? Open an issue on **[GitHub](https://github.com/rehandilawar)**.

---

<p align="center">
  ⭐️ <em>If you found this script helpful, please consider starring the repository!</em>
</p>
