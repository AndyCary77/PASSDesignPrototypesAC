/*!
 * <plan-teaser> — "Suggested plan" animated teaser (3.1 s)
 * Zero dependencies. Drop this file on a page and use <plan-teaser></plan-teaser>.
 *
 * Attributes
 *   autoplay          play once when it first scrolls into view (default: on; set autoplay="false" to disable)
 *   replay-on-hover   replay from the start on mouseenter (default: on; set replay-on-hover="false" to disable)
 *   no-font-load      don't inject the Google Fonts <link> for Barlow (load it yourself)
 *
 * Methods:  el.play()   el.seek(seconds)
 * Events:   "teaser-end" fires when a play-through finishes.
 *
 * Respects prefers-reduced-motion: shows the finished frame, no motion.
 */
(function () {
  if (customElements.get('plan-teaser')) return;

  /* ---------- timing helpers ---------- */
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eob = (x, s = 1.4) => { const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

  /* ---------- timeline (seconds) ---------- */
  const W = 1545, H = 546;
  const AV_T = [0.45, 0.59, 0.73, 0.87];
  const CUR_A = 1.38, CUR_B = 2.24, CLICK = 2.42, END = 3.1;

  /* ---------- assets (avatars: Unsplash licence, see README) ---------- */
  const AVATARS = ['data:image/webp;base64,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', 'data:image/webp;base64,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', 'data:image/webp;base64,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', 'data:image/webp;base64,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'];
  const STAR = 'M50 0 C55 36 64 45 100 50 C64 55 55 64 50 100 C45 64 36 55 0 50 C36 45 45 36 50 0Z';
  const star = (fill) => '<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block"><path d="' + STAR + '" fill="' + fill + '"/></svg>';
  const ICON = '<svg viewBox="0 0 1201 1201" style="width:100%;height:100%;display:block"><path fill="#361843" d="M583.3 0.3L616 0L631.7 3.3L657.7 14.3L679.2 30.8L696.7 53.3L785.9 205.9L533.8 458.8L530.1 459.9L363.1 292.1L504.3 53.3L513.8 39.8L529.8 23.8L543.3 14.3L560.3 6.3L583.3 0.3ZM1004.4 422.4L1010.7 423.3L1147.7 504.3L1161.2 513.8L1177.2 529.8L1186.7 543.3L1193.7 557.3L1200.9 584.1L1200.9 616.9L1192.7 645.7L1183.7 662.7L1171.2 678.2L1147.7 696.7L864.4 864.4L690.7 1156.7L678.8 1170.8L662.7 1183.7L643.7 1193.7L622.9 1199.9L585 1201L557.3 1193.7L537.8 1183.2L522.8 1171.2L513.8 1161.2L501.3 1142.7L336.6 864.4L44.3 690.7L30.3 678.8L17.3 662.7L7.3 643.7L1.1 622.9L0 615L1.1 578.1L8.3 555.3L20.3 534.3L30.8 521.8L44.3 510.3L102.3 475.3L109.6 473.4L461.8 825.2L479.3 837.7L501.1 846.9L520 851L548.9 849.9L572.7 842.7L586.7 835.7L604.2 822.2L1004.4 422.4Z"/><path fill="#9966E3" d="M971.3 35.3L995.9 36.1L1008.7 40.3L1021.2 47.8L1161.2 187.8L1169.7 202.3L1173.9 216.1L1174.9 231.9L1169.7 253.7L1164.7 263.7L1156.8 273.8L606.8 823.8L588.7 837.7L572.7 845.7L544.9 852.9L517.1 852.9L487.3 844.7L472.3 836.7L459.8 827.2L101.3 468.8L91.3 452.7L86.1 432.9L86.1 420.1L90.3 402.3L99.8 385.8L238.8 246.8L262.1 235.1L284 233L303.7 237.3L320.2 246.8L531.7 456.6L936.3 52.3L956.3 39.3L971.3 35.3ZM643.1 482.1L634.3 484.3L618.8 493.8L604.3 511.3L595.3 530.3L591.1 546.1L589 577L592.1 597.9L596.3 611.7L609.8 636.2L620.8 647.2L633.3 654.7L641.1 656.9L655 657L668.7 651.7L678.2 645.2L693.7 625.7L699.7 612.7L705.9 589.9L707 558L700.7 529.3L686.2 502.8L675.2 491.8L661.7 484.3L652.9 482.1L643.1 482.1ZM409.1 546.1L403.3 547.3L394.3 552.3L384.3 563.3L378.3 575.3L375.1 587.1L374 609L379.3 630.7L388.8 646.2L402.3 655.7L416 657L428.2 651.2L439.7 637.7L446.9 618.9L449 600L445.7 580.3L436.2 560.8L426.7 551.3L417.9 547.1L409.1 546.1Z"/><path fill="#E7CCF5" d="M641.3 481.3L653 481L662.7 483.3L676.2 490.8L687.2 501.8L701.7 528.3L708 557L706.9 590.9L700.7 613.7L695 626L679.2 646.2L669.7 652.7L656 658L641 658L632.3 655.7L619.8 648.2L608.8 637.2L595.3 612.7L591.1 598.9L588 578L590.1 545.1L599.4 517.4L607.8 503.8L617.8 492.8L633.3 483.3L641.3 481.3ZM407.3 545.3L419.7 546.3L432.2 553.8L437.2 559.8L446.7 579.3L450 599L447.9 619.9L440.7 638.7L429.2 652.2L417 658L401.3 656.7L387.8 647.2L378.3 631.7L373 610L374.1 586.1L377.3 574.3L383.3 562.3L393.3 551.3L407.3 545.3Z"/></svg>';

  const CSS = `
:host { display:block; position:relative; overflow:hidden; aspect-ratio:515/182; width:100%; max-width:100%; background:#F7F5FB; contain:content; }
.stage { position:absolute; left:0; top:0; width:${W}px; height:${H}px; transform-origin:0 0;
  --ground:#F7F5FB; --main:#4A2685; --second:#2A1838; --accent:#9966E3;
  color:var(--second); font-family:'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif; }
.ground { position:absolute; inset:0; background:var(--ground); overflow:hidden }
.words { display:flex; flex-direction:column; gap:8px } .words > * { margin:0 }
.sp-panel { position:absolute; left:110px; top:64px; width:1500px; height:560px; border:2px solid color-mix(in srgb, var(--accent) 16%, var(--ground)); border-radius:40px; background:color-mix(in srgb, var(--ground) 55%, #fff) }
.sp-faint { color:color-mix(in srgb, var(--second) 30%, var(--ground)); font-size:26px; font-weight:500 }
.sp-card { position:absolute; background:#fff; border-radius:34px; border:2px solid color-mix(in srgb, var(--accent) 28%, #fff); box-shadow:0 30px 60px rgba(42,24,56,.14), 0 6px 14px rgba(42,24,56,.07); padding:30px 42px; box-sizing:border-box }
.sp-title { font-size:48px; font-weight:700; letter-spacing:-.01em; line-height:1 }
.sp-chip { background:#D9F3D6; color:#2F7D34; font-weight:600; font-size:26px; padding:10px 24px; border-radius:999px; white-space:nowrap }
.sp-big { font-size:54px; font-weight:700; line-height:1 }
.sp-muted { font-size:25px; color:color-mix(in srgb, var(--second) 48%, #fff) }
.sp-label { font-size:20px; letter-spacing:.16em; font-weight:600; text-transform:uppercase; color:color-mix(in srgb, var(--second) 48%, #fff) }
.sp-plus { width:36px; height:36px; border-radius:9px; background:#D9F3D6; color:#2F7D34; display:grid; place-items:center; font-weight:700; font-size:26px; flex:none }
.sp-item { display:flex; align-items:center; gap:18px; font-size:28px; font-weight:500 }
.sp-btn { height:66px; padding:0 36px; border-radius:16px; font-size:28px; font-weight:700; display:flex; align-items:center; box-sizing:border-box }
.sp-edit { border:2px solid color-mix(in srgb, var(--second) 14%, #fff); background:#fff }
.sp-accept { background:var(--main); color:#fff }
.sp-av { width:96px; height:96px; border-radius:50%; border:4px solid #fff; object-fit:cover; box-shadow:0 4px 12px rgba(42,24,56,.18); display:block }
.w { display:inline-block; white-space:pre }
`;

  function markup() {
    let avs = '';
    AVATARS.forEach((src, i) => {
      avs += '<img class="sp-av av" alt="" draggable="false" src="' + src + '" style="' + (i ? 'margin-left:-24px;' : '') + 'position:relative;z-index:' + (4 - i) + '">';
    });
    return '<div class="stage" part="stage"><div class="ground">' +
      '<div class="sp-panel"></div>' +
      '<div class="sp-faint" style="position:absolute;left:1360px;top:236px">10:00</div>' +
      '<div style="position:absolute;left:1210px;top:280px;width:400px;height:2px;background:color-mix(in srgb, var(--accent) 14%, var(--ground))"></div>' +
      '<div class="care" style="position:absolute;left:1262px;top:388px;width:360px;padding:18px 24px;border-radius:14px;background:#FDF1E7;border:2px solid #F2D5BF;box-sizing:border-box"><div style="font-size:28px;font-weight:600;color:#7A4E3A">Personal care</div><div style="font-size:24px;color:#B98A72;margin-top:4px">No carer assigned</div></div>' +
      '<div class="s1" style="position:absolute;left:96px;top:26px;width:128px;height:128px">' + star('var(--accent)') + '</div>' +
      '<div class="s2" style="position:absolute;left:58px;top:6px;width:48px;height:48px">' + star('color-mix(in srgb, var(--accent) 40%, #fff)') + '</div>' +
      '<div class="sp-card card" style="left:200px;top:44px;width:1000px">' +
        '<div style="display:flex;align-items:center;gap:18px;padding-bottom:22px;border-bottom:2px solid color-mix(in srgb, var(--accent) 14%, #fff)">' +
          '<div class="mini" style="width:42px;height:42px">' + star('var(--accent)') + '</div>' +
          '<div class="sp-title">Suggested plan</div>' +
          '<div class="sp-chip chip" style="margin-left:auto">8/8 covered</div></div>' +
        '<div style="display:flex;gap:48px;margin-top:26px">' +
          '<div style="width:360px"><div style="display:flex">' + avs + '</div>' +
            '<div class="words" style="margin-top:18px"><div class="sp-big n">4 carers</div><div class="sp-muted travel">17 min extra travel in total</div></div></div>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:18px;padding-top:4px">' +
            '<div class="sp-label label">Strengths</div>' +
            '<div class="sp-item it"><span class="sp-plus">+</span><span>Visits on route for each carer</span></div>' +
            '<div class="sp-item it"><span class="sp-plus">+</span><span>Every visit with a familiar carer</span></div></div></div>' +
        '<div style="display:flex;gap:18px;margin-top:28px"><div class="sp-btn sp-edit">Edit</div><div class="sp-btn sp-accept accept">Accept plan</div></div>' +
      '</div>' +
      '<div class="icon" style="position:absolute;left:1086px;top:-6px;width:206px;height:206px">' + ICON + '</div>' +
      '<div class="ring" style="position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:5px solid var(--accent);box-sizing:border-box;opacity:0"></div>' +
      '<div class="cur" style="position:absolute;left:0;top:0;width:104px;height:104px;transform-origin:6px 6px;filter:drop-shadow(0 8px 12px rgba(42,24,56,.28));opacity:0"><svg viewBox="0 0 100 100" style="width:100%;height:100%;overflow:visible"><path d="M6 6 L94 40 L56 54 L40 94 Z" fill="var(--main)" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg></div>' +
    '</div></div>';
  }

  function ensureFont() {
    if (document.querySelector('link[data-plan-teaser-font]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap';
    l.setAttribute('data-plan-teaser-font', '');
    document.head.appendChild(l);
  }

  class PlanTeaser extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + CSS + '</style>' + markup();
      const q = (s) => root.querySelector(s);
      const qa = (s) => [...root.querySelectorAll(s)];
      this._e = {
        stage: q('.stage'), card: q('.card'), mini: q('.mini'), avs: qa('.av'), n: q('.n'), travel: q('.travel'),
        label: q('.label'), items: qa('.it'), chip: q('.chip'), accept: q('.accept'), cur: q('.cur'),
        ring: q('.ring'), icon: q('.icon'), s1: q('.s1'), s2: q('.s2'), care: q('.care'),
      };
      this._e.card.style.transformOrigin = '50% 60%';
      // split "4 carers" into word spans for the word-by-word entrance
      const n = this._e.n; const words = n.textContent.split(' ');
      n.textContent = '';
      this._words = words.map((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + (i < words.length - 1 ? ' ' : ''); n.appendChild(s); return s; });
      this._raf = 0; this._played = false; this._target = null;
      this._onEnter = () => { if (this._flag('replay-on-hover')) this.play(); };
    }

    _flag(name) { const v = this.getAttribute(name); return v === null ? true : v !== 'false'; }
    get reducedMotion() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }

    connectedCallback() {
      if (!this.hasAttribute('no-font-load')) ensureFont();
      this._ro = new ResizeObserver(() => this._fit());
      this._ro.observe(this);
      this._fit();
      this.addEventListener('mouseenter', this._onEnter);
      this.seek(this.reducedMotion ? END : 0);
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      fontsReady.then(() => {
        this._target = null; // re-measure with real font metrics
        if (this.reducedMotion) { this.seek(END); return; }
        if (!this._flag('autoplay')) return;
        this._io = new IntersectionObserver((ents) => {
          if (ents.some((e) => e.isIntersecting) && !this._played) { this._played = true; this.play(); this._io.disconnect(); }
        }, { threshold: 0.4 });
        this._io.observe(this);
      });
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._ro && this._ro.disconnect();
      this._io && this._io.disconnect();
      this.removeEventListener('mouseenter', this._onEnter);
    }

    _fit() {
      const w = this.clientWidth || 515;
      this._scale = w / W;
      this._e.stage.style.transform = 'scale(' + this._scale + ')';
    }

    _measure() {
      // where the cursor should land: centre-right of the Accept button, in stage pixels
      const e = this._e;
      const prev = e.card.style.transform;
      e.card.style.transform = 'rotate(-2.5deg)';
      const sr = e.stage.getBoundingClientRect(), r = e.accept.getBoundingClientRect();
      const k = sr.width / W || 1;
      this._target = { x: (r.left - sr.left + r.width * 0.6) / k, y: (r.top - sr.top + r.height * 0.55) / k };
      e.card.style.transform = prev;
      e.ring.style.left = this._target.x + 'px'; e.ring.style.top = this._target.y + 'px';
    }

    play() {
      if (this.reducedMotion) { this.seek(END); return; }
      cancelAnimationFrame(this._raf);
      const t0 = performance.now();
      const tick = (now) => {
        const t = (now - t0) / 1000;
        this.seek(Math.min(t, END));
        if (t < END) this._raf = requestAnimationFrame(tick);
        else this.dispatchEvent(new CustomEvent('teaser-end'));
      };
      this._raf = requestAnimationFrame(tick);
    }

    get duration() { return END; }

    seek(t) {
      if (!this._target) this._measure();
      const e = this._e, tg = this._target;
      const pin = seg(t, -0.35, 0.45);
      const creep = lerp(1, 1.012, eio(seg(t, 0.45, END)));
      const press = seg(t, CLICK, CLICK + 0.1) * (1 - seg(t, CLICK + 0.14, CLICK + 0.34));

      e.card.style.opacity = clamp01(seg(t, -0.35, 0.05));
      e.card.style.transform = 'translateY(' + lerp(46, 0, eo(pin)) + 'px) rotate(' + lerp(-7, -2.5, eo(pin)) + 'deg) scale(' + (lerp(0.93, 1, eob(pin, 1.5)) * creep) + ')';
      e.mini.style.transform = 'rotate(' + lerp(-90, 0, eo(seg(t, 0, 0.6))) + 'deg) scale(' + eob(seg(t, -0.1, 0.5), 1.8) + ')';

      e.avs.forEach((el, i) => {
        const p = seg(t, AV_T[i], AV_T[i] + 0.36);
        el.style.opacity = clamp01(seg(t, AV_T[i], AV_T[i] + 0.1));
        el.style.transform = 'translateY(' + lerp(18, 0, eo(p)) + 'px) scale(' + Math.max(0, lerp(0.2, 1, eob(p, 1.8))) + ')';
      });

      this._words.forEach((w, i) => {
        const p = eo(seg(t, 0.88 + i * 0.09, 0.88 + i * 0.09 + 0.4));
        w.style.opacity = p; w.style.transform = 'translateX(' + lerp(24, 0, p) + 'px)';
      });
      const rowIn = (el, a) => { const p = eo(seg(t, a, a + 0.4)); el.style.opacity = p; el.style.transform = 'translateX(' + lerp(26, 0, p) + 'px)'; };
      rowIn(e.travel, 1.06); rowIn(e.label, 1.08); rowIn(e.items[0], 1.2); rowIn(e.items[1], 1.34);

      e.chip.style.opacity = clamp01(seg(t, 1.46, 1.56));
      e.chip.style.transform = 'scale(' + Math.max(0, lerp(0.4, 1, eob(seg(t, 1.46, 1.82), 1.9))) + ')';

      const hv = eo(seg(t, CUR_B - 0.12, CUR_B + 0.1));
      e.accept.style.transform = 'scale(' + (lerp(1, 1.02, hv) * lerp(1, 0.94, press)) + ')';
      e.accept.style.background = 'color-mix(in srgb, var(--main) ' + Math.round(100 - hv * 8 - press * 14) + '%, var(--second))';

      const pm = eio(seg(t, CUR_A, CUR_B)), x0 = 1600, y0 = 640;
      const cx = lerp(x0, tg.x, pm) + Math.sin(pm * Math.PI) * 50;
      const cy = lerp(y0, tg.y, pm) - Math.sin(pm * Math.PI) * 36;
      e.cur.style.opacity = clamp01(seg(t, CUR_A, CUR_A + 0.15));
      e.cur.style.transform = 'translate(' + (cx - 6) + 'px,' + (cy - 6) + 'px) scale(' + lerp(1, 0.86, press) + ')';

      const pr = seg(t, CLICK, CLICK + 0.5);
      e.ring.style.opacity = pr > 0 && pr < 1 ? 1 - eo(pr) : 0;
      e.ring.style.transform = 'scale(' + lerp(0.3, 1.5, eo(pr)) + ')';

      const pi = seg(t, -0.25, 0.4), hop = seg(t, CLICK + 0.06, CLICK + 0.6);
      const lift = Math.sin(hop * Math.PI) * (1 - hop * 0.3);
      e.icon.style.opacity = clamp01(seg(t, -0.25, -0.05));
      e.icon.style.transform = 'translateY(' + (-22 * lift) + 'px) rotate(' + (lerp(-30, 0, eo(pi)) + 10 * lift + 2 * Math.sin(t * 2.2)) + 'deg) scale(' + (Math.max(0, eob(pi, 1.8)) * (1 + 0.08 * lift)) + ')';
      e.s1.style.transform = 'rotate(' + (t * 14) + 'deg) scale(' + (Math.max(0, eob(seg(t, -0.2, 0.35), 1.8)) * (1 + 0.04 * Math.sin(t * 3.4))) + ')';
      e.s2.style.transform = 'scale(' + Math.max(0, eob(seg(t, 0.1, 0.5), 1.8)) * (1 + 0.08 * lift) + ')';
      e.care.style.transform = 'translateX(' + lerp(0, -8, eio(seg(t, 0, END))) + 'px)';
    }
  }

  customElements.define('plan-teaser', PlanTeaser);
})();
