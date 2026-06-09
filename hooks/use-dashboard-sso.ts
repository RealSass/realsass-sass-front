// hooks/use-dashboard-sso.ts
'use client'

import { useState, useCallback } from 'react'

const DASHBOARD_API_URL: string =
  process.env.NEXT_PUBLIC_DASHBOARD_API_URL ?? 'http://localhost:3000'

const DASHBOARD_FRONT_URL: string =
  process.env.NEXT_PUBLIC_DASHBOARD_FRONT_URL ?? 'http://localhost:3001'

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
      const firebaseToken = await getIdToken()
      if (!firebaseToken) throw new Error('No se pudo obtener el token de sesión')

      const res = await fetch(`${DASHBOARD_API_URL}/api/v1/auth/firebase-sso`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ firebaseIdToken: firebaseToken }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message ?? `Error ${res.status}`)
      }

      const json = await res.json() as {
        data?: { accessToken: string; refreshToken: string }
        accessToken?: string
        refreshToken?: string
      }
      const tokens = json.data ?? {
        accessToken:  json.accessToken,
        refreshToken: json.refreshToken,
      }

      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Respuesta inválida del servidor')
      }

      localStorage.setItem('accessToken',  tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      setState('success')
      setTimeout(() => { window.location.href = `${DASHBOARD_FRONT_URL}/dashboard` }, 500)

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al conectar con el dashboard'
      setSsoError(msg)
      setState('error')
      setTimeout(() => { setState('idle'); setSsoError(null) }, 5000)
    }
  }, [getIdToken])

  return { state, ssoError, openDashboard }
}
