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
  console.debug('[GFF] testing release tags against regexes:', regexes)

  // look for any link that points to a GitHub release tag
  const LINK_SELECTOR = 'a[href*="/releases/tag/"]';
  const TAG_TEXT = new RegExp('/releases/tag/(.*)', 'i')

  function getTagText(link) {
    // the underlying git tag
    const arr = TAG_TEXT.exec(link);
    if (arr && (arr.length === 2)) { // failed: arr==null, success: arr[0]=="original input str", arr[1]=="the first extracted groud"
      return arr[1];
    }  

    // fallback to the display release name filled by user (should never happen)
    return link.textContent.trim();
  }

  function isPreRelease(tag) { // returns the matched pattern
    return regexes.find(rx => rx.test(tag));
  }

  function processArticle(article) {
    // one‑and‑done
    if (article.dataset.gffProcessed) return;
    article.dataset.gffProcessed = 'true';

    const link = article.querySelector(LINK_SELECTOR);
    console.debug(article)
    if (!link) {
      console.debug('[GFF] no release link found in', article);
      return;
    }

    console.debug(`[GFF] saw release link: ${link}`, link)
    
    const tagText = getTagText(link);
    console.debug(`[GFF] get release tag text ${tagText} from link ${link}`)

    const matchedPattern = isPreRelease(tagText)
    if (matchedPattern) {
      console.info(`[GFF] ⛔️ hiding pre-release ${tagText}`, link.href, matchedPattern);
      article.style.setProperty('display', 'none', 'important');
    } else {
      console.info(`[GFF] ✅ display release ${tagText}`, link.href);
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

