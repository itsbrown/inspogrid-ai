# InspoGrid Chrome Extension (Phase 1.2)

Manifest V3 extension that sends Pinterest pins to InspoGrid projects.

## Load unpacked

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this `extension/` folder
4. Set App URL in the popup (default: http://localhost:3000). No shared key required.

## Authentication (Approach B)

- Primary: Uses your existing Supabase session from the web app (`/api/extension/session`).
- Open the InspoGrid web app and log in first (same browser profile).
- The popup fetches your current session token and lists your projects.
- The shared `EXTENSION_API_KEY` is now optional legacy fallback only.

## Flow

1. Log into InspoGrid web app in Chrome.
2. Open a Pinterest board page.
3. Open the extension popup → select target project → click "Send pins to selected project".
4. Content script extracts pins (handles SPA nav, best-res image URLs via srcset/data-src + URL upgrades).
5. Pins are persisted to `image_assets` (pinterest platform) with usage limit enforcement.

## In-page button

A floating "Send to InspoGrid" button is also injected for quick use. Feedback shows "Imported N pins".

## Errors surfaced

- Not logged in / session expired → clear message to log in via web app.
- Empty board / no pins detected → "No pins found…".
- Quota exceeded → 429 with message.
- Invalid project → 404.

## Project picker

Popup shows your projects (fetched live). "Refresh projects" re-queries after creating new boards in the web app.