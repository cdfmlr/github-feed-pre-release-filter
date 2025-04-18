// ==UserScript==
// @name         GitHub Feed Pre-release Filter
// @namespace    https://github.com/yourusername
// @version      0.2
// @description  Hide pre‑release events (nightly/dev/rc) from the GitHub "For You" feed
// @author       Your Name
// @match        https://github.com/
// @match        https://github.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  const PRE_RELEASE_PATTERNS = [
    'nightly',
    'dev.*',
    'rc.*'
  ];
  const regexes = PRE_RELEASE_PATTERNS.map(p => new RegExp(`^${p}$`, 'i'));

  function isPreRelease(tag) {
    return regexes.some(rx => rx.test(tag.trim()));
  }

  function processArticle(article) {
    if (article.dataset.gffProcessed) return;
    article.dataset.gffProcessed = 'true';

    const link = article.querySelector('h3 a');
    if (link && isPreRelease(link.textContent)) {
      article.style.setProperty('display', 'none', 'important');
    }
  }

  function scanAll() {
    document.querySelectorAll('article').forEach(processArticle);
  }

  // 1) Initial scan once the page is idle:
  window.requestIdleCallback(scanAll, { timeout: 2000 });

  // 2) MutationObserver for any late-inserted articles:
  const observer = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'ARTICLE') processArticle(node);
        else node.querySelectorAll('article').forEach(processArticle);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // 3) Re-scan on GitHub’s PJAX/SPA navigation events:
  ['pjax:end', 'turbo:load', 'github:container:updated'].forEach(evt =>
    document.addEventListener(evt, scanAll, true)
  );
})();
