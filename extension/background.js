const DEFAULT_API_URL = "http://localhost:3000";

async function getSync(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (cfg) => resolve(cfg || {}));
  });
}

async function fetchSessionToken(apiUrl) {
  const res = await fetch(`${apiUrl}/api/extension/session`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Auth failed (${res.status})`);
  }
  if (!data.access_token) {
    throw new Error("No active session token");
  }
  return data.access_token;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "IMPORT_PINS") return;

  (async () => {
    try {
      const config = await getSync(["apiUrl", "projectId"]);
      const apiUrl = config.apiUrl || DEFAULT_API_URL;
      const projectId = config.projectId;

      if (!projectId) {
        sendResponse({
          ok: false,
          error: "Select a project in the extension popup first.",
        });
        return;
      }

      let accessToken;
      try {
        accessToken = await fetchSessionToken(apiUrl);
      } catch {
        sendResponse({
          ok: false,
          error: "Session expired — please log in to web app",
        });
        return;
      }

      const payload = {
        ...(message.payload || {}),
        projectId,
      };

      if (!Array.isArray(payload.pins) || payload.pins.length === 0) {
        sendResponse({ ok: false, error: "No pins found on this board" });
        return;
      }

      const res = await fetch(`${apiUrl}/api/extension/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        let error = data.error || `HTTP ${res.status}`;
        if (res.status === 401) error = "Session expired — please log in to web app";
        if (res.status === 429) error = data.error || "Import limit reached";
        sendResponse({ ok: false, error, data });
        return;
      }
      sendResponse({ ok: true, data });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();

  return true;
});
