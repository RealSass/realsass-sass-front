// hooks/use-dashboard-sso.ts
'use client'

import { useState, useCallback } from 'react'

// URL del dashboard-back (para hacer firebase-sso)
const DASHBOARD_API_URL: string =
  (process.env.NEXT_PUBLIC_DASHBOARD_API_URL ?? 'http://localhost:3001/api/v1')
    .replace(/\/+$/, '') // quitar trailing slash

// URL del dashboard-front (para redirigir al usuario)
const DASHBOARD_FRONT_URL: string =
  (process.env.NEXT_PUBLIC_DASHBOARD_FRONT_URL ?? 'http://localhost:3002')
    .replace(/\/+$/, '')

export type SsoState = 'idle' | 'loading' | 'success' | 'error'

export function useDashboardSSO(
  getIdToken: () => Promise<string | null | undefined>,
) {
  const [state,    setState]    = useState<SsoState>('idle')
  const [ssoError, setSsoError] = useState<string | null>(null)

  const openDashboard = useCallback(async () => {
    setState('loading')
    setSsoError(null)

    try {
      // 1. Obtener Firebase ID Token del usuario autenticado en real-front
      const firebaseToken = await getIdToken()
      if (!firebaseToken) throw new Error('No se pudo obtener el token de sesión')

      // 2. Intercambiar Firebase token por JWT del dashboard-back
      //    El endpoint /auth/firebase-sso verifica el token Firebase con Admin SDK,
      //    crea/actualiza el usuario en la DB del dashboard-back y devuelve un JWT.
      const res = await fetch(`${DASHBOARD_API_URL}/auth/firebase-sso`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ firebaseIdToken: firebaseToken }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message ?? `Error del servidor: ${res.status}`)
      }

      const json = await res.json() as {
        data?: { accessToken: string; refreshToken: string; user?: unknown }
        accessToken?: string
        refreshToken?: string
      }

      // Normalizar respuesta: puede venir con o sin wrapper { data: ... }
      const tokens = json.data ?? {
        accessToken:  json.accessToken,
        refreshToken: json.refreshToken,
      }

      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('El servidor no devolvió tokens válidos')
      }

      setState('success')

      // 3. Redirigir al dashboard-front con el JWT en la URL.
      //    La página /auth/sso lo guarda en localStorage y redirige a /dashboard.
      //    El token va en query param — es temporal (sesión), no un secreto long-lived.
      const ssoUrl = new URL(`${DASHBOARD_FRONT_URL}/auth/sso`)
      ssoUrl.searchParams.set('token',   tokens.accessToken)
      ssoUrl.searchParams.set('refresh', tokens.refreshToken)

      setTimeout(() => {
        window.location.href = ssoUrl.toString()
      }, 300)

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al conectar con el dashboard'
      setSsoError(msg)
      setState('error')
      setTimeout(() => { setState('idle'); setSsoError(null) }, 5000)
    }
  }, [getIdToken])

  return { state, ssoError, openDashboard }
}
