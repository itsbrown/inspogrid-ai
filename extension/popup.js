document.getElementById("save").addEventListener("click", () => {
  const apiUrl = document.getElementById("apiUrl").value.trim();
  const extensionKey = document.getElementById("extensionKey").value.trim();
  chrome.storage.sync.set({ apiUrl, extensionKey }, () => {
    document.getElementById("save").textContent = "Saved!";
    setTimeout(() => {
      document.getElementById("save").textContent = "Save settings";
    }, 1500);
  });
});

chrome.storage.sync.get(["apiUrl", "extensionKey"], (config) => {
  if (config.apiUrl) document.getElementById("apiUrl").value = config.apiUrl;
  if (config.extensionKey) document.getElementById("extensionKey").value = config.extensionKey;
});