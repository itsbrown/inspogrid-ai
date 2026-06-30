const DEFAULT_API_URL = "http://localhost:3000";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "IMPORT_PINS") {
    chrome.storage.sync.get(["apiUrl", "extensionKey"], async (config) => {
      const apiUrl = config.apiUrl || DEFAULT_API_URL;
      const extensionKey = config.extensionKey || "dev-extension-key-change-in-production";

      try {
        const res = await fetch(`${apiUrl}/api/extension/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-extension-key": extensionKey,
          },
          body: JSON.stringify(message.payload),
        });
        const data = await res.json();
        sendResponse({ ok: res.ok, data });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    });
    return true;
  }
});