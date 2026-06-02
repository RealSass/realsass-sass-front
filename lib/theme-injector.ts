// lib/theme-injector.ts
// ─── Convierte ThemeConfig → CSS variables para inyectar en <head> ────────────
//
// El config service guarda colores en hex (#c2714f).
// El design system del real-front usa oklch(...) en globals.css.
// En lugar de convertir hex→oklch (requiere cálculos complejos), inyectamos
// los colores hex directamente en variables CSS separadas con prefijo --theme-*.
// Los componentes que quieran usar el tema dinámico usan --theme-primary, etc.
// Los colores base de Tailwind (--primary, --secondary) quedan intactos como fallback.

import type { ThemeConfig } from './config-client'

/**
 * Genera el string CSS con las variables del tema para inyectar en <style>.
 * Solo se inyectan las variables --theme-* (no sobreescribe las de Tailwind).
 *
 * @param theme — ThemeConfig del config service
 * @returns string CSS listo para inyectar en <style> en el <head>
 */
export function buildThemeCSS(theme: ThemeConfig): string {
  const vars: string[] = [
    `--theme-primary: ${theme.primaryColor};`,
    `--theme-secondary: ${theme.secondaryColor};`,
    `--theme-accent: ${theme.accentColor ?? theme.primaryColor};`,
    `--theme-radius: ${theme.borderRadius};`,
    `--theme-font: ${theme.fontFamily}, 'DM Sans', sans-serif;`,
    `--theme-dark-mode: ${theme.darkMode ? '1' : '0'};`,
  ]

  if (theme.logoUrl) {
    vars.push(`--theme-logo-url: url('${theme.logoUrl}');`)
  }

  const css = `:root {\n  ${vars.join('\n  ')}\n}`

  // Si tiene CSS personalizado, lo agrega después de las variables
  if (theme.customCSS?.trim()) {
    return `${css}\n\n/* Custom CSS — ${theme.name} */\n${theme.customCSS}`
  }

  return css
}

/**
 * Retorna true si el ThemeConfig es el tema por defecto (sin personalización real).
 * Útil para evitar inyectar un <style> vacío innecesario.
 */
export function isDefaultTheme(theme: ThemeConfig): boolean {
  return theme.id === 'default' || theme.isSystemDefault
}
