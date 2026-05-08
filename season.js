/* ═══════════════════════════════════════════════════════
   season.js — Vaniaflorist shared season utility
   Auto-detects Australian season and applies CSS vars.
   Also injects a floating season preview switcher.
   Import with: <script src="season.js"></script>
   ═══════════════════════════════════════════════════════ */

const SEASON_SCHEMES = {
  spring: { season:'spring', label:'Spring (Burgundy)',  accent:'#5a1a2a', accentDark:'#2a0d15', accentLight:'#a8606e', bg:'#fdf8f9', bgAlt:'#f5eff2' },
  summer: { season:'summer', label:'Summer (Sage)',      accent:'#6b8870', accentDark:'#1e2a22', accentLight:'#a8c0aa', bg:'#f8faf8', bgAlt:'#eef3ee' },
  autumn: { season:'autumn', label:'Autumn (Terracotta)',accent:'#a85738', accentDark:'#3a1c12', accentLight:'#d8a48a', bg:'#faf8f4', bgAlt:'#f5f0e8' },
  winter: { season:'winter', label:'Winter (Navy)',      accent:'#1c3656', accentDark:'#0e1d30', accentLight:'#7a96b8', bg:'#f6f8fa', bgAlt:'#eaf0f5' },
};

const SEASON_ICONS = { spring:'🌸', summer:'🌿', autumn:'🍂', winter:'❄️' };

function getAustralianSeason(date) {
  // ─────────────────────────────────────────────────────────
  // CURRENTLY HARDCODED TO WINTER (Frost palette).
  // To re-enable auto-detection by date, comment out the next
  // line and uncomment the date-based logic below.
  // ─────────────────────────────────────────────────────────
  return 'winter';

  // const m = (date || new Date()).getMonth() + 1;
  // if (m >= 9 && m <= 11) return 'spring';
  // if (m === 12 || m <= 2) return 'summer';
  // if (m >= 3  && m <= 5) return 'autumn';
  // return 'winter';
}

function applyScheme(scheme) {
  const r = document.documentElement;
  r.style.setProperty('--accent',       scheme.accent);
  r.style.setProperty('--accent-dark',  scheme.accentDark);
  r.style.setProperty('--accent-light', scheme.accentLight);
  r.style.setProperty('--bg',           scheme.bg);
  r.style.setProperty('--bg-alt',       scheme.bgAlt);
  document.body.dataset.season = scheme.season;
  // Update switcher pill if present
  const pill = document.getElementById('season-switcher-pill');
  if (pill) {
    pill.querySelector('.ss-label').textContent = SEASON_ICONS[scheme.season] + ' ' + scheme.label;
    pill.querySelectorAll('.ss-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.season === scheme.season);
    });
  }
}

/* Inject floating season switcher */
function injectSwitcher(currentSeason) {
  if (document.getElementById('season-switcher-pill')) return;
  const div = document.createElement('div');
  div.id = 'season-switcher-pill';
  div.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:9999;font-family:sans-serif;';
  div.innerHTML = `
    <style>
      #season-switcher-pill { user-select:none; }
      .ss-trigger {
        display:inline-flex;align-items:center;gap:7px;
        background:rgba(28,22,18,.82);backdrop-filter:blur(8px);
        color:#faf8f4;padding:7px 14px;border-radius:20px;
        font-size:11px;letter-spacing:1px;cursor:pointer;border:none;
        transition:background .25s;
      }
      .ss-trigger:hover{background:rgba(28,22,18,.95)}
      .ss-label{font-size:11px;letter-spacing:.5px;}
      .ss-panel {
        display:none;position:absolute;bottom:calc(100% + 8px);left:0;
        background:rgba(28,22,18,.92);backdrop-filter:blur(12px);
        border-radius:12px;padding:10px;
        display:flex;flex-direction:column;gap:4px;min-width:160px;
      }
      .ss-panel.open{display:flex}
      .ss-btn {
        display:flex;align-items:center;gap:8px;
        padding:7px 10px;border-radius:8px;border:none;background:transparent;
        color:rgba(250,248,244,.65);font-size:11px;letter-spacing:.5px;cursor:pointer;
        transition:background .2s,color .2s;text-align:left;
      }
      .ss-btn:hover{background:rgba(255,255,255,.1);color:#faf8f4}
      .ss-btn.active{background:rgba(255,255,255,.15);color:#faf8f4;font-weight:500;}
      .ss-swatch{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    </style>
    <div class="ss-panel" id="ss-panel">
      ${Object.values(SEASON_SCHEMES).map(s => `
        <button class="ss-btn${s.season===currentSeason?' active':''}" data-season="${s.season}">
          <span class="ss-swatch" style="background:${s.accent}"></span>
          ${SEASON_ICONS[s.season]} ${s.label}
        </button>
      `).join('')}
    </div>
    <button class="ss-trigger" id="ss-trigger">
      <span class="ss-label">${SEASON_ICONS[currentSeason]} ${SEASON_SCHEMES[currentSeason].label}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
    </button>
  `;
  document.body.appendChild(div);

  const trigger = div.querySelector('#ss-trigger');
  const panel   = div.querySelector('#ss-panel');
  panel.style.display = 'none';

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'flex';
  });

  div.querySelectorAll('.ss-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = SEASON_SCHEMES[btn.dataset.season];
      applyScheme(s);
      panel.style.display = 'none';
    });
  });

  document.addEventListener('click', () => { panel.style.display = 'none'; });
}

/* Public API */
window.VaniaSeasons = {
  schemes: SEASON_SCHEMES,
  current: function() { return SEASON_SCHEMES[getAustralianSeason()]; },
  init: function(override) {
    const key    = override || getAustralianSeason();
    const scheme = SEASON_SCHEMES[key] || SEASON_SCHEMES.autumn;
    applyScheme(scheme);
    // Inject switcher after DOM ready
    if (document.body) { injectSwitcher(scheme.season); }
    else { document.addEventListener('DOMContentLoaded', () => injectSwitcher(scheme.season)); }
    return scheme;
  },
  apply: applyScheme,
  set: function(key) {
    const scheme = SEASON_SCHEMES[key];
    if (!scheme) return;
    applyScheme(scheme);
    try { localStorage.setItem('vania-season', key); } catch(e) {}
    const badge = document.querySelector('.vania-season-pill .vsp-label');
    if (badge) badge.textContent = scheme.label;
    return scheme;
  },
};
