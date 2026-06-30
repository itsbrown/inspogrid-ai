# InspoGrid Chrome Extension (MVP)

Manifest V3 extension that adds a **Send to InspoGrid** button on Pinterest board pages.

## Load unpacked

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this `extension/` folder
4. Set App URL and API key in the extension popup (match `EXTENSION_API_KEY` in `web/.env.local`)

## Flow

1. User opens a Pinterest board
2. Clicks floating **Send to InspoGrid** button
3. Content script extracts visible pin thumbnails + metadata
4. Background worker POSTs to `/api/extension/import`

Full project linking (auto-create mood board) is V1 — endpoint scaffold is ready.