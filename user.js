// ==UserScript==
// @name         Pahe Movie Ratings (IMDb & Letterboxd)
// @namespace    https://pahe.ink/
// @version      1.0
// @description  Display IMDb and Letterboxd ratings on Pahe main feed cards
// @match        https://pahe.ink/*
// @match        https://pahe./*
// @author       rehan dilawar
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pahe.ink
// @grant        GM_xmlhttpRequest
// @connect      omdbapi.com
// @connect      letterboxd.com
// @connect      *.letterboxd.com
// @updateURL    https://update.greasyfork.org/scripts/595505/source.meta.js
// @downloadURL  https://update.greasyfork.org/scripts/595505/source.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // --- PAGE RESTRICTION ---
  if (document.body.classList.contains('single') || document.body.classList.contains('single-post')) {
    return;
  }

  const isListingPage =
    document.body.classList.contains('home') ||
    document.body.classList.contains('search') ||
    document.body.classList.contains('archive') ||
    document.body.classList.contains('paged') ||
    /\/(page\/\d+|category\/|tag\/)/i.test(window.location.pathname) ||
    window.location.search.includes('s=');

  if (!isListingPage) return;

  // --- CONFIGURATION ---
  const OMDB_API_KEY = '93bfcf16';
  const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 3; // Cache for 3 days

  // --- LOGO ASSETS (SVG) ---
  const IMDB_SVG = `
    <svg width="32" height="15" viewBox="0 0 64 32" style="border-radius:3px; vertical-align:middle;">
      <rect width="64" height="32" rx="4" fill="#F5C518"/>
      <text x="32" y="23" text-anchor="middle" fill="#000000" font-family="Impact, Charcoal, sans-serif" font-weight="900" font-size="24" letter-spacing="-0.5">IMDb</text>
    </svg>`;

  const LB_SVG = `
    <svg width="22" height="13" viewBox="0 0 30 18" style="vertical-align:middle;">
      <circle cx="5" cy="9" r="4.5" fill="#FF8000"/>
      <circle cx="15" cy="9" r="4.5" fill="#00E054"/>
      <circle cx="25" cy="9" r="4.5" fill="#40BCF4"/>
    </svg>`;

  // --- STYLES ---
  const style = document.createElement('style');
  style.textContent = `
    .rating-badge-container {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
      vertical-align: middle;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
    }
    .rating-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #191b1e;
      border: 1px solid #2e3338;
      border-radius: 4px;
      padding: 1px 6px 1px 4px;
      color: #ffffff;
      line-height: 16px;
    }
    .rating-pill .star-gold { color: #f5c518; }
    .rating-pill .star-green { color: #00e054; }
  `;
  document.head.appendChild(style);

  // --- TITLE & YEAR PARSER ---
  function parseTitleAndYear(rawTitle) {
    let clean = rawTitle.trim();
    let year = '';

    const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) year = yearMatch[1];

    clean = clean.replace(/\[.*?\]/g, '');
    clean = clean.replace(/\(.*?\)/g, '');
    clean = clean.split(/\b(Season\s+\d+|Complete|WEB-DL|BluRay|WEB-HD|HDTV|NF|480p|720p|1080p|x264|x265|HEVC)\b/i)[0];
    clean = clean.replace(/[:\-_—]+$/, '').trim();

    return { title: clean, year: year };
  }

  // --- CACHE HANDLERS ---
  function getCached(key) {
    try {
      const data = localStorage.getItem('rate_' + key);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem('rate_' + key);
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  }

  function setCache(key, value) {
    try {
      localStorage.setItem('rate_' + key, JSON.stringify({ timestamp: Date.now(), value }));
    } catch {}
  }

  // --- API FETCHERS ---
  function fetchOmdb(title, year) {
    return new Promise((resolve) => {
      const cacheKey = `omdb_${title}_${year}`;
      const cached = getCached(cacheKey);
      if (cached) return resolve(cached);

      const yParam = year ? `&y=${encodeURIComponent(year)}` : '';
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://www.omdbapi.com/?t=${encodeURIComponent(title)}${yParam}&apikey=${OMDB_API_KEY}`,
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            if (data.Response === 'True') {
              const result = {
                rating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null,
                imdbId: data.imdbID || null
              };
              setCache(cacheKey, result);
              return resolve(result);
            }
          } catch {}
          resolve({ rating: null, imdbId: null });
        },
        onerror: () => resolve({ rating: null, imdbId: null })
      });
    });
  }

  function parseLetterboxdHtml(html) {
    if (!html) return null;

    // 1. JSON-LD structured data
    const jsonLdMatch = html.match(/"ratingValue"\s*:\s*([0-9.]+)/i);
    if (jsonLdMatch) return parseFloat(jsonLdMatch[1]).toFixed(1);

    // 2. Twitter meta tag: <meta name="twitter:data2" content="3.2 out of 5" />
    const twitterMatch = html.match(/content="([0-9.]+)\s+out\s+of\s+5"/i);
    if (twitterMatch) return parseFloat(twitterMatch[1]).toFixed(1);

    // 3. HTML tag data attribute
    const attrMatch = html.match(/data-average-rating="([0-9.]+)"/i);
    if (attrMatch) return parseFloat(attrMatch[1]).toFixed(1);

    return null;
  }

  function fetchLetterboxd(title, year, imdbId) {
    return new Promise((resolve) => {
      const cacheKey = `lb_${title}_${year}`;
      const cached = getCached(cacheKey);
      if (cached) return resolve(cached);

      // Strategy 1: Direct resolution using IMDb ID (fastest, avoids search mismatch)
      if (imdbId) {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://letterboxd.com/imdb/${imdbId}/`,
          headers: {
            'User-Agent': navigator.userAgent,
            'Accept': 'text/html,application/xhtml+xml'
          },
          onload: (res) => {
            const rating = parseLetterboxdHtml(res.responseText);
            if (rating) {
              setCache(cacheKey, rating);
              return resolve(rating);
            }
            // Fallback to title search if IMDb redirect failed
            searchLetterboxdByTitle(title, year).then(resolve);
          },
          onerror: () => searchLetterboxdByTitle(title, year).then(resolve)
        });
      } else {
        searchLetterboxdByTitle(title, year).then(resolve);
      }
    });
  }

  function searchLetterboxdByTitle(title, year) {
    return new Promise((resolve) => {
      const query = `${title} ${year}`.trim();
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://letterboxd.com/search/${encodeURIComponent(query)}/`,
        headers: {
          'User-Agent': navigator.userAgent,
          'Accept': 'text/html,application/xhtml+xml'
        },
        onload: (res) => {
          const match = res.responseText.match(/href="\/film\/([a-z0-9-]+)\/"/i);
          if (!match) return resolve(null);

          const filmSlug = match[1];
          GM_xmlhttpRequest({
            method: 'GET',
            url: `https://letterboxd.com/film/${filmSlug}/`,
            headers: { 'Accept': 'text/html,application/xhtml+xml' },
            onload: (filmRes) => {
              const rating = parseLetterboxdHtml(filmRes.responseText);
              if (rating) setCache(`lb_${title}_${year}`, rating);
              resolve(rating);
            },
            onerror: () => resolve(null)
          });
        },
        onerror: () => resolve(null)
      });
    });
  }

  // --- INJECTION WORKER ---
  async function processTitleElement(titleLink) {
    if (titleLink.dataset.ratingsLoaded) return;
    titleLink.dataset.ratingsLoaded = 'true';

    const { title, year } = parseTitleAndYear(titleLink.textContent);
    if (!title) return;

    // Fetch OMDb first to get both the rating and the exact IMDb ID
    const omdbData = await fetchOmdb(title, year);
    const imdbScore = omdbData.rating;

    // Use IMDb ID to resolve Letterboxd with precision
    const lbScore = await fetchLetterboxd(title, year, omdbData.imdbId);

    if (!imdbScore && !lbScore) return;

    const container = document.createElement('span');
    container.className = 'rating-badge-container';

    if (imdbScore) {
      container.innerHTML += `
        <span class="rating-pill">
          ${IMDB_SVG}
          <span class="star-gold">★</span>
          <span>${imdbScore}</span>
        </span>`;
    }

    if (lbScore) {
      container.innerHTML += `
        <span class="rating-pill">
          ${LB_SVG}
          <span class="star-green">★</span>
          <span>${lbScore}</span>
        </span>`;
    }

    titleLink.insertAdjacentElement('afterend', container);
  }

  // Target headline post titles on listing pages
  const titles = document.querySelectorAll('h2.post-box-title a');
  titles.forEach((titleLink) => processTitleElement(titleLink));
})();
