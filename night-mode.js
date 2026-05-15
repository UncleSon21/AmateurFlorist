/* ═══════════════════════════════════════════════════════════════
   night-mode.js — Amateur Florist
   Slim night-theme controller. Adds:
     · Moonlit Garden dark palette (overrides seasonal CSS vars when active)
     · Firefly particle system (anchored to document, behind content)
     · Tiny floating toggle pill: Auto · Day | Auto · Night | Day | Night
     · Auto-by-clock (6pm–6am) by default, manual override persists in localStorage
   Coexists with seasonalTheme.ts: when night is off, seasonal colors take over.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CFG = {
    nightStartHour: 18,   // 6pm
    nightEndHour:   6,    // 6am
    firefliesCount: 90,
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

  // Vars we'll override; snapshot original values so we can restore.
  const VAR_KEYS = Object.keys(NIGHT_VARS);
  let _savedVars = null;

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
    if (!_savedVars) {
      _savedVars = {};
      VAR_KEYS.forEach(k => { _savedVars[k] = r.style.getPropertyValue(k); });
    }
    VAR_KEYS.forEach(k => r.style.setProperty(k, NIGHT_VARS[k]));
    r.dataset.theme = 'night';
    startFireflies();
  }

  function removeNight() {
    const r = document.documentElement;
    if (_savedVars) {
      VAR_KEYS.forEach(k => {
        const v = _savedVars[k];
        if (v) r.style.setProperty(k, v);
        else   r.style.removeProperty(k);
      });
    }
    delete r.dataset.theme;
    stopFireflies();
  }

  function syncTheme() {
    if (shouldBeNight()) applyNight();
    else                 removeNight();
    updateToggleUI();
  }

  // ── Firefly system ───────────────────────────────────────────────────
  let _animId = null;
  let _canvas = null;
  let _fireflies = [];
  let _resizeHandler = null;
  let _resizeObserver = null;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeFirefly(w, h) {
    const palette = CFG.firefliesPalette;
    return {
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.32, 0.32),
      vy: rand(-0.24, 0.24),
      size: rand(1.4, 2.6),
      halo: rand(14, 28),
      hue:  palette[Math.floor(Math.random() * palette.length)],
      phase:  rand(0, Math.PI * 2),
      speed:  rand(0.012, 0.028) * CFG.firefliesPulse,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.008, 0.018),
      flashAt: rand(0, 1500),
      flashCount: 0,
    };
  }

  function docHeight() {
    return Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
      window.innerHeight,
    );
  }

  function hexA(hex, a) {
    if (hex[0] !== '#') return hex;
    const v = hex.length === 4
      ? hex.slice(1).split('').map(c => parseInt(c + c, 16))
      : [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
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
    _canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let lastW = 0, lastH = 0;

    function resize() {
      const w = window.innerWidth;
      const h = docHeight();
      if (w === lastW && h === lastH) return;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (h > lastH && _fireflies.length) {
        const newBand = h - lastH;
        const extra = Math.min(8, Math.floor(CFG.firefliesCount * (newBand / h)));
        for (let i = 0; i < extra; i++) {
          const f = makeFirefly(w, h);
          f.y = lastH + Math.random() * newBand;
          _fireflies.push(f);
        }
      }
      lastW = w; lastH = h;
    }
    resize();
    _resizeHandler = resize;
    window.addEventListener('resize', _resizeHandler, { passive: true });
    if (window.ResizeObserver) {
      _resizeObserver = new ResizeObserver(resize);
      _resizeObserver.observe(document.documentElement);
      if (document.body) _resizeObserver.observe(document.body);
    }

    _fireflies = Array.from({ length: CFG.firefliesCount },
      () => makeFirefly(window.innerWidth, docHeight()));

    let tick = 0;
    function frame() {
      const w = window.innerWidth, h = docHeight();
      ctx.clearRect(0, 0, w, h);
      tick++;

      while (_fireflies.length < CFG.firefliesCount) _fireflies.push(makeFirefly(w, h));
      while (_fireflies.length > CFG.firefliesCount) _fireflies.pop();

      for (let i = 0; i < _fireflies.length; i++) {
        const f = _fireflies[i];
        f.phase  += f.speed;
        f.wobble += f.wobbleSpeed;
        f.x += f.vx + Math.sin(f.wobble) * 0.6;
        f.y += f.vy + Math.cos(f.wobble * 1.3) * 0.4;

        if (f.x < -40) f.x = w + 40;
        if (f.x > w + 40) f.x = -40;
        if (f.y < -40) f.y = h + 40;
        if (f.y > h + 40) f.y = -40;

        let alpha = 0.35 + 0.55 * (Math.sin(f.phase) * 0.5 + 0.5);

        if (tick > f.flashAt && f.flashCount < 18) {
          const k = f.flashCount / 18;
          alpha = Math.min(1, alpha + (1 - k) * 0.8);
          f.flashCount++;
        } else if (f.flashCount >= 18) {
          f.flashAt = tick + rand(180, 720);
          f.flashCount = 0;
        }

        // halo
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.halo);
        grad.addColorStop(0,    hexA(f.hue, alpha * 0.9));
        grad.addColorStop(0.35, hexA(f.hue, alpha * 0.28));
        grad.addColorStop(1,    hexA(f.hue, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.halo, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = hexA('#ffffff', alpha);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
      _animId = requestAnimationFrame(frame);
    }
    _animId = requestAnimationFrame(frame);
  }

  function stopFireflies() {
    if (_animId) cancelAnimationFrame(_animId);
    _animId = null;
    if (_resizeHandler) { window.removeEventListener('resize', _resizeHandler); _resizeHandler = null; }
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
