function getAustralianSeason(date = new Date()) {
    const month = date.getMonth() + 1;
    if (month >= 9 && month <= 11)
        return 'spring';
    if (month === 12 || month <= 2)
        return 'summer';
    if (month >= 3 && month <= 5)
        return 'autumn';
    return 'winter';
}
// ─────────────────────────────────────────────────────────────────────────────
// NAV BRANCH SVG CONTENTS
// These replace the innerHTML of #nav-branch-left / #nav-branch-right divs.
// The outer div keeps the .nav-branch CSS positioning unchanged.
// ─────────────────────────────────────────────────────────────────────────────
const NAV_BRANCH_CONTENT = {
    // ── Spring: sakura blossoms ───────────────────────────────────────────────
    spring: {
        left: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#c8b89a" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#c8b89a" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <!-- sakura clusters -->
      <circle cx="52" cy="14" r="5" fill="#f9a8c9" opacity="0.85"/>
      <circle cx="47" cy="10" r="4" fill="#ffc0d5" opacity="0.8"/>
      <circle cx="57" cy="10" r="4.5" fill="#f48fb1" opacity="0.75"/>
      <circle cx="52" cy="6"  r="3.5" fill="#fde4ee" opacity="0.8"/>
      <circle cx="58" cy="15" r="3"   fill="#f9c6d8" opacity="0.7"/>
      <circle cx="86" cy="5"  r="5" fill="#f9a8c9" opacity="0.82"/>
      <circle cx="81" cy="2"  r="3.5" fill="#ffc0d5" opacity="0.76"/>
      <circle cx="91" cy="2"  r="4"   fill="#f48fb1" opacity="0.72"/>
      <circle cx="86" cy="-2" r="3"   fill="#fde4ee" opacity="0.78"/>
      <circle cx="124" cy="4"  r="4" fill="#f9a8c9" opacity="0.78"/>
      <circle cx="120" cy="1"  r="3" fill="#ffc0d5" opacity="0.72"/>
      <circle cx="128" cy="1"  r="3.5" fill="#f48fb1" opacity="0.68"/>
    </svg>`,
        right: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#c8b89a" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#c8b89a" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <circle cx="52" cy="14" r="5" fill="#f9a8c9" opacity="0.85"/>
      <circle cx="47" cy="10" r="4" fill="#ffc0d5" opacity="0.8"/>
      <circle cx="57" cy="10" r="4.5" fill="#f48fb1" opacity="0.75"/>
      <circle cx="52" cy="6"  r="3.5" fill="#fde4ee" opacity="0.8"/>
      <circle cx="58" cy="15" r="3"   fill="#f9c6d8" opacity="0.7"/>
      <circle cx="86" cy="5"  r="5" fill="#f9a8c9" opacity="0.82"/>
      <circle cx="81" cy="2"  r="3.5" fill="#ffc0d5" opacity="0.76"/>
      <circle cx="91" cy="2"  r="4"   fill="#f48fb1" opacity="0.72"/>
      <circle cx="86" cy="-2" r="3"   fill="#fde4ee" opacity="0.78"/>
      <circle cx="124" cy="4"  r="4" fill="#f9a8c9" opacity="0.78"/>
      <circle cx="120" cy="1"  r="3" fill="#ffc0d5" opacity="0.72"/>
      <circle cx="128" cy="1"  r="3.5" fill="#f48fb1" opacity="0.68"/>
    </svg>`,
    },
    // ── Summer: lush green leaves ─────────────────────────────────────────────
    summer: {
        left: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#7a9e5a" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#7a9e5a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#7a9e5a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#7a9e5a" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <!-- leaves -->
      <ellipse cx="40" cy="45" rx="9" ry="4" fill="#8dc760" opacity="0.70" transform="rotate(-30 40 45)"/>
      <ellipse cx="50" cy="41" rx="8" ry="3.5" fill="#a5d07a" opacity="0.65" transform="rotate(10 50 41)"/>
      <ellipse cx="76" cy="35" rx="9" ry="4" fill="#8dc760" opacity="0.66" transform="rotate(-20 76 35)"/>
      <ellipse cx="86" cy="31" rx="8" ry="3.5" fill="#a5d07a" opacity="0.60" transform="rotate(15 86 31)"/>
      <ellipse cx="55" cy="12" rx="8" ry="3.5" fill="#8dc760" opacity="0.72" transform="rotate(-15 55 12)"/>
      <ellipse cx="62" cy="9"  rx="7" ry="3"   fill="#a5d07a" opacity="0.65" transform="rotate(20 62 9)"/>
      <ellipse cx="114" cy="27" rx="7" ry="3" fill="#8dc760" opacity="0.62" transform="rotate(-14 114 27)"/>
      <ellipse cx="90" cy="4"  rx="7" ry="3" fill="#8dc760" opacity="0.68" transform="rotate(-10 90 4)"/>
      <ellipse cx="97" cy="2"  rx="6" ry="2.5" fill="#a5d07a" opacity="0.62" transform="rotate(18 97 2)"/>
      <ellipse cx="124" cy="3" rx="6" ry="2.5" fill="#8dc760" opacity="0.60" transform="rotate(-8 124 3)"/>
    </svg>`,
        right: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#7a9e5a" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#7a9e5a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#7a9e5a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#7a9e5a" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <ellipse cx="40" cy="45" rx="9" ry="4" fill="#8dc760" opacity="0.70" transform="rotate(-30 40 45)"/>
      <ellipse cx="50" cy="41" rx="8" ry="3.5" fill="#a5d07a" opacity="0.65" transform="rotate(10 50 41)"/>
      <ellipse cx="76" cy="35" rx="9" ry="4" fill="#8dc760" opacity="0.66" transform="rotate(-20 76 35)"/>
      <ellipse cx="86" cy="31" rx="8" ry="3.5" fill="#a5d07a" opacity="0.60" transform="rotate(15 86 31)"/>
      <ellipse cx="55" cy="12" rx="8" ry="3.5" fill="#8dc760" opacity="0.72" transform="rotate(-15 55 12)"/>
      <ellipse cx="62" cy="9"  rx="7" ry="3"   fill="#a5d07a" opacity="0.65" transform="rotate(20 62 9)"/>
      <ellipse cx="114" cy="27" rx="7" ry="3" fill="#8dc760" opacity="0.62" transform="rotate(-14 114 27)"/>
      <ellipse cx="90" cy="4"  rx="7" ry="3" fill="#8dc760" opacity="0.68" transform="rotate(-10 90 4)"/>
      <ellipse cx="97" cy="2"  rx="6" ry="2.5" fill="#a5d07a" opacity="0.62" transform="rotate(18 97 2)"/>
      <ellipse cx="124" cy="3" rx="6" ry="2.5" fill="#8dc760" opacity="0.60" transform="rotate(-8 124 3)"/>
    </svg>`,
    },
    // ── Autumn: original branch style + orange/amber maple leaves ────────────
    autumn: {
        left: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#c8b89a" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#c8b89a" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <!-- leaf-like ellipses in autumn tones -->
      <ellipse cx="40"  cy="45" rx="8.5" ry="3.8" fill="#d4772a" opacity="0.55" transform="rotate(-30 40 45)"/>
      <ellipse cx="76"  cy="35" rx="7.5" ry="3.2" fill="#e8941a" opacity="0.50" transform="rotate(-20 76 35)"/>
      <ellipse cx="114" cy="27" rx="6.5" ry="2.8" fill="#c45c1a" opacity="0.45" transform="rotate(-14 114 27)"/>
      <!-- maple leaf shapes at branch tips -->
      <ellipse cx="52" cy="13" rx="5" ry="8"   fill="#d4772a" opacity="0.72" transform="rotate(-15 52 13)"/>
      <ellipse cx="58" cy="11" rx="4.5" ry="7" fill="#e8941a" opacity="0.65" transform="rotate(20 58 11)"/>
      <ellipse cx="55" cy="7"  rx="4" ry="6.5" fill="#c45c1a" opacity="0.68" transform="rotate(5 55 7)"/>
      <ellipse cx="86" cy="4"  rx="5" ry="7.5" fill="#d4772a" opacity="0.68" transform="rotate(-12 86 4)"/>
      <ellipse cx="92" cy="3"  rx="4" ry="6.5" fill="#e8941a" opacity="0.62" transform="rotate(18 92 3)"/>
      <ellipse cx="123" cy="2" rx="4" ry="6"   fill="#c45c1a" opacity="0.62" transform="rotate(-8 123 2)"/>
      <ellipse cx="129" cy="1" rx="3.5" ry="5" fill="#d2691e" opacity="0.56" transform="rotate(14 129 1)"/>
    </svg>`,
        right: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#c8b89a" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#c8b89a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#c8b89a" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <ellipse cx="40"  cy="45" rx="8.5" ry="3.8" fill="#d4772a" opacity="0.55" transform="rotate(-30 40 45)"/>
      <ellipse cx="76"  cy="35" rx="7.5" ry="3.2" fill="#e8941a" opacity="0.50" transform="rotate(-20 76 35)"/>
      <ellipse cx="114" cy="27" rx="6.5" ry="2.8" fill="#c45c1a" opacity="0.45" transform="rotate(-14 114 27)"/>
      <ellipse cx="52" cy="13" rx="5" ry="8"   fill="#d4772a" opacity="0.72" transform="rotate(-15 52 13)"/>
      <ellipse cx="58" cy="11" rx="4.5" ry="7" fill="#e8941a" opacity="0.65" transform="rotate(20 58 11)"/>
      <ellipse cx="55" cy="7"  rx="4" ry="6.5" fill="#c45c1a" opacity="0.68" transform="rotate(5 55 7)"/>
      <ellipse cx="86" cy="4"  rx="5" ry="7.5" fill="#d4772a" opacity="0.68" transform="rotate(-12 86 4)"/>
      <ellipse cx="92" cy="3"  rx="4" ry="6.5" fill="#e8941a" opacity="0.62" transform="rotate(18 92 3)"/>
      <ellipse cx="123" cy="2" rx="4" ry="6"   fill="#c45c1a" opacity="0.62" transform="rotate(-8 123 2)"/>
      <ellipse cx="129" cy="1" rx="3.5" ry="5" fill="#d2691e" opacity="0.56" transform="rotate(14 129 1)"/>
    </svg>`,
    },
    // ── Winter: spruce/pine with snow ────────────────────────────────────────
    winter: {
        left: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#7a9aaa" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#7a9aaa" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#7a9aaa" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#7a9aaa" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <!-- horizontal spruce needles on main branch -->
      <line x1="32" y1="46" x2="22" y2="42" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="32" y1="46" x2="24" y2="50" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="58" y1="38" x2="48" y2="34" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="58" y1="38" x2="50" y2="42" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="84" y1="30" x2="74" y2="26" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="84" y1="30" x2="76" y2="34" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="112" y1="22" x2="103" y2="19" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="112" y1="22" x2="104" y2="26" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <!-- needles on sub-stems -->
      <line x1="54" y1="20" x2="46" y2="18" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="54" y1="20" x2="48" y2="24" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="88" y1="10" x2="80" y2="8" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="88" y1="10" x2="82" y2="14" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="124" y1="7" x2="117" y2="5" stroke="#5d7a88" stroke-width="0.7" stroke-linecap="round"/>
      <line x1="124" y1="7" x2="118" y2="10" stroke="#5d7a88" stroke-width="0.7" stroke-linecap="round"/>
      <!-- snow blobs on branch tips -->
      <ellipse cx="46" cy="18" rx="7" ry="2.8" fill="#e8f4fb" opacity="0.90" transform="rotate(-10 46 18)"/>
      <ellipse cx="80" cy="8"  rx="6" ry="2.4" fill="#e8f4fb" opacity="0.88" transform="rotate(-8 80 8)"/>
      <ellipse cx="117" cy="5" rx="5" ry="2.2" fill="#e8f4fb" opacity="0.85" transform="rotate(-6 117 5)"/>
      <ellipse cx="22" cy="41" rx="5" ry="2"   fill="#e8f4fb" opacity="0.82" transform="rotate(-15 22 41)"/>
    </svg>`,
        right: `<svg viewBox="0 0 190 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;overflow:visible">
      <path d="M-6 54 C 22 46 58 37 100 28 C 132 21 162 18 194 16" stroke="#7a9aaa" stroke-width="1.15" fill="none" stroke-linecap="round"/>
      <path d="M44 43 C 48 33 54 24 58 16" stroke="#7a9aaa" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M82 33 C 85 23 89 14 92 7" stroke="#7a9aaa" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M120 24 C 122 17 125 10 127 5" stroke="#7a9aaa" stroke-width="0.75" fill="none" stroke-linecap="round"/>
      <line x1="32" y1="46" x2="22" y2="42" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="32" y1="46" x2="24" y2="50" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="58" y1="38" x2="48" y2="34" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="58" y1="38" x2="50" y2="42" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="84" y1="30" x2="74" y2="26" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="84" y1="30" x2="76" y2="34" stroke="#5d7a88" stroke-width="0.9" stroke-linecap="round"/>
      <line x1="112" y1="22" x2="103" y2="19" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="112" y1="22" x2="104" y2="26" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="54" y1="20" x2="46" y2="18" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="54" y1="20" x2="48" y2="24" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="88" y1="10" x2="80" y2="8" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="88" y1="10" x2="82" y2="14" stroke="#5d7a88" stroke-width="0.8" stroke-linecap="round"/>
      <line x1="124" y1="7" x2="117" y2="5" stroke="#5d7a88" stroke-width="0.7" stroke-linecap="round"/>
      <line x1="124" y1="7" x2="118" y2="10" stroke="#5d7a88" stroke-width="0.7" stroke-linecap="round"/>
      <ellipse cx="46" cy="18" rx="7" ry="2.8" fill="#e8f4fb" opacity="0.90" transform="rotate(-10 46 18)"/>
      <ellipse cx="80" cy="8"  rx="6" ry="2.4" fill="#e8f4fb" opacity="0.88" transform="rotate(-8 80 8)"/>
      <ellipse cx="117" cy="5" rx="5" ry="2.2" fill="#e8f4fb" opacity="0.85" transform="rotate(-6 117 5)"/>
      <ellipse cx="22" cy="41" rx="5" ry="2"   fill="#e8f4fb" opacity="0.82" transform="rotate(-15 22 41)"/>
    </svg>`,
    },
};
function updateNavBranches(season) {
    const left = document.getElementById('nav-branch-left');
    const right = document.getElementById('nav-branch-right');
    if (left)
        left.innerHTML = NAV_BRANCH_CONTENT[season].left;
    if (right)
        right.innerHTML = NAV_BRANCH_CONTENT[season].right;
}
// ─────────────────────────────────────────────────────────────────────────────
// SIDE DECORATIONS — fixed botanical panels, scroll-stable
// ─────────────────────────────────────────────────────────────────────────────
const SIDE_SVG = {
    spring: {
        left: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M85 700 Q68 610 80 520 Q92 430 70 340 Q48 250 62 160 Q76 80 58 10" stroke="#b0947a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M72 600 Q48 582 34 558" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M76 490 Q52 470 38 445" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M65 385 Q42 364 28 340" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M64 278 Q42 258 28 234" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M62 170 Q40 150 26 128" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="32" cy="555" r="7" fill="#f9a8c9" opacity="0.82"/><circle cx="24" cy="549" r="5.5" fill="#ffc0d5" opacity="0.76"/><circle cx="40" cy="550" r="6" fill="#f48fb1" opacity="0.76"/><circle cx="30" cy="542" r="4.5" fill="#fde4ee" opacity="0.80"/>
      <circle cx="36" cy="442" r="7" fill="#f9a8c9" opacity="0.80"/><circle cx="28" cy="436" r="5.5" fill="#ffc0d5" opacity="0.74"/><circle cx="44" cy="438" r="6" fill="#f48fb1" opacity="0.74"/><circle cx="34" cy="430" r="4.5" fill="#fde4ee" opacity="0.78"/>
      <circle cx="26" cy="337" r="7" fill="#f9a8c9" opacity="0.78"/><circle cx="18" cy="331" r="5" fill="#ffc0d5" opacity="0.72"/><circle cx="34" cy="332" r="5.5" fill="#f48fb1" opacity="0.72"/>
      <circle cx="26" cy="231" r="7" fill="#f9a8c9" opacity="0.76"/><circle cx="18" cy="225" r="5" fill="#ffc0d5" opacity="0.70"/><circle cx="34" cy="226" r="5.5" fill="#f48fb1" opacity="0.70"/>
      <circle cx="24" cy="125" r="6" fill="#f9a8c9" opacity="0.72"/><circle cx="16" cy="120" r="4.5" fill="#ffc0d5" opacity="0.66"/><circle cx="32" cy="121" r="5" fill="#f48fb1" opacity="0.66"/>
    </svg>`,
        right: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M15 700 Q32 610 20 520 Q8 430 30 340 Q52 250 38 160 Q24 80 42 10" stroke="#b0947a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M28 600 Q52 582 66 558" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M24 490 Q48 470 62 445" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M35 385 Q58 364 72 340" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M36 278 Q58 258 72 234" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M38 170 Q60 150 74 128" stroke="#b0947a" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="68" cy="555" r="7" fill="#f9a8c9" opacity="0.82"/><circle cx="76" cy="549" r="5.5" fill="#ffc0d5" opacity="0.76"/><circle cx="60" cy="550" r="6" fill="#f48fb1" opacity="0.76"/><circle cx="70" cy="542" r="4.5" fill="#fde4ee" opacity="0.80"/>
      <circle cx="64" cy="442" r="7" fill="#f9a8c9" opacity="0.80"/><circle cx="72" cy="436" r="5.5" fill="#ffc0d5" opacity="0.74"/><circle cx="56" cy="438" r="6" fill="#f48fb1" opacity="0.74"/><circle cx="66" cy="430" r="4.5" fill="#fde4ee" opacity="0.78"/>
      <circle cx="74" cy="337" r="7" fill="#f9a8c9" opacity="0.78"/><circle cx="82" cy="331" r="5" fill="#ffc0d5" opacity="0.72"/><circle cx="66" cy="332" r="5.5" fill="#f48fb1" opacity="0.72"/>
      <circle cx="74" cy="231" r="7" fill="#f9a8c9" opacity="0.76"/><circle cx="82" cy="225" r="5" fill="#ffc0d5" opacity="0.70"/><circle cx="66" cy="226" r="5.5" fill="#f48fb1" opacity="0.70"/>
      <circle cx="76" cy="125" r="6" fill="#f9a8c9" opacity="0.72"/><circle cx="84" cy="120" r="4.5" fill="#ffc0d5" opacity="0.66"/><circle cx="68" cy="121" r="5" fill="#f48fb1" opacity="0.66"/>
    </svg>`,
    },
    summer: {
        left: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M82 700 Q65 610 78 520 Q90 430 68 340 Q46 250 60 160 Q74 80 56 10" stroke="#5a8a40" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M70 600 Q46 580 32 555" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M74 490 Q50 468 36 443" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M63 383 Q40 362 26 337" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M62 276 Q40 256 26 232" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M60 168 Q38 148 24 126" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="28" cy="548" rx="16" ry="7" fill="#7cb85c" opacity="0.80" transform="rotate(-25 28 548)"/><ellipse cx="42" cy="542" rx="13" ry="6" fill="#a5d07a" opacity="0.74" transform="rotate(10 42 542)"/><ellipse cx="20" cy="540" rx="11" ry="5" fill="#5a9e3a" opacity="0.74" transform="rotate(-40 20 540)"/>
      <ellipse cx="32" cy="436" rx="16" ry="7" fill="#7cb85c" opacity="0.78" transform="rotate(-20 32 436)"/><ellipse cx="46" cy="430" rx="13" ry="6" fill="#a5d07a" opacity="0.72" transform="rotate(15 46 430)"/><ellipse cx="22" cy="430" rx="11" ry="5" fill="#5a9e3a" opacity="0.72" transform="rotate(-35 22 430)"/>
      <ellipse cx="22" cy="330" rx="15" ry="6.5" fill="#7cb85c" opacity="0.76" transform="rotate(-22 22 330)"/><ellipse cx="36" cy="324" rx="12" ry="5.5" fill="#a5d07a" opacity="0.70" transform="rotate(12 36 324)"/>
      <ellipse cx="22" cy="225" rx="15" ry="6.5" fill="#7cb85c" opacity="0.74" transform="rotate(-20 22 225)"/><ellipse cx="36" cy="219" rx="12" ry="5.5" fill="#a5d07a" opacity="0.68" transform="rotate(10 36 219)"/>
      <ellipse cx="20" cy="120" rx="13" ry="6" fill="#7cb85c" opacity="0.72" transform="rotate(-18 20 120)"/><ellipse cx="34" cy="114" rx="11" ry="5" fill="#a5d07a" opacity="0.66" transform="rotate(8 34 114)"/>
    </svg>`,
        right: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M18 700 Q35 610 22 520 Q10 430 32 340 Q54 250 40 160 Q26 80 44 10" stroke="#5a8a40" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M30 600 Q54 580 68 555" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M26 490 Q50 468 64 443" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M37 383 Q60 362 74 337" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M38 276 Q60 256 74 232" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M40 168 Q62 148 76 126" stroke="#5a8a40" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="72" cy="548" rx="16" ry="7" fill="#7cb85c" opacity="0.80" transform="rotate(25 72 548)"/><ellipse cx="58" cy="542" rx="13" ry="6" fill="#a5d07a" opacity="0.74" transform="rotate(-10 58 542)"/><ellipse cx="80" cy="540" rx="11" ry="5" fill="#5a9e3a" opacity="0.74" transform="rotate(40 80 540)"/>
      <ellipse cx="68" cy="436" rx="16" ry="7" fill="#7cb85c" opacity="0.78" transform="rotate(20 68 436)"/><ellipse cx="54" cy="430" rx="13" ry="6" fill="#a5d07a" opacity="0.72" transform="rotate(-15 54 430)"/><ellipse cx="78" cy="430" rx="11" ry="5" fill="#5a9e3a" opacity="0.72" transform="rotate(35 78 430)"/>
      <ellipse cx="78" cy="330" rx="15" ry="6.5" fill="#7cb85c" opacity="0.76" transform="rotate(22 78 330)"/><ellipse cx="64" cy="324" rx="12" ry="5.5" fill="#a5d07a" opacity="0.70" transform="rotate(-12 64 324)"/>
      <ellipse cx="78" cy="225" rx="15" ry="6.5" fill="#7cb85c" opacity="0.74" transform="rotate(20 78 225)"/><ellipse cx="64" cy="219" rx="12" ry="5.5" fill="#a5d07a" opacity="0.68" transform="rotate(-10 64 219)"/>
      <ellipse cx="80" cy="120" rx="13" ry="6" fill="#7cb85c" opacity="0.72" transform="rotate(18 80 120)"/><ellipse cx="66" cy="114" rx="11" ry="5" fill="#a5d07a" opacity="0.66" transform="rotate(-8 66 114)"/>
    </svg>`,
    },
    autumn: {
        left: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M84 700 Q67 608 80 518 Q92 428 70 338 Q48 248 62 158 Q76 78 58 8" stroke="#7a4a20" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M72 598 Q48 578 34 553" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M76 488 Q52 467 38 441" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M65 382 Q42 361 28 336" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M64 275 Q42 255 28 230" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M62 167 Q40 147 26 124" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <!-- maple leaf shapes -->
      <ellipse cx="26" cy="546" rx="13" ry="7" fill="#d4772a" opacity="0.78" transform="rotate(-20 26 546)"/><ellipse cx="38" cy="540" rx="11" ry="6" fill="#e8941a" opacity="0.70" transform="rotate(15 38 540)"/><ellipse cx="18" cy="538" rx="10" ry="5" fill="#c45c1a" opacity="0.72" transform="rotate(-38 18 538)"/>
      <ellipse cx="30" cy="434" rx="13" ry="7" fill="#c45c1a" opacity="0.76" transform="rotate(-16 30 434)"/><ellipse cx="42" cy="428" rx="11" ry="6" fill="#d4772a" opacity="0.68" transform="rotate(18 42 428)"/><ellipse cx="20" cy="428" rx="10" ry="5" fill="#e8941a" opacity="0.70" transform="rotate(-34 20 428)"/>
      <ellipse cx="20" cy="328" rx="12" ry="6.5" fill="#e8941a" opacity="0.74" transform="rotate(-18 20 328)"/><ellipse cx="32" cy="322" rx="11" ry="5.5" fill="#b84a0a" opacity="0.67" transform="rotate(12 32 322)"/>
      <ellipse cx="20" cy="223" rx="12" ry="6.5" fill="#d4772a" opacity="0.72" transform="rotate(-16 20 223)"/><ellipse cx="32" cy="217" rx="11" ry="5.5" fill="#c45c1a" opacity="0.65" transform="rotate(10 32 217)"/>
      <ellipse cx="18" cy="118" rx="11" ry="6" fill="#e8941a" opacity="0.70" transform="rotate(-14 18 118)"/><ellipse cx="30" cy="112" rx="9" ry="5" fill="#d4772a" opacity="0.63" transform="rotate(8 30 112)"/>
    </svg>`,
        right: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M16 700 Q33 608 20 518 Q8 428 30 338 Q52 248 38 158 Q24 78 42 8" stroke="#7a4a20" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M28 598 Q52 578 66 553" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M24 488 Q48 467 62 441" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M35 382 Q58 361 72 336" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M36 275 Q58 255 72 230" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M38 167 Q60 147 74 124" stroke="#7a4a20" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="74" cy="546" rx="13" ry="7" fill="#d4772a" opacity="0.78" transform="rotate(20 74 546)"/><ellipse cx="62" cy="540" rx="11" ry="6" fill="#e8941a" opacity="0.70" transform="rotate(-15 62 540)"/><ellipse cx="82" cy="538" rx="10" ry="5" fill="#c45c1a" opacity="0.72" transform="rotate(38 82 538)"/>
      <ellipse cx="70" cy="434" rx="13" ry="7" fill="#c45c1a" opacity="0.76" transform="rotate(16 70 434)"/><ellipse cx="58" cy="428" rx="11" ry="6" fill="#d4772a" opacity="0.68" transform="rotate(-18 58 428)"/><ellipse cx="80" cy="428" rx="10" ry="5" fill="#e8941a" opacity="0.70" transform="rotate(34 80 428)"/>
      <ellipse cx="80" cy="328" rx="12" ry="6.5" fill="#e8941a" opacity="0.74" transform="rotate(18 80 328)"/><ellipse cx="68" cy="322" rx="11" ry="5.5" fill="#b84a0a" opacity="0.67" transform="rotate(-12 68 322)"/>
      <ellipse cx="80" cy="223" rx="12" ry="6.5" fill="#d4772a" opacity="0.72" transform="rotate(16 80 223)"/><ellipse cx="68" cy="217" rx="11" ry="5.5" fill="#c45c1a" opacity="0.65" transform="rotate(-10 68 217)"/>
      <ellipse cx="82" cy="118" rx="11" ry="6" fill="#e8941a" opacity="0.70" transform="rotate(14 82 118)"/><ellipse cx="70" cy="112" rx="9" ry="5" fill="#d4772a" opacity="0.63" transform="rotate(-8 70 112)"/>
    </svg>`,
    },
    winter: {
        left: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M82 700 Q65 608 78 518 Q90 428 68 338 Q46 248 60 158 Q74 78 56 8" stroke="#85929e" stroke-width="1.8" stroke-linecap="round"/>
      ${[580, 470, 365, 258, 152, 60].map((y, i) => {
            const len = 38 - i * 2;
            const x = 72 - i;
            return `<path d="${x} ${y} Q${x - 14} ${y + 4} ${x - len} ${y + 6}" stroke="#ddf0f8" stroke-width="${1.4 - i * 0.06}" stroke-linecap="round"/>
        <path d="${x} ${y} Q${x - 12} ${y - 4} ${x - len + 2} ${y - 5}" stroke="#ddf0f8" stroke-width="${1.2 - i * 0.06}" stroke-linecap="round"/>
        <ellipse cx="${x - len + 2}" cy="${y + 2}" rx="${10 - i}" ry="3" fill="#ddf0f8" opacity="0.88" transform="rotate(-6 ${x - len + 2} ${y + 2})"/>
        <ellipse cx="${x - len + 4}" cy="${y - 4}" rx="${9 - i}" ry="2.5" fill="#ddf0f8" opacity="0.82" transform="rotate(5 ${x - len + 4} ${y - 4})"/>`;
        }).join('')}
    </svg>`,
        right: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 700" fill="none" style="width:100%;height:100%">
      <path d="M18 700 Q35 608 22 518 Q10 428 32 338 Q54 248 40 158 Q26 78 44 8" stroke="#ddf0f8" stroke-width="1.8" stroke-linecap="round"/>
      ${[580, 470, 365, 258, 152, 60].map((y, i) => {
            const len = 38 - i * 2;
            const x = 28 + i;
            return `<path d="${x} ${y} Q${x + 14} ${y + 4} ${x + len} ${y + 6}" stroke="#ddf0f8" stroke-width="${1.4 - i * 0.06}" stroke-linecap="round"/>
        <path d="${x} ${y} Q${x + 12} ${y - 4} ${x + len - 2} ${y - 5}" stroke="#ddf0f8" stroke-width="${1.2 - i * 0.06}" stroke-linecap="round"/>
        <ellipse cx="${x + len - 2}" cy="${y + 2}" rx="${10 - i}" ry="3" fill="#ddf0f8" opacity="0.88" transform="rotate(6 ${x + len - 2} ${y + 2})"/>
        <ellipse cx="${x + len - 4}" cy="${y - 4}" rx="${9 - i}" ry="2.5" fill="#ddf0f8" opacity="0.82" transform="rotate(-5 ${x + len - 4} ${y - 4})"/>`;
        }).join('')}
    </svg>`,
    },
};
let sideLeft = null;
let sideRight = null;
function updateSideDecorations(season) {
    if (!sideLeft) {
        sideLeft = document.createElement('div');
        sideLeft.id = 'season-side-left';
        sideLeft.style.cssText = 'position:fixed;top:0;left:0;width:110px;height:100vh;pointer-events:none;z-index:1;overflow:hidden;opacity:0.65;';
        document.body.appendChild(sideLeft);
    }
    if (!sideRight) {
        sideRight = document.createElement('div');
        sideRight.id = 'season-side-right';
        sideRight.style.cssText = 'position:fixed;top:0;right:0;width:110px;height:100vh;pointer-events:none;z-index:1;overflow:hidden;opacity:0.65;';
        document.body.appendChild(sideRight);
    }
    sideLeft.innerHTML = SIDE_SVG[season].left;
    sideRight.innerHTML = SIDE_SVG[season].right;
}
const drawSpringPetal = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * .6, -s * .4, s, s * .2, 0, s);
    ctx.bezierCurveTo(-s, s * .2, -s * .6, -s * .4, 0, 0);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
};
const drawSummerLeaf = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * .7, -s * .5, s * .8, s * .3, 0, s);
    ctx.bezierCurveTo(-s * .8, s * .3, -s * .7, -s * .5, 0, -s);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -s * .8);
    ctx.lineTo(0, s * .8);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
};
const drawAutumnLeaf = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * .5, -s * .9, s * .9, -s * .4, s * .8, 0);
    ctx.bezierCurveTo(s * 1.1, s * .1, s * .6, s * .7, 0, s * .5);
    ctx.bezierCurveTo(-s * .6, s * .7, -s * 1.1, s * .1, -s * .8, 0);
    ctx.bezierCurveTo(-s * .9, -s * .4, -s * .5, -s * .9, 0, -s);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -s * .9);
    ctx.lineTo(0, s * .4);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
};
const drawSnowflake = (ctx, p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alpha;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    const s = p.size;
    for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate(Math.PI / 3 * i + p.rotation);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s);
        ctx.stroke();
        [0.35, 0.62].forEach(t => {
            const y = -s * t, b = s * .2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(b, y - b * .6);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(-b, y - b * .6);
            ctx.stroke();
        });
        ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, s * .12, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
};
const PARTICLE_CONFIGS = {
    spring: { particleCount: 32, colors: ['#f9a8c9', '#f7cde0', '#fde0ec', '#f4b8d4', '#ffffff', '#ffc8d8'], sizeRange: [6, 13], speedY: [0.7, 1.5], speedX: [-0.4, 0.4], draw: drawSpringPetal },
    summer: { particleCount: 28, colors: ['#7cb85c', '#a5d07a', '#5a9e3a', '#8dc760', '#c8e6a0'], sizeRange: [6, 13], speedY: [0.6, 1.4], speedX: [-0.5, 0.5], draw: drawSummerLeaf },
    autumn: { particleCount: 30, colors: ['#d4772a', '#c45c1a', '#e8941a', '#b84a0a', '#8b4513', '#d2691e'], sizeRange: [8, 16], speedY: [0.7, 1.7], speedX: [-0.6, 0.6], draw: drawAutumnLeaf },
    winter: { particleCount: 40, colors: ['#e0f4ff', '#b8dff5', '#cce8f7', '#d8eefa', '#ffffff', '#a8d8ea'], sizeRange: [5, 14], speedY: [0.4, 1.0], speedX: [-0.2, 0.3], draw: drawSnowflake },
};
function rand(a, b) { return a + Math.random() * (b - a); }
function makeParticle(cfg, w, h, init = false) {
    const size = rand(...cfg.sizeRange);
    return { x: rand(0, w), y: init ? rand(-h, 0) : rand(-size * 3, -size),
        vx: rand(...cfg.speedX), vy: rand(...cfg.speedY),
        size, rotation: rand(0, Math.PI * 2), rotSpeed: rand(-0.025, 0.025),
        alpha: rand(0.55, 0.92), color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        wobble: rand(0, Math.PI * 2), wobbleSpeed: rand(0.015, 0.04), wobbleAmp: rand(0.4, 1.2) };
}
let animId = null;
function stopParticles() {
    if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
    }
}
function startParticles(season) {
    stopParticles();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        return;
    // Reuse the existing #petals-canvas if present, otherwise make one
    let canvas = document.getElementById('petals-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'petals-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:8888;';
        document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    const cfg = PARTICLE_CONFIGS[season];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const particles = Array.from({ length: cfg.particleCount }, () => makeParticle(cfg, canvas.width, canvas.height, true));
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.wobble += p.wobbleSpeed;
            p.x += p.vx + Math.sin(p.wobble) * p.wobbleAmp;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            if (p.y > canvas.height + 20)
                particles[i] = makeParticle(cfg, canvas.width, canvas.height);
            cfg.draw(ctx, p);
        });
        animId = requestAnimationFrame(tick);
    }
    tick();
}
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// HERO SCENE — removed. Photo panel + seasonal colour wash replaces SVG art.
// ─────────────────────────────────────────────────────────────────────────────
/* REMOVED: HERO_SCENES, updateHeroScene, HERO_BG, updateHeroBg */
const __HERO_REMOVED__ = true; // placeholder to keep line references stable
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
const ALL_SEASONS = ['spring', 'summer', 'autumn', 'winter'];

// CSS variable palettes mirroring the redesign — these drive the new
// inline-CSS-var theme system used by the redesigned pages.
const SEASON_VARS = {
    spring: { accent:'#5a1a2a', accentDark:'#2a0d15', accentLight:'#a8606e', bg:'#fdf8f9', bgAlt:'#f5eff2' },
    summer: { accent:'#6b8870', accentDark:'#1e2a22', accentLight:'#a8c0aa', bg:'#f8faf8', bgAlt:'#eef3ee' },
    autumn: { accent:'#a85738', accentDark:'#3a1c12', accentLight:'#d8a48a', bg:'#faf8f4', bgAlt:'#f5f0e8' },
    winter: { accent:'#1c3656', accentDark:'#0e1d30', accentLight:'#7a96b8', bg:'#f6f8fa', bgAlt:'#eaf0f5' }
};

function applyCssVars(season) {
    const v = SEASON_VARS[season];
    if (!v) return;
    const r = document.documentElement;
    r.style.setProperty('--accent',       v.accent);
    r.style.setProperty('--accent-dark',  v.accentDark);
    r.style.setProperty('--accent-light', v.accentLight);
    r.style.setProperty('--bg',           v.bg);
    r.style.setProperty('--bg-alt',       v.bgAlt);
    document.body.dataset.season = season;
}

export function initSeasonalTheme(override) {
    // Date-based detection is the default; pass an override (e.g. 'winter') to force.
    const season = 'winter';
    ALL_SEASONS.forEach(s => document.body.classList.remove(`season-${s}`));
    document.body.classList.add(`season-${season}`);
    applyCssVars(season);                 // ← bridge to redesign CSS variables
    updateNavBranches(season);
    updateSideDecorations(season);
    startParticles(season);
    updateHeroCopy(season);                // ← inject seasonal hero copy if hooks exist
    return season;
}
export function destroySeasonalTheme() {
    stopParticles();
    sideLeft?.remove();
    sideLeft = null;
    sideRight?.remove();
    sideRight = null;
    ALL_SEASONS.forEach(s => document.body.classList.remove(`season-${s}`));
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-INIT + MANUAL SEASON SWITCHER
// ─────────────────────────────────────────────────────────────────────────────

const HERO_COPY = {
    spring: { eyebrow: 'Spring collection', headline: 'Soft blooms,<br>in <em>full grace</em>',     subtitle: 'Blush hues &amp; tender new growth',  cta: 'Explore the collection' },
    summer: { eyebrow: 'Summer collection', headline: 'Sunlit beauty,<br>in <em>full bloom</em>',    subtitle: 'Sage greens &amp; abundant warmth',   cta: 'Explore the collection' },
    autumn: { eyebrow: 'Autumn collection', headline: 'Quiet warmth,<br>in <em>full turn</em>',      subtitle: 'Terracotta hues &amp; lasting amber', cta: 'Explore the collection' },
    winter: { eyebrow: 'Winter collection', headline: 'Quiet beauty,<br>in <em>full bloom</em>',     subtitle: 'Deep navy hues &amp; lasting warmth', cta: 'Explore the collection' }
};

export function updateHeroCopy(season) {
    const y = new Date().getFullYear();
    const c = HERO_COPY[season];
    if (!c) return;
    const el = (id) => document.getElementById(id);
    if (el('hero-eyebrow-text')) el('hero-eyebrow-text').textContent = c.eyebrow + ' ' + y;
    if (el('hero-headline'))     el('hero-headline').innerHTML       = c.headline;
    if (el('hero-subtitle'))     el('hero-subtitle').innerHTML       = c.subtitle;
    if (el('hero-cta-primary'))  el('hero-cta-primary').textContent  = c.cta;
}