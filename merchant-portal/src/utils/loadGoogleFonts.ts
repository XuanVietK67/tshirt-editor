import { FONT_FAMILIES, SYSTEM_FONTS } from '@/constants/fontFamilies'

let loaded = false

/**
 * Injects a single Google Fonts <link> for every non-system font in FONT_FAMILIES.
 * Safe to call multiple times — only runs once.
 */
export function loadGoogleFonts() {
  if (loaded) return
  loaded = true

  const families = FONT_FAMILIES
    .filter((f) => !SYSTEM_FONTS.has(f.name))
    .map((f) => `family=${f.name.replace(/ /g, '+')}`)
    .join('&')

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}
