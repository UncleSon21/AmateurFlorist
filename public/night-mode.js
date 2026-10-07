/* ═══════════════════════════════════════════════════════════════
   night-mode.js — Amateur Florist
   Slim night-theme controller. Adds:
     · Moonlit Garden dark palette (overrides seasonal CSS vars when active)
     · Firefly particle system (anchored to the page, behind content)
     · Tiny floating toggle pill: Auto · Day | Auto · Night | Day | Night
     · Auto-by-clock (6pm–6am) by default, manual override persists in localStorage
   Coexists with seasonalTheme.ts: when night is off, seasonal colors take over.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CFG = {
    nightStartHour: 18,   // 6pm
    nightEndHour:   6,    // 6am
    firefliesAnchor: 'page',  // 'page': scroll away with the content | 'screen': stay put on screen
    firefliesMin: 6,          // per screenful = screen area / firefliesAreaPer, clamped:
    firefliesMax: 36,         //   ~8 on a phone, 32 on a 1440x900 laptop
    firefliesAreaPer: 40000,
    firefliesTotalMax: 200,   // page mode: cap across the whole page
    firefliesPulse: 1,
    firefliesPalette: ['#fff2a8', '#ffd864', '#c8e87a', '#9ad4ff'],
  };

  const NIGHT_VARS = {
    '--accent':       '#d4a857',
    '--accent-dark':  '#050811',
    '--accent-light': '#8a9bb8',
    '--bg':           '#0a0e1a',
    '--bg-alt':       '#131829',
    '--text':         '#e8e3d8',
    '--text-muted':   '#8a8578',
    '--border':       'rgba(212,168,87,.16)',
  };
  const VAR_KEYS = Object.keys(NIGHT_VARS);

  // Day-palette restoration. Must mirror seasonalTheme.ts SEASON_VARS + the
  // pre-paint head-script. When toggling back to day we re-compute the
  // current season's palette rather than snapshot/restore (head-script may
  // have already written night vars by the time we'd snapshot).
  const SEASON_VARS_DAY = {
    spring: ['#5a1a2a','#2a0d15','#a8606e','#fdf8f9','#f5eff2'],
    summer: ['#6b8870','#1e2a22','#a8c0aa','#f8faf8','#eef3ee'],
    autumn: ['#a85738','#3a1c12','#d8a48a','#faf8f4','#f5f0e8'],
    winter: ['#1c3656','#0e1d30','#7a96b8','#f6f8fa','#eaf0f5'],
  };
  // Vars that have day equivalents (5 seasonal). The other 3 (text/text-muted
  // /border) live only in inline :root defaults; we removeProperty so those reign.
  const SEASONAL_VAR_KEYS = ['--accent','--accent-dark','--accent-light','--bg','--bg-alt'];
  const NIGHT_ONLY_VARS   = ['--text','--text-muted','--border'];

  function currentDaySeason() {
    const u = new URLSearchParams(location.search).get('season');
    const ok = ['spring','summer','autumn','winter'];
    if (ok.indexOf(u) >= 0) return u;
    const m = new Date().getMonth() + 1;
    if (m >= 9 && m <= 11) return 'spring';
    if (m === 12 || m <= 2) return 'summer';
    if (m >= 3 && m <= 5)   return 'autumn';
    return 'winter';
  }

  // ── State ────────────────────────────────────────────────────────────
  // mode: 'auto' (clock-based) | 'day' | 'night'
  let _mode = 'auto';

  function loadMode() {
    try {
      const m = localStorage.getItem('night-mode');
      if (m === 'auto' || m === 'day' || m === 'night') _mode = m;
    } catch (e) {}
  }

  function saveMode() {
    try { localStorage.setItem('night-mode', _mode); } catch (e) {}
  }

  function isNightHour(date) {
    const h = (date || new Date()).getHours();
    const { nightStartHour: s, nightEndHour: e } = CFG;
    return s < e ? (h >= s && h < e) : (h >= s || h < e);
  }

  function shouldBeNight() {
    if (_mode === 'night') return true;
    if (_mode === 'day')   return false;
    return isNightHour();
  }

  // ── Apply / remove night palette ─────────────────────────────────────
  function applyNight() {
    const r = document.documentElement;
    VAR_KEYS.forEach(k => r.style.setProperty(k, NIGHT_VARS[k]));
    r.dataset.theme = 'night';
    startFireflies();
  }

  function removeNight() {
    const r = document.documentElement;
    // Re-apply the current season's day palette (5 vars)
    const dayPalette = SEASON_VARS_DAY[currentDaySeason()];
    SEASONAL_VAR_KEYS.forEach((k, i) => r.style.setProperty(k, dayPalette[i]));
    // Drop the night-only vars so the inline :root defaults take over
    NIGHT_ONLY_VARS.forEach(k => r.style.removeProperty(k));
    delete r.dataset.theme;
    stopFireflies();
  }

  function syncTheme() {
    if (shouldBeNight()) applyNight();
    else                 removeNight();
    updateToggleUI();
  }

  // ── Firefly system ───────────────────────────────────────────────────
  // CFG.firefliesAnchor:
  //   'page'   — each firefly has a spot on the page and scrolls away with the
  //              content, like everything else on it (the owner's choice).
  //              Only a band ~3 screens tall around the viewport is drawn, on an
  //              absolutely positioned canvas the browser scrolls natively (no
  //              jitter); the band is moved along every screen or so.
  //   'screen' — a viewport-fixed canvas; fireflies stay put on screen while the
  //              page scrolls underneath them.
  // Either way the canvas stays small. A page-tall canvas (15,000+ px) with 90
  // fireflies and a fresh gradient per firefly per frame used to stall phones.
  // Count scales with screen area; glows are pre-rendered sprites; phones draw
  // at ~30fps with a lower pixel ratio.
  let _animId = null;
  let _canvas = null;
  let _fireflies = [];
  let _resizeHandler = null;
  let _scrollHandler = null;
  let _resizeObserver = null;
  const _sprites = {};
  const SPRITE_R = 28;   // largest halo radius in CSS px

  function rand(a, b) { return a + Math.random() * (b - a); }

  // Fireflies per screenful (about 8 on a phone, at most firefliesMax).
  function fireflyCount() {
    const perArea = (window.innerWidth * window.innerHeight) / CFG.firefliesAreaPer;
    return Math.round(Math.min(CFG.firefliesMax, Math.max(CFG.firefliesMin, perArea)));
  }

  function makeFirefly(w, h) {
    const palette = CFG.firefliesPalette;
    return {
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.32, 0.32),
      vy: rand(-0.24, 0.24),
      halo: rand(14, SPRITE_R),
      hue:  palette[Math.floor(Math.random() * palette.length)],
      phase:  rand(0, Math.PI * 2),
      speed:  rand(0.012, 0.028) * CFG.firefliesPulse,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.008, 0.018),
      flashAt: rand(0, 1500),
      flashCount: 0,
      alpha: 0.5,
    };
  }

  function hexA(hex, a) {
    if (hex[0] !== '#') return hex;
    const v = hex.length === 4
      ? hex.slice(1).split('').map(c => parseInt(c + c, 16))
      : [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
  }

  // Glow + white core for one colour, drawn once at 2x and reused every frame.
  function sprite(hex) {
    if (_sprites[hex]) return _sprites[hex];
    const r = SPRITE_R * 2, c = document.createElement('canvas');
    c.width = c.height = r * 2;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0,    hexA(hex, 0.9));
    grad.addColorStop(0.35, hexA(hex, 0.28));
    grad.addColorStop(1,    hexA(hex, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, r * 2, r * 2);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(r, r, r * 0.09, 0, Math.PI * 2);
    g.fill();
    return (_sprites[hex] = c);
  }

  // Bottom of the page content. The body's own box, not scrollHeight: the
  // absolutely positioned canvas counts towards scrollHeight, so it would hold
  // the page tall after it shrinks (e.g. a shop filter).
  function contentHeight() {
    return Math.ceil(document.body.getBoundingClientRect().bottom + window.scrollY);
  }

  function startFireflies() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (_animId) return;

    let canvas = document.getElementById('fireflies-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'fireflies-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
    }
    canvas.style.opacity = '';   // stopFireflies() set 0; without this a second start stayed invisible
    _canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pageMode = CFG.firefliesAnchor === 'page';
    canvas.style.position = pageMode ? 'absolute' : 'fixed';
    canvas.style.willChange = pageMode ? 'transform' : '';

    let small = false, dpr = 1, vw = 0, vh = 0;
    let areaH = 0;            // height fireflies live in: the page, or one screen
    let bandTop = 0, bandH = 0, count = 0;

    // Page mode: keep the drawn band around the viewport. Returns true if it moved.
    function placeBand(force) {
      if (!pageMode) return false;
      const y = window.scrollY;
      const nearTop = bandTop > 0 && y < bandTop + vh * 0.5;
      const nearBottom = bandTop + bandH < areaH && y + vh > bandTop + bandH - vh * 0.5;
      if (!force && !nearTop && !nearBottom) return false;
      bandTop = Math.max(0, Math.min(areaH - bandH, y - vh));
      canvas.style.transform = `translateY(${bandTop}px)`;
      return true;
    }

    function layout() {
      small = window.innerWidth <= 768;
      // The page-mode canvas is three screens tall; soft glows don't need 2x.
      dpr = Math.min(window.devicePixelRatio || 1, small || pageMode ? 1.5 : 2);
      // clientWidth leaves out the scrollbar; innerWidth would make the
      // absolute canvas wider than the page and add a sideways scroll.
      vw = document.documentElement.clientWidth || window.innerWidth;
      // Phones: the URL bar changes innerHeight while scrolling. Only ever grow,
      // so the canvas isn't reallocated on every scroll.
      vh = small ? Math.max(vh, window.innerHeight) : window.innerHeight;
      const prevAreaH = areaH;
      areaH = pageMode ? Math.max(vh, contentHeight()) : vh;
      bandH = pageMode ? Math.min(areaH, vh * 3) : vh;
      count = Math.min(CFG.firefliesTotalMax, Math.round(fireflyCount() * (areaH / vh)));
      const pw = Math.floor(vw * dpr), ph = Math.floor(bandH * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        canvas.style.width  = vw + 'px';
        canvas.style.height = bandH + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      while (_fireflies.length < count) {
        const f = makeFirefly(vw, areaH);
        // Page grew (images, products loading): fill the new part, not the old.
        if (prevAreaH && areaH > prevAreaH) f.y = rand(prevAreaH, areaH);
        _fireflies.push(f);
      }
      if (_fireflies.length > count) _fireflies.length = count;
      placeBand(true);
    }

    function draw() {
      ctx.clearRect(0, 0, vw, bandH);
      for (let i = 0; i < _fireflies.length; i++) {
        const f = _fireflies[i];
        const y = f.y - bandTop;
        if (y < -f.halo || y > bandH + f.halo) continue;   // outside the drawn band
        ctx.globalAlpha = f.alpha;
        ctx.drawImage(sprite(f.hue), f.x - f.halo, y - f.halo, f.halo * 2, f.halo * 2);
      }
      ctx.globalAlpha = 1;
    }

    let queued = false;
    const relayout = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; layout(); draw(); });
    };
    _resizeHandler = relayout;
    window.addEventListener('resize', _resizeHandler, { passive: true });
    if (pageMode) {
      // Redraw at once when the band moves, so it never shows old frames in the new spot.
      _scrollHandler = () => { if (placeBand(false)) draw(); };
      window.addEventListener('scroll', _scrollHandler, { passive: true });
      if (window.ResizeObserver) {   // page height changes as images and products load
        _resizeObserver = new ResizeObserver(relayout);
        _resizeObserver.observe(document.body);
      }
    }

    _fireflies = [];
    layout();

    let tick = 0, prev = performance.now(), lastDraw = 0;
    function frame(now) {
      _animId = requestAnimationFrame(frame);
      if (small && now - lastDraw < 32) return;         // ~30fps on phones
      lastDraw = now;
      const dt = Math.min(3, (now - prev) / 16.67);    // 1 = one 60fps frame
      prev = now;
      tick += dt;

      const w = vw, h = areaH;
      for (let i = 0; i < _fireflies.length; i++) {
        const f = _fireflies[i];
        f.phase  += f.speed * dt;
        f.wobble += f.wobbleSpeed * dt;
        f.x += (f.vx + Math.sin(f.wobble) * 0.6) * dt;
        f.y += (f.vy + Math.cos(f.wobble * 1.3) * 0.4) * dt;

        if (f.x < -40) f.x = w + 40;
        if (f.x > w + 40) f.x = -40;
        if (f.y < -40) f.y = h + 40;
        if (f.y > h + 40) f.y = -40;

        let alpha = 0.35 + 0.55 * (Math.sin(f.phase) * 0.5 + 0.5);
        if (tick > f.flashAt && f.flashCount < 18) {
          alpha = Math.min(1, alpha + (1 - f.flashCount / 18) * 0.8);
          f.flashCount += dt;
        } else if (f.flashCount >= 18) {
          f.flashAt = tick + rand(180, 720);
          f.flashCount = 0;
        }
        f.alpha = alpha;
      }
      draw();
    }
    _animId = requestAnimationFrame(frame);
  }

  function stopFireflies() {
    if (_animId) cancelAnimationFrame(_animId);
    _animId = null;
    if (_resizeHandler) { window.removeEventListener('resize', _resizeHandler); _resizeHandler = null; }
    if (_scrollHandler) { window.removeEventListener('scroll', _scrollHandler); _scrollHandler = null; }
    if (_resizeObserver) { _resizeObserver.disconnect(); _resizeObserver = null; }
    if (_canvas) {
      const ctx = _canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      _canvas.style.opacity = '0';
    }
  }

  // ── Toggle pill ──────────────────────────────────────────────────────
  function injectToggle() {
    if (document.getElementById('night-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'night-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle day/night theme');
    btn.innerHTML = '<span class="nt-dot"></span><span class="nt-label">Auto</span>';
    btn.addEventListener('click', () => {
      _mode = _mode === 'auto' ? 'day' : _mode === 'day' ? 'night' : 'auto';
      saveMode();
      syncTheme();
    });
    document.body.appendChild(btn);
  }

  function updateToggleUI() {
    const btn = document.getElementById('night-toggle');
    if (!btn) return;
    const label = btn.querySelector('.nt-label');
    if (!label) return;
    const night = shouldBeNight();
    label.textContent =
      _mode === 'auto' ? (night ? 'Auto · Night' : 'Auto · Day')
    : _mode === 'night' ? 'Night'
                        : 'Day';
  }

  // ── Auto re-evaluator: check once a minute when on auto ──────────────
  let _ticker = null;
  function startTicker() {
    if (_ticker) clearInterval(_ticker);
    _ticker = setInterval(() => {
      if (_mode === 'auto') syncTheme();
    }, 60 * 1000);
  }

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    loadMode();
    const start = () => {
      injectToggle();
      syncTheme();
      startTicker();
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start);
  }

  // Auto-init
  init();

  // Minimal public API for debugging / tweaks
  window.NightMode = {
    setMode(m) { if (m === 'auto' || m === 'day' || m === 'night') { _mode = m; saveMode(); syncTheme(); } },
    isNight: () => shouldBeNight(),
    config:  CFG,
  };
})();
