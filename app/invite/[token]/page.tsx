'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building2, Check, X, Loader2, ShieldCheck,
  AlertCircle, LogIn,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import type { InvitationInfo } from '@/lib/types'
import { acceptInvitation, getInvitationInfo } from '@/lib/api'

const PERMISSION_LABELS: Record<string, string> = {
  canViewListings:        'Ver propiedades',
  canCreateListings:      'Crear propiedades',
  canEditListings:        'Editar propiedades',
  canDeleteListings:      'Eliminar propiedades',
  canViewStats:           'Ver estadísticas',
  canManageLeads:         'Gestionar clientes',
  canManageCollaborators: 'Gestionar colaboradores',
}

export default function InvitePage() {
  const params  = useParams()
  const router  = useRouter()
  const token   = params?.token as string
  const { firebaseUser, loading: authLoading } = useAuth()

  const [info, setInfo]               = useState<InvitationInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [accepting, setAccepting]     = useState(false)
  const [accepted, setAccepted]       = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Cargar info de la invitación — ruta pública, no requiere auth
  useEffect(() => {
    if (!token) return
    setLoadingInfo(true)
    getInvitationInfo(token)
      .then(res => setInfo(res.data))
      .catch(e => setError(e.message ?? 'Invitación inválida o expirada'))
      .finally(() => setLoadingInfo(false))
  }, [token])

  const handleAccept = async () => {
    if (!firebaseUser) return
    setAccepting(true)
    setError(null)
    try {
      await acceptInvitation(token)
      setAccepted(true)
      setTimeout(() => router.push('/profile'), 2500)
    } catch (e: any) {
      setError(e.message ?? 'Error al aceptar la invitación')
    } finally {
      setAccepting(false)
    }
  }

  const activePerms = info
    ? Object.entries(info.permissions)
        .filter(([, v]) => v)
        .map(([k]) => PERMISSION_LABELS[k] ?? k)
    : []

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loadingInfo || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // ── Invitación inválida / expirada ────────────────────────────────────────────
  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-sm w-full rounded-3xl border border-border bg-card p-8 text-center shadow-xl"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
            <X className="size-7 text-destructive" />
          </div>
          <h1 className="mt-4 font-serif text-xl text-foreground">Invitación no válida</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Aceptada con éxito ────────────────────────────────────────────────────────
  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-sm w-full rounded-3xl border border-emerald-200 bg-card p-8 text-center shadow-xl"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 mx-auto">
            <Check className="size-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 font-serif text-xl text-foreground">¡Bienvenido al equipo!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ya sos colaborador de{' '}
            <strong>{info?.organization.name ?? 'la organización'}</strong>.
            Redirigiendo…
          </p>
          <Loader2 className="mt-4 size-5 animate-spin text-muted-foreground mx-auto" />
        </motion.div>
      </div>
    )
  }

  // ── Vista principal ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="mx-auto max-w-sm w-full space-y-5"
      >
        {/* Card de la org */}
        <div className="rounded-3xl border border-border bg-card p-7 shadow-xl">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            {info?.organization.logoUrl ? (
              <img
                src={info.organization.logoUrl}
                alt="Logo"
                className="size-16 rounded-2xl border border-border object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <Building2 className="size-8 text-primary" />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Invitación a colaborar
            </p>
            <h1 className="mt-2 font-serif text-2xl text-foreground">
              {info?.organization.name ?? 'Una organización'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Te invitaron a unirte como colaborador con los siguientes permisos:
            </p>
          </div>

          {/* Permisos */}
          {activePerms.length > 0 && (
            <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> Tus permisos
              </p>
              {activePerms.map(p => (
                <div key={p} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="size-3.5 shrink-0 text-primary" /> {p}
                </div>
              ))}
            </div>
          )}

          {/* Email destinatario */}
          <div className="mt-4 rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-center">
            <p className="text-xs text-muted-foreground">Invitación para</p>
            <p className="text-sm font-medium text-foreground mt-0.5">{info?.email}</p>
          </div>
        </div>

        {/* Acción según estado de auth */}
        {!firebaseUser ? (
          // No logueado → mandar a login
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Para aceptar necesitás iniciar sesión con{' '}
                <strong className="text-foreground">{info?.email}</strong>.
              </p>
            </div>
            <button
              onClick={() => router.push(`/?invite=${token}`)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
            >
              <LogIn className="size-4" /> Iniciar sesión para aceptar
            </button>
          </div>
        ) : firebaseUser.email?.toLowerCase() !== info?.email.toLowerCase() ? (
          // Logueado con cuenta incorrecta
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Cuenta incorrecta</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estás logueado como{' '}
                  <strong>{firebaseUser.email}</strong> pero la invitación es para{' '}
                  <strong>{info?.email}</strong>. Cerrá sesión y volvé a intentar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Logueado con la cuenta correcta → puede aceptar
          <div className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="size-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg shadow-primary/20"
            >
              {accepting
                ? <><Loader2 className="size-5 animate-spin" /> Aceptando…</>
                : <><Check className="size-5" /> Aceptar invitación</>
              }
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Logueado como <strong>{firebaseUser.email}</strong>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
