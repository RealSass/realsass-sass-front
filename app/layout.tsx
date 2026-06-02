// app/layout.tsx
// ─── Root layout — Server Component ──────────────────────────────────────────
//
// Carga el tema activo del config service (getPublicTheme) y lo inyecta
// en el <head> como CSS variables --theme-*.
// Si el config service no está disponible, usa el tema terracota por defecto.
//
// El orgSlug se obtiene de NEXT_PUBLIC_ORG_SLUG (definible por org en Vercel/env).
// Si no está definido, no se carga tema dinámico (usa globals.css).

import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider-wrapper'
import { Toaster } from '@/components/ui/toaster'
import { getPublicTheme, isDefaultTheme } from '@/lib/config-client'
import { buildThemeCSS } from '@/lib/theme-injector'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://propiedad.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Propiedad — La plataforma SaaS para inmobiliarias modernas',
    template: '%s | Propiedad',
  },
  description:
    'Propiedad es la plataforma todo-en-uno que ayuda a las agencias inmobiliarias a gestionar propiedades, cerrar operaciones más rápido y hacer crecer su negocio.',
  keywords:  ['inmobiliaria', 'SaaS', 'propiedades', 'real estate', 'agencia'],
  authors:   [{ name: 'Propiedad' }],
  openGraph: {
    type:        'website',
    locale:      'es_AR',
    url:         APP_URL,
    siteName:    'Propiedad',
    title:       'Propiedad — La plataforma SaaS para inmobiliarias modernas',
    description: 'Gestioná propiedades, colaboradores y clientes desde un solo lugar.',
    images: [
      {
        url:    '/images/og-image.jpg',
        width:  1200,
        height: 630,
        alt:    'Propiedad — Dashboard de inmobiliaria',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Propiedad — SaaS para inmobiliarias',
    description: 'Gestioná tu agencia inmobiliaria desde un solo lugar.',
    images:      ['/images/og-image.jpg'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor:   '#f5f0eb',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // ── Cargar tema del config service ──────────────────────────────────────────
  // orgSlug viene de la variable de entorno — cada deployment de org puede tenerla.
  // Si no está definida, usa el tema terracota hardcodeado de globals.css.
  const orgSlug = process.env.NEXT_PUBLIC_ORG_SLUG

  let themeCSS: string | null = null

  if (orgSlug) {
    const theme = await getPublicTheme(orgSlug)
    // Solo inyectar CSS si no es el tema por defecto (evita <style> vacío)
    if (!isDefaultTheme(theme)) {
      themeCSS = buildThemeCSS(theme)
    }
  }

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmSerif.variable}`}
    >
      <head>
        {/*
          Inyección del tema dinámico del config service.
          - Solo presente si la org tiene un tema personalizado activo.
          - Las variables --theme-* pueden usarse en cualquier componente.
          - No sobreescribe las variables de Tailwind (--primary, etc.)
            para mantener retrocompatibilidad con globals.css.
          - Revalidado cada 300s por Next.js (alineado con TTL de Redis del config service).
        */}
        {themeCSS && (
          <style
            id="theme-config-service"
            dangerouslySetInnerHTML={{ __html: themeCSS }}
          />
        )}
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
