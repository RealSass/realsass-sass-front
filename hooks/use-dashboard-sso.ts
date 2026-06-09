// hooks/use-dashboard-sso.ts
// Maneja el flujo SSO desde real-front hacia dashboard-front.
//
// Flujo completo:
//   1. Obtiene el Firebase ID token del usuario autenticado
//   2. Hace POST al dashboard-back /api/v1/auth/firebase-sso
//   3. Guarda accessToken + refreshToken en localStorage
//      (el dashboard-front los lee al iniciar — no hay que hacer nada más allá)
//   4. Redirige a dashboard-front/dashboard
'use client'

import { useState, useCallback } from 'react'

// ── Variables de entorno ───────────────────────────────────────────────────
// NEXT_PUBLIC_DASHBOARD_API_URL   = URL del dashboard-back (ej: http://localhost:3001)
// NEXT_PUBLIC_DASHBOARD_FRONT_URL = URL del dashboard-front (ej: http://localhost:3002)

const DASHBOARD_API_URL: string =
  process.env.NEXT_PUBLIC_DASHBOARD_API_URL ??
  'http://localhost:3001'

const DASHBOARD_FRONT_URL: string =
  process.env.NEXT_PUBLIC_DASHBOARD_FRONT_URL ??
  'http://localhost:3002'

export type SsoState = 'idle' | 'loading' | 'success' | 'error'

export interface UseDashboardSSOReturn {
  state:         SsoState
  errorMessage:  string | null
  openDashboard: () => Promise<void>
}

/**
 * @param getIdToken  Función que devuelve el Firebase ID token del usuario.
 *                    Típicamente: () => firebaseUser?.getIdToken() ?? Promise.resolve(null)
 */
export function useDashboardSSO(
  getIdToken: () => Promise<string | null | undefined>,
): UseDashboardSSOReturn {
  const [state,        setState]        = useState<SsoState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const openDashboard = useCallback(async () => {
    setState('loading')
    setErrorMessage(null)

    try {
      // 1. Obtener Firebase ID token
      const firebaseToken = await getIdToken()
      if (!firebaseToken) {
        throw new Error('No se pudo obtener el token de sesión. Intentá recargar la página.')
      }

      // 2. Intercambiar Firebase token por JWT del dashboard
      const res = await fetch(
        `${DASHBOARD_API_URL}/api/v1/auth/firebase-sso`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ firebaseIdToken: firebaseToken }),
        },
      )

      if (!res.ok) {
        let errorMsg = `Error ${res.status}`
        try {
          const body = await res.json() as { message?: string; error?: string }
          errorMsg = body.message ?? body.error ?? errorMsg
        } catch {
          // ignorar si el body no es JSON
        }
        throw new Error(errorMsg)
      }

      const json = await res.json() as {
        data?: { accessToken: string; refreshToken: string }
        accessToken?: string
        refreshToken?: string
      }

      // Soporta tanto { data: { ... } } como { accessToken, refreshToken } directos
      const tokens = json.data ?? { accessToken: json.accessToken, refreshToken: json.refreshToken }

      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Respuesta inválida del servidor de autenticación')
      }

      // 3. Guardar en localStorage — el dashboard-front los lee al montar AuthProvider
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken',  tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
      }

      setState('success')

      // 4. Redirigir al dashboard (pequeño delay para mostrar feedback visual)
      setTimeout(() => {
        window.location.href = `${DASHBOARD_FRONT_URL}/dashboard`
      }, 500)

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido al conectar con el dashboard'
      setErrorMessage(msg)
      setState('error')
      // Auto-reset después de 5 segundos
      setTimeout(() => { setState('idle'); setErrorMessage(null) }, 5000)
    }
  }, [getIdToken])

  return { state, errorMessage, openDashboard }
}
