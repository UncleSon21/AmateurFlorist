# Amateur Florist — brand files

The mark is a **tied heart**: two stems crossed into a heart and tied with a bow,
like a hand-tied bouquet. The line under the name explains the name:
*from the Latin amātor — one who loves.*

## Files

| File | Use |
|---|---|
| `amateur-florist-lockup.svg` | Master logo: mark, name and definition, champagne on burgundy |
| `amateur-florist-seal.svg` | Round sticker for gift boxes and hire cases |
| `amateur-florist-avatar.svg` | Instagram and other profile pictures (no text) |
| `amateur-florist-mark-champagne.svg` | Mark only, for dark backgrounds |
| `amateur-florist-mark-burgundy.svg` | Mark only, for light backgrounds |

The website uses `public/brand/mark.svg` (same drawing, takes the season's colour)
and `public/favicon.svg`. `public/brand/logo-512.png` is the avatar rendered to PNG; it's
the logo in the homepage's structured data, which Google can show in search.

## Colours

All from the site's own palette — don't add new ones.

| | Hex | Where it comes from |
|---|---|---|
| Champagne | `#d4c5a0` | Footer logo colour |
| Deep burgundy | `#2a0d15` | Spring `accentDark` (footer background) |
| Burgundy | `#5a1a2a` | Spring `accent` |

Printed items use champagne on deep burgundy. On the website the mark follows the
season (`seasonalTheme.ts` → `SEASON_VARS`) and turns gold at night.

## Fonts

- Name: **Great Vibes**
- Definition line: **Cormorant Garamond**, italic

Both are free on Google Fonts. The lockup and seal contain live text, so before
sending them to a printer either install both fonts or convert the text to
outlines (Inkscape: *Path → Object to Path*; Illustrator: *Type → Create Outlines*).
The mark and avatar files are pure shapes and need no fonts.

## Size

The mark is drawn in fine line. Below about 40px wide, use a thicker line
(the website header and favicon already do).
