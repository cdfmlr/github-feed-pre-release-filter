// ==UserScript==
// @name         GitHub Feed Pre-release Filter
// @namespace    https://github.com/yourusername
// @version      0.1
// @description  Hide pre‑release events from the GitHub "For You" feed
// @author       Your Name
// @match        https://github.com/
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  // === User‑configurable regex patterns for what counts as a pre-release. ===
  // You can add or remove patterns here. They are case‑insensitive.
  const PRE_RELEASE_PATTERNS = [
    'nightly',
    'dev\\d*',
    'rc\\d+(?:\\.\\d+)?'
  ];
  const regexes = PRE_RELEASE_PATTERNS.map(p => new RegExp(p, 'i'));

  // Utility to test a string against all pre‑release patterns
  function isPreRelease(tagName) {
    return regexes.some(rx => rx.test(tagName));
  }

  // Process a single <article> element: hide if it’s a pre‑release
  function processArticle(article) {
    if (article.dataset.gffProcessed) return;
    article.dataset.gffProcessed = 'true';

    const link = article.querySelector('h3 a');
    if (!link) return;

    const tagText = link.textContent.trim();
    if (isPreRelease(tagText)) {
      // hide the entire release item
      article.style.setProperty('display', 'none', 'important');
    }
  }

  // Initial sweep
  document.querySelectorAll('article').forEach(processArticle);

  // Watch for dynamically inserted feed items
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.tagName === 'ARTICLE') {
          processArticle(node);
        }
        // sometimes GitHub wraps articles in extra divs
        else if (node.nodeType === 1) {
          node.querySelectorAll('article').forEach(processArticle);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
