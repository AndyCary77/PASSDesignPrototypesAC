# plan-teaser

The "Suggested plan" teaser (3.1 s) as live HTML/CSS/JS instead of a video. It has no dependencies and is a single file of about 35 KB, with the avatars and icon built in.

## Use

```html
<plan-teaser></plan-teaser>
<script src="plan-teaser.js"></script>
```

- It fills the width of its container and keeps the 515 × 182 ratio. Size the parent, or give the element a width.
- It plays once when it first scrolls into view (`autoplay`) and replays from the start on hover (`replay-on-hover`). Set either one to `"false"` to turn it off.
- `el.play()` replays it, `el.seek(seconds)` shows a single frame, and the `teaser-end` event fires when a play-through finishes.
- If the visitor has reduced motion turned on, it shows the finished frame without animating.
- It loads Barlow from Google Fonts. Add `no-font-load` if you already load Barlow yourself; otherwise it falls back to the system font.
- To use it in React, see `PlanTeaser.jsx`.

Open `index.html` to see it in a sample modal.

## Credits

- The avatar photos come from Unsplash and are free to use under the Unsplash License (https://unsplash.com/license). They are placeholders: before shipping, swap them for your own imagery or check that they meet your guidelines. The `AVATARS` array near the top of `plan-teaser.js` holds them.
- Barlow is under the SIL Open Font License 1.1.
- There is no sound. The score in the Motion version isn't included.
