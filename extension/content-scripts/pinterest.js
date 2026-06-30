(function () {
  const BUTTON_ID = "inspogrid-send-btn";

  function extractPins() {
    const pins = [];
    document.querySelectorAll('div[data-test-id="pin"]').forEach((el, i) => {
      const img = el.querySelector("img");
      const link = el.querySelector('a[href*="/pin/"]');
      if (!img) return;
      pins.push({
        title: img.alt || `Pin ${i + 1}`,
        imageUrl: img.src,
        sourceUrl: link ? `https://www.pinterest.com${link.getAttribute("href")}` : null,
      });
    });
    return pins;
  }

  function getBoardName() {
    const heading = document.querySelector("h1");
    return heading?.textContent?.trim() || "Pinterest Board";
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.textContent = "Send to InspoGrid";
    btn.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 20px;background:#e11d48;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15)";
    btn.addEventListener("click", () => {
      const pins = extractPins();
      chrome.runtime.sendMessage(
        {
          type: "IMPORT_PINS",
          payload: { platform: "pinterest", boardName: getBoardName(), pins },
        },
        (response) => {
          if (response?.ok) {
            btn.textContent = `Sent ${pins.length} pins ✓`;
          } else {
            btn.textContent = "Import failed — check app";
          }
          setTimeout(() => {
            btn.textContent = "Send to InspoGrid";
          }, 3000);
        }
      );
    });
    document.body.appendChild(btn);
  }

  if (location.pathname.includes("/") && !location.pathname.includes("/pin/")) {
    injectButton();
  }
})();