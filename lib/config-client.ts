// lib/config-client.ts
// ─── Cliente del Config Service para el real-front ────────────────────────────
//
// Solo expone la función pública getPublicTheme — no requiere auth.
// Corre en el Server Component del layout (Next.js App Router).
// Fallback silencioso si el config service no está disponible.

export interface ThemeConfig {
  id:              string
  name:            string
  isActive:        boolean
  isSystemDefault: boolean
  primaryColor:    string
  secondaryColor:  string
  accentColor:     string | null
  fontFamily:      string
  borderRadius:    string
  logoUrl:         string | null
  faviconUrl:      string | null
  darkMode:        boolean
  customCSS:       string | null
}

/**
 * Tema por defecto — terracota/cream, el diseño original del real-front.
 * Se usa cuando el config service no está disponible o la org no tiene tema.
 */
export const DEFAULT_THEME: ThemeConfig = {
  id:              'default',
  name:            'Default',
  isActive:        true,
  isSystemDefault: true,
  primaryColor:    '#c2714f',   // terracota
  secondaryColor:  '#f7f3ef',   // warm cream
  accentColor:     '#d4896a',   // terracota lighter
  fontFamily:      'DM Sans',
  borderRadius:    '0.75rem',
  logoUrl:         null,
  faviconUrl:      null,
  darkMode:        false,
  customCSS:       null,
}

/**
 * Obtiene el tema activo de la organización desde el config service.
 * Endpoint público — no requiere Firebase token ni API Key.
 *
 * Resolución del config service:
 *   1. Busca tema activo de la org con ese slug
 *   2. Si no tiene, devuelve el tema "Default" del sistema
 *
 * @param orgSlug — slug de la organización (ej: "inmobiliaria-san-martin")
 * @returns ThemeConfig activo o DEFAULT_THEME como fallback
 */
export async function getPublicTheme(orgSlug: string): Promise<ThemeConfig> {
  const configUrl = process.env.NEXT_PUBLIC_CONFIG_URL

  if (!configUrl) {
    // Config service no configurado — usar tema por defecto silenciosamente
    return DEFAULT_THEME
  }

  try {
    const res = await fetch(
      `${configUrl}/config/themes/public/${encodeURIComponent(orgSlug)}`,
      {
        // Next.js revalidará cada 5 minutos (alineado con TTL de Redis del config service)
        next: { revalidate: 300 },
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!res.ok) {
      // 404 → org sin tema → usar default
      // Cualquier otro error → fallback silencioso
      return DEFAULT_THEME
    }

    const json = await res.json() as { success: boolean; data: ThemeConfig }
    return json.data ?? DEFAULT_THEME
  } catch {
    // Config service no disponible — fallback silencioso, nunca romper la landing
    return DEFAULT_THEME
  }
}
