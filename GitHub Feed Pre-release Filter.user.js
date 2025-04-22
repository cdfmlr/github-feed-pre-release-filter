// ==UserScript==
// @name         GitHub Feed Pre-release Filter
// @namespace    https://github.com/cdfmlr
// @version      0.3
// @description  Hide pre‑release events (nightly/dev/rc) from the new GitHub dashboard "For You" feed. (This script is produced by vibe coding, used it carefully.)
// @author       CDFMLR
// @match        https://github.com/
// @match        https://github.com/dashboard*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  // ◼︎ edit these to taste; no ^…$ anchoring, just “does it contain…?”
  const PRE_RELEASE_PATTERNS = [
    'nightly',
    'dev.*',
    'alpha.*',
    'beta.*',
    'rc.*',
    'preview',
    '预览'
  ];
  const regexes = PRE_RELEASE_PATTERNS.map(p => new RegExp(p, 'i'));

  // look for any link that points to a GitHub release tag
  const LINK_SELECTOR = 'a[href*="/releases/tag/"]';

  function isPreRelease(tag) {
    return regexes.some(rx => rx.test(tag));
  }

  function processArticle(article) {
    // one‑and‑done
    if (article.dataset.gffProcessed) return;
    article.dataset.gffProcessed = 'true';

    const link = article.querySelector(LINK_SELECTOR);
    if (!link) {
      // console.debug('[GFF] no release link found in', article);
      return;
    }

    const tagText = link.textContent.trim();
    // console.debug(`[GFF] saw release tag "${tagText}" – testing against`, PRE_RELEASE_PATTERNS);

    if (isPreRelease(tagText)) {
      console.info(`[GFF] hiding pre-release ${tagText}`);
      article.style.setProperty('display', 'none', 'important');
    }
  }

  function scanAll() {
    document.querySelectorAll('article').forEach(processArticle);
  }

  // 1) initial pass once idle
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(scanAll, { timeout: 3000 });
  } else {
    setTimeout(scanAll, 2000);
  }

  // 2) watch for any new nodes
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'ARTICLE') processArticle(n);
        else n.querySelectorAll('article').forEach(processArticle);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // 3) GitHub SPA navigation hooks
  ['pjax:end','turbo:load','github:container:updated'].forEach(evt =>
    document.addEventListener(evt, scanAll, true)
  );

  // 4) fallback sweep every 3s
  setInterval(scanAll, 3000);
})();

