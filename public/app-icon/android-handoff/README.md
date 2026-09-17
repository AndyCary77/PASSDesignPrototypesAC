# PASSforcare adaptive icon — Android handoff

Two folders, each a drop-in `res/` tree for one mark. No reversed treatment, no build-variant badges — just the base icon for `light` (line-art) and `original` (solid disc).

## How to install

1. Pick one folder (`light/` or `original/`).
2. Copy everything under its `res/` into `app/src/main/res/`, merging with what's already there:
   - `res/drawable/ic_launcher_foreground.xml`
   - `res/drawable/ic_launcher_monochrome.xml`
   - `res/values/ic_launcher_background.xml` — adds one colour resource, `ic_launcher_background`. If a `res/values/colors.xml` already defines that name, resolve the clash rather than shipping both files.
   - `res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` — replace whatever's there now.
3. Confirm `AndroidManifest.xml`'s `<application>` tag points at `@mipmap/ic_launcher` (and `android:roundIcon="@mipmap/ic_launcher_round"` if that attribute is already in use).
4. Delete the old legacy PNG mipmap sets (`mipmap-mdpi` … `mipmap-xxxhdpi`) once this is in and building — minSdk 31 means every device reads the adaptive icon, per the brief.
5. `ic_launcher-web.png` (512×512, no alpha) is the Play Store listing asset. It is **not** an app resource — don't put it under `res/`. Upload it directly in Play Console for the production listing.

## Notes

- `mipmap-anydpi-v26` requires API 26+; project minSdk is 31, so that's covered.
- The `<monochrome>` layer only renders when a user turns on Android 13+ themed icons — it's safe to ship as-is on lower API levels, the system just ignores it.
- Vector paths were converted directly from the approved SVGs (same coordinates, `fill-rule="evenodd"` → `android:fillType="evenOdd"`) — no redrawing in this conversion step.
- `original`'s background colour (`#6C1B98`) and `light`'s (`#FFFFFF`) are different by design — each mark's colour treatment is baked into its own `ic_launcher_background.xml`, so don't copy one mark's background file over the other's.
