(function () {
  const BUTTON_ID = "inspogrid-send-btn";
  let lastPins = [];
  let lastBoardName = "Pinterest Board";

  function isBoardLikePath() {
    const p = location.pathname || "";
    if (p.includes("/pin/")) return false;
    if (p.includes("/search/")) return false;
    if (p.includes("/settings/")) return false;
    if (p.includes("/ideas/")) return false;
    return true;
  }

  function bestImageSrc(img) {
    if (!img) return null;
    const dataSrc = img.getAttribute("data-src") || img.getAttribute("data-srcset");
    if (dataSrc) {
      const first = dataSrc.split(",")[0].trim().split(" ")[0];
      if (first) return first;
    }
    const srcset = img.getAttribute("srcset");
    if (srcset) {
      const candidates = srcset.split(",").map((s) => {
        const parts = s.trim().split(" ");
        return { url: parts[0], w: parseInt(parts[1] || "0", 10) || 0 };
      }).sort((a, b) => b.w - a.w);
      if (candidates[0]?.url) return candidates[0].url;
    }
    let src = img.currentSrc || img.src || "";
    try {
      src = src.replace(/\/236x\//, "/736x/").replace(/\/474x\//, "/736x/");
      if (src.includes("pinimg.com") && !src.includes("/originals/")) {
        src = src.replace(/\/(236x|474x|736x)\//, "/originals/");
      }
    } catch {}
    return src || null;
  }

  function extractPins() {
    const pins = [];
    const pinEls = document.querySelectorAll([
      'div[data-test-id="pin"]',
      'div[data-test-id="pinWrapper"]',
      'div[role="listitem"] a[href*="/pin/"]',
      'article',
    ].join(","));

    const seen = new Set();

    pinEls.forEach((el, i) => {
      let img = el.querySelector("img");
      if (!img) return;

      const imageUrl = bestImageSrc(img);
      if (!imageUrl) return;

      let linkEl = el.querySelector('a[href*="/pin/"]');
      if (!linkEl && el.tagName === "A" && el.href && el.href.includes("/pin/")) {
        linkEl = el;
      }
      let sourceUrl = null;
      if (linkEl && linkEl.getAttribute("href")) {
        const href = linkEl.getAttribute("href");
        sourceUrl = href.startsWith("http") ? href : `https://www.pinterest.com${href}`;
      }

      const title = (img.alt || el.getAttribute("aria-label") || `Pin ${i + 1}`).trim();

      const key = imageUrl + "|" + (sourceUrl || "");
      if (seen.has(key)) return;
      seen.add(key);

      pins.push({
        title: title.slice(0, 200),
        imageUrl,
        sourceUrl,
      });
    });

    if (pins.length === 0 && isBoardLikePath()) {
      document.querySelectorAll("img").forEach((img, i) => {
        const src = bestImageSrc(img);
        if (!src) return;
        if (!/pinimg|pin\.it|pinterest/i.test(src)) return;
        const key = src;
        if (seen.has(key)) return;
        seen.add(key);
        pins.push({
          title: (img.alt || `Pin ${i + 1}`).slice(0, 200),
          imageUrl: src,
          sourceUrl: null,
        });
      });
    }

    lastPins = pins;
    return pins;
  }

  function getBoardName() {
    const candidates = [
      document.querySelector('h1'),
      document.querySelector('[data-test-id="board-name"]'),
      document.querySelector('[data-test-id="boardHeaderName"]'),
      document.querySelector('div[role="heading"]'),
    ];
    for (const el of candidates) {
      if (el && el.textContent && el.textContent.trim().length > 1) {
        return el.textContent.trim();
      }
    }
    const t = (document.title || "").replace(/\s*\|.*$/, "").trim();
    return t || "Pinterest Board";
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!isBoardLikePath()) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.textContent = "Send to InspoGrid";
    btn.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:2147483647;padding:12px 18px;background:#e11d48;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.18);font-size:14px";
    btn.addEventListener("click", () => {
      const pins = extractPins();
      lastBoardName = getBoardName();
      chrome.runtime.sendMessage(
        {
          type: "IMPORT_PINS",
          payload: { platform: "pinterest", boardName: lastBoardName, pins },
        },
        (response) => {
          if (response?.ok) {
            const n = response.data?.imported ?? pins.length;
            btn.textContent = `Imported ${n} pins ✓`;
          } else {
            const msg = response?.error || "Import failed — check app";
            btn.textContent = msg.length > 28 ? "Import failed" : msg;
          }
          setTimeout(() => {
            btn.textContent = "Send to InspoGrid";
          }, 2800);
        }
      );
    });
    document.body.appendChild(btn);
  }

  function removeButtonIfWrongPage() {
    const btn = document.getElementById(BUTTON_ID);
    if (btn && !isBoardLikePath()) {
      btn.remove();
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "GET_PINS") {
      try {
        const pins = extractPins();
        lastBoardName = getBoardName();
        sendResponse({ ok: true, pins, boardName: lastBoardName });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
      return true;
    }
    if (message && message.type === "IMPORT_COMPLETE") {
      const btn = document.getElementById(BUTTON_ID);
      if (btn) {
        const n = message.count || 0;
        btn.textContent = `Imported ${n} pin${n === 1 ? "" : "s"} ✓`;
        setTimeout(() => {
          if (btn && btn.parentNode) btn.textContent = "Send to InspoGrid";
        }, 2600);
      }
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });

  let lastUrl = location.href;
  function onUrlMaybeChanged() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        const existing = document.getElementById(BUTTON_ID);
        if (existing) existing.remove();
        if (isBoardLikePath()) {
          injectButton();
          setTimeout(() => extractPins(), 800);
        } else {
          removeButtonIfWrongPage();
        }
      }, 150);
    }
  }

  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function () {
    origPush.apply(this, arguments);
    onUrlMaybeChanged();
  };
  history.replaceState = function () {
    origReplace.apply(this, arguments);
    onUrlMaybeChanged();
  };
  window.addEventListener("popstate", onUrlMaybeChanged);

  let mo = null;
  function startObserver() {
    if (mo) mo.disconnect();
    mo = new MutationObserver(() => {
      if (isBoardLikePath() && document.getElementById(BUTTON_ID)) {
        extractPins();
      }
    });
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  function boot() {
    if (isBoardLikePath()) {
      injectButton();
      setTimeout(() => {
        extractPins();
      }, 650);
    }
    startObserver();
    setInterval(() => {
      if (isBoardLikePath()) {
        const btn = document.getElementById(BUTTON_ID);
        if (!btn) injectButton();
      }
    }, 4000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();