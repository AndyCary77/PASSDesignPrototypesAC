# PASSforcare app icon — iOS handoff

Two folders, each a drop-in Xcode Asset Catalog icon set. **Original** is the confirmed direction; **Light** is included for reference/comparison, same as on the review page. No badge variants, no build-flavour set — just the base icon for each mark.

## How to install

1. Pick one folder (`original/` — confirmed, or `light/` — reference).
2. Copy its `AppIcon.appiconset` folder into `Assets.xcassets/` in the Xcode project, replacing the existing one.
3. Xcode reads `Contents.json` automatically — no further wiring needed. Build and check the Home Screen, Settings, and Spotlight to confirm it picked up.
4. For the App Store listing, upload `AppIcon-1024.png` (the same file used in the asset catalog) as the Marketing icon in App Store Connect. It's flat, square, 1024×1024, no alpha channel, no corner rounding — Apple applies its own mask on the product page.

## What's in each set

- **`original/`** — one image (`AppIcon-1024.png`), used for both Light and Dark system appearance. The purple ground already reads fine on a dark Home Screen, so no separate dark image was needed.
- **`light/`** — two images: `AppIcon-1024.png` (default) and `AppIcon-Dark-1024.png` (a proposed dark variant — lighter tick on a dark-ink ground, so it doesn't sit as a stark white square among dark tiles at night). Wired via the `appearances` entry in `Contents.json`.
- Neither set includes a Tinted-appearance image — confirmed as out of scope, not something this app is designing for. If a user manually selects Tinted mode, iOS falls back to auto-generating it from the Light image.

## Notes

- Artwork is rasterised directly from the same approved vertex paths used throughout the review page and the Android handoff — no redrawing in this conversion step.
- No alpha channel in any PNG; no baked corner radius or shadow — iOS applies its own continuous-corner mask and (on the App Store listing) its own shadow.
- If the project still has old per-size icon images (the pre-Xcode-14 multi-size icon set), they can be deleted once this single-size set is confirmed working — Xcode and App Store Connect generate every smaller size from the 1024×1024 source.
