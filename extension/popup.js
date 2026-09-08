const DEFAULT_API_URL = "http://localhost:3000";

const els = {
  apiUrl: document.getElementById("apiUrl"),
  projectSelect: document.getElementById("projectSelect"),
  refreshBtn: document.getElementById("refreshProjects"),
  loginBtn: document.getElementById("loginHint"),
  sendBtn: document.getElementById("send"),
  status: document.getElementById("status"),
};

function setStatus(msg, ok = true) {
  els.status.textContent = msg || "";
  els.status.className = "status " + (ok ? "ok" : "err");
}

function setSendEnabled(enabled) {
  els.sendBtn.disabled = !enabled;
}

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiUrl"], (cfg) => {
      resolve({ apiUrl: cfg.apiUrl || DEFAULT_API_URL });
    });
  });
}

async function saveApiUrl(url) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ apiUrl: url }, resolve);
  });
}

async function fetchSessionToken(apiUrl) {
  // Ask the web app for the current user's Supabase access token
  const res = await fetch(`${apiUrl}/api/extension/session`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Auth failed (${res.status})`);
  }
  return res.json();
}

async function fetchProjects(apiUrl, accessToken) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${apiUrl}/api/extension/import?list=projects`, {
    method: "GET",
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Failed to load projects (${res.status})`);
  }
  const data = await res.json();
  return data.projects || [];
}

async function loadProjectsIntoSelect(apiUrl, accessToken) {
  els.projectSelect.innerHTML = '<option value="">Loading…</option>';
  els.projectSelect.disabled = true;

  try {
    const projects = await fetchProjects(apiUrl, accessToken);
    if (!projects.length) {
      els.projectSelect.innerHTML = '<option value="">No projects — create one in the app</option>';
      els.projectSelect.disabled = true;
      return null;
    }
    els.projectSelect.innerHTML = "";
    projects.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name || "(untitled)";
      els.projectSelect.appendChild(opt);
    });
    els.projectSelect.disabled = false;

    // Restore previously selected project when still available
    const saved = await new Promise((resolve) => {
      chrome.storage.sync.get(["projectId"], (cfg) => resolve(cfg.projectId || null));
    });
    if (saved && projects.some((p) => p.id === saved)) {
      els.projectSelect.value = saved;
      return saved;
    }
    els.projectSelect.value = projects[0].id;
    await new Promise((resolve) => chrome.storage.sync.set({ projectId: projects[0].id }, resolve));
    return projects[0].id;
  } catch (e) {
    els.projectSelect.innerHTML = `<option value="">Error: ${e.message}</option>`;
    els.projectSelect.disabled = true;
    throw e;
  }
}

async function sendImport(apiUrl, accessToken, projectId) {
  // First ask content script for pins on the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    throw new Error("No active tab. Open a Pinterest board page.");
  }

  // Ensure we are on Pinterest
  const url = tab.url || "";
  if (!/pinterest\.com/i.test(url)) {
    throw new Error("Open a Pinterest board page first.");
  }

  // Request pins from content script (it will respond with extracted pins)
  const pinsResp = await new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_PINS" }, (resp) => {
      resolve(resp);
    });
  });

  if (!pinsResp || !pinsResp.ok) {
    throw new Error(pinsResp?.error || "Could not read pins from page. Make sure you are on a board and the page finished loading.");
  }

  const { pins, boardName } = pinsResp;

  if (!Array.isArray(pins) || pins.length === 0) {
    throw new Error("No pins found on this page. Scroll the board or try a different board.");
  }

  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${apiUrl}/api/extension/import`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      platform: "pinterest",
      boardName: boardName || "Pinterest Board",
      projectId,
      pins,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error("Session expired. Log in again in the InspoGrid web app.");
    if (res.status === 429) throw new Error(data.error || "Import limit reached for this month.");
    throw new Error(data.error || `Import failed (${res.status})`);
  }
  return data;
}

// Init
(async function init() {
  const { apiUrl } = await getConfig();
  els.apiUrl.value = apiUrl;

  els.apiUrl.addEventListener("change", async () => {
    const v = els.apiUrl.value.trim() || DEFAULT_API_URL;
    await saveApiUrl(v);
  });

  els.projectSelect.addEventListener("change", async () => {
    const id = els.projectSelect.value;
    if (id) {
      await new Promise((resolve) => chrome.storage.sync.set({ projectId: id }, resolve));
    }
  });

  els.refreshBtn.addEventListener("click", async () => {
    setStatus("");
    try {
      const cfg = await getConfig();
      const sess = await fetchSessionToken(cfg.apiUrl);
      await loadProjectsIntoSelect(cfg.apiUrl, sess.access_token);
      setStatus("Projects refreshed.", true);
    } catch (e) {
      setStatus(e.message || String(e), false);
    }
  });

  els.loginBtn.addEventListener("click", async () => {
    const cfg = await getConfig();
    chrome.tabs.create({ url: `${cfg.apiUrl}/login` });
  });

  els.sendBtn.addEventListener("click", async () => {
    setStatus("");
    setSendEnabled(false);
    try {
      const cfg = await getConfig();
      let accessToken = null;
      let sess;
      try {
        sess = await fetchSessionToken(cfg.apiUrl);
        accessToken = sess.access_token;
      } catch (e) {
        throw new Error("Please log into InspoGrid in your browser first (session required).");
      }

      const projectId = els.projectSelect.value;
      if (!projectId) {
        throw new Error("Select a project first.");
      }
      await new Promise((resolve) => chrome.storage.sync.set({ projectId }, resolve));

      const result = await sendImport(cfg.apiUrl, accessToken, projectId);
      const n = result.imported || 0;
      setStatus(`Imported ${n} pin${n === 1 ? "" : "s"} ✓`, true);

      // Also notify any open board page for in-page feedback if needed
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: "IMPORT_COMPLETE", count: n });
        }
      } catch {}
    } catch (e) {
      setStatus(e.message || String(e), false);
    } finally {
      setSendEnabled(true);
    }
  });

  // Boot: try to load projects using existing session
  try {
    const cfg = await getConfig();
    const sess = await fetchSessionToken(cfg.apiUrl).catch(() => null);
    if (sess?.access_token) {
      await loadProjectsIntoSelect(cfg.apiUrl, sess.access_token);
      setStatus("");
    } else {
      els.projectSelect.innerHTML = '<option value="">Log in via the InspoGrid web app</option>';
      setStatus("Not logged in. Click 'Open app to log in'.", false);
    }
  } catch (e) {
    els.projectSelect.innerHTML = '<option value="">Log in to load projects</option>';
    setStatus("Could not reach app. Check App URL.", false);
  }

  setSendEnabled(true);
})();