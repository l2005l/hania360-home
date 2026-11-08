# hania360-home

## Pictures and big files: Workers Static Assets

Icons, link-preview pictures (`/og/<app>.jpg` on hania360.com) and big fixed scripts (the Hebrew calendar) are not inside the Worker any more: they are files under `public/_a/<host>/<path>`, served by the Worker at the same addresses (see "Static files" at the top of `route` in `worker.js`). This keeps the Worker far under Cloudflare's size limit.

- Each app's `build.py` ends by running `node tools/assets.mjs <app>`, which moves that app's `IMAGES` and any `FILES` entry over 15 KB from `page.js` to `public/_a/<host>/`.
- A new picture for an app: put it in the app's `IMAGES` as before and run its `build.py`; or drop the file straight into `public/_a/<host>/`.
- A new link-preview picture: `public/_a/hania360.com/og/<app>.jpg` (1200×630).
