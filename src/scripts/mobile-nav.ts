// Injects a hamburger button + slide-in drawer for screens <= 768px.
// Desktop is untouched: the hamburger and drawer are display:none above the breakpoint.

const STYLE_ID = "vf-mobile-nav-styles";
const DRAWER_ID = "vf-mobile-drawer";
const HAMBURGER_ID = "vf-mobile-hamburger";
const BODY_OPEN_CLASS = "vf-drawer-open";

const CSS = `
  #${HAMBURGER_ID} { display: none; }
  #${DRAWER_ID} { display: none; }

  @media (max-width: 768px) {
    #${HAMBURGER_ID} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: var(--text-muted, #8a7d6e);
      padding: 10px;
      margin-left: -10px;
      cursor: pointer;
      transition: color .2s;
    }
    #${HAMBURGER_ID}:hover,
    #${HAMBURGER_ID}:focus-visible { color: var(--text, #2c2420); outline: none; }
    #${HAMBURGER_ID} svg { width: 22px; height: 22px; }

    #${DRAWER_ID} {
      display: block;
      position: fixed; inset: 0;
      z-index: 9500;
      pointer-events: none;
    }
    #${DRAWER_ID} .vf-drawer-backdrop {
      position: absolute; inset: 0;
      background: rgba(28, 22, 18, 0.45);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      opacity: 0;
      transition: opacity .3s ease;
    }
    #${DRAWER_ID} .vf-drawer-panel {
      position: absolute; top: 0; right: 0; bottom: 0;
      width: min(82vw, 340px);
      background: var(--bg, #faf8f4);
      border-left: .5px solid var(--border, rgba(0,0,0,.1));
      transform: translateX(100%);
      transition: transform .35s cubic-bezier(.16,1,.3,1);
      display: flex; flex-direction: column;
      padding: 22px 26px 32px;
      box-shadow: -10px 0 40px rgba(0,0,0,.12);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    #${DRAWER_ID}.open { pointer-events: auto; }
    #${DRAWER_ID}.open .vf-drawer-backdrop { opacity: 1; }
    #${DRAWER_ID}.open .vf-drawer-panel { transform: translateX(0); }

    #${DRAWER_ID} .vf-drawer-close {
      align-self: flex-end;
      background: none; border: none;
      color: var(--accent-light, #b5a99a);
      padding: 8px; margin: -8px -8px 14px 0;
      cursor: pointer;
      transition: color .2s, transform .2s;
    }
    #${DRAWER_ID} .vf-drawer-close:hover { color: var(--accent, #8b7355); transform: rotate(90deg); }
    #${DRAWER_ID} .vf-drawer-close svg { width: 22px; height: 22px; }

    #${DRAWER_ID} .vf-drawer-eyebrow {
      font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase;
      color: var(--accent-light, #b5a99a);
      margin: 0 0 8px;
    }

    #${DRAWER_ID} .vf-drawer-links {
      display: flex; flex-direction: column;
    }
    #${DRAWER_ID} .vf-drawer-link {
      display: block;
      padding: 16px 4px;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.55rem;
      font-weight: 300;
      color: var(--text, #2c2420);
      letter-spacing: .3px;
      text-decoration: none;
      border-bottom: .5px solid var(--border, rgba(0,0,0,.08));
      transition: color .2s, padding-left .25s;
    }
    #${DRAWER_ID} .vf-drawer-link:hover,
    #${DRAWER_ID} .vf-drawer-link.active {
      color: var(--accent, #8b7355);
      padding-left: 8px;
    }

    #${DRAWER_ID} .vf-drawer-foot {
      margin-top: auto;
      padding-top: 24px;
      font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
      color: var(--accent-light, #b5a99a);
      text-align: center;
    }

    body.${BODY_OPEN_CLASS} { overflow: hidden; }
  }
`;

interface NavItem { href: string; label: string; }

const DEFAULT_LINKS: NavItem[] = [
  { href: "shop.html", label: "Shop" },
  { href: "shop.html#occasions", label: "Occasions" },
  { href: "about.html", label: "About" },
  { href: "weddings.html", label: "Weddings" },
];

function cleanLabel(raw: string): string {
  // Strip trailing arrow glyphs (e.g. "Shop ⌄") and surrounding whitespace.
  return raw.replace(/[\s ]*[⌄▾▼∨⌄∧∨∨⌄▾▼]+[\s ]*$/u, "").trim();
}

function getNavLinks(): NavItem[] {
  const navLinksEl = document.querySelector(".nav-links");
  if (!navLinksEl) return DEFAULT_LINKS;
  const items: NavItem[] = [];
  const seen = new Set<string>();
  navLinksEl.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
    // Skip anchors nested inside the desktop shop sub-dropdown — they're duplicates of the shop link.
    if (a.closest(".nav-shop-menu")) return;
    const href = a.getAttribute("href") || "#";
    const label = cleanLabel(a.textContent || "");
    if (!label) return;
    const key = href + "|" + label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ href, label });
  });
  return items.length ? items : DEFAULT_LINKS;
}

function currentPageFile(): string {
  return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function injectHamburger(): HTMLButtonElement | null {
  const navInner = document.querySelector(".nav-inner");
  if (!navInner) return null;
  const existing = document.getElementById(HAMBURGER_ID) as HTMLButtonElement | null;
  if (existing) return existing;

  const btn = document.createElement("button");
  btn.id = HAMBURGER_ID;
  btn.type = "button";
  btn.setAttribute("aria-label", "Open menu");
  btn.setAttribute("aria-controls", DRAWER_ID);
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
      <line x1="3" y1="7" x2="21" y2="7"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="17" x2="21" y2="17"/>
    </svg>
  `;
  // Insert as the first child so it occupies the left grid cell (where .nav-links normally sits).
  navInner.insertBefore(btn, navInner.firstChild);
  return btn;
}

function injectDrawer(): HTMLElement | null {
  if (document.getElementById(DRAWER_ID)) {
    return document.getElementById(DRAWER_ID);
  }
  const drawer = document.createElement("div");
  drawer.id = DRAWER_ID;
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-hidden", "true");
  drawer.setAttribute("aria-label", "Mobile navigation");
  drawer.innerHTML = `
    <div class="vf-drawer-backdrop" data-vf-close></div>
    <nav class="vf-drawer-panel" aria-label="Mobile menu">
      <button class="vf-drawer-close" type="button" aria-label="Close menu" data-vf-close>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18"/>
          <line x1="18" y1="6" x2="6" y2="18"/>
        </svg>
      </button>
      <p class="vf-drawer-eyebrow">Menu</p>
      <div class="vf-drawer-links" id="vf-drawer-links"></div>
      <p class="vf-drawer-foot">Amateur Florist &middot; Sydney</p>
    </nav>
  `;
  document.body.appendChild(drawer);

  const container = drawer.querySelector<HTMLElement>("#vf-drawer-links")!;
  const current = currentPageFile();
  getNavLinks().forEach(({ href, label }) => {
    const a = document.createElement("a");
    a.className = "vf-drawer-link";
    a.href = href;
    a.textContent = label;
    const hrefFile = ((href.split("/").pop() || "").split("#")[0] || "").toLowerCase();
    if (hrefFile && hrefFile === current) a.classList.add("active");
    container.appendChild(a);
  });

  return drawer;
}

function setupHandlers(): void {
  const btn = document.getElementById(HAMBURGER_ID);
  const drawer = document.getElementById(DRAWER_ID);
  if (!btn || !drawer) return;

  const open = (): void => {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    document.body.classList.add(BODY_OPEN_CLASS);
  };
  const close = (): void => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove(BODY_OPEN_CLASS);
  };

  btn.addEventListener("click", open);
  drawer.querySelectorAll<HTMLElement>("[data-vf-close]").forEach((el) => {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) close();
  });
  // If the viewport crosses back above 768px while the drawer is open, close it.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && drawer.classList.contains("open")) close();
  });
}

function init(): void {
  injectStyles();
  injectHamburger();
  injectDrawer();
  setupHandlers();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export {};
