'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, Check, Loader2, LogOut,
  ArrowRight, Copy, AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { selectRole, updateMyOrganization } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Organization } from '@/lib/types'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
          </div>
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-muted" />)}
      </div>
    </div>
  )
}

// ── Role Selector ─────────────────────────────────────────────────────────────
function RoleSelector({ onSelected }: { onSelected: () => void }) {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState<'owner' | 'affiliate' | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const handle = async (role: 'owner' | 'affiliate') => {
    setLoading(role)
    setError(null)
    try {
      await selectRole(role)
      await refreshProfile()
      onSelected()
    } catch (e: any) {
      setError(e.message ?? 'Error al seleccionar el rol')
    } finally {
      setLoading(null)
    }
  }

  const cards = [
    {
      role:        'owner' as const,
      icon:        Building2,
      title:       'Propietario / Agencia',
      description: 'Gestioná tu inmobiliaria, equipo y propiedades desde un solo lugar.',
      perks:       ['Perfil de organización', 'Gestión de colaboradores', 'Estadísticas'],
      accent:      'from-amber-500/10 to-orange-500/5 border-amber-200/50',
    },
    {
      role:        'affiliate' as const,
      icon:        Users,
      title:       'Afiliado',
      description: 'Referí nuevas agencias y ganá comisiones por cada cliente activo.',
      perks:       ['Código único de referido', 'Dashboard de comisiones', 'Historial'],
      accent:      'from-emerald-500/10 to-teal-500/5 border-emerald-200/50',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 text-center">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">
          ¿Cómo querés usar la plataforma?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Podés tener ambos roles activos al mismo tiempo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map(({ role, icon: Icon, title, description, perks, accent }) => (
          <motion.button
            key={role}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handle(role)}
            disabled={!!loading}
            className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left transition-all disabled:opacity-60 ${accent}`}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm shadow-sm">
              {loading === role
                ? <Loader2 className="size-5 animate-spin text-primary" />
                : <Icon className="size-5 text-foreground" />
              }
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <ul className="flex flex-col gap-1.5">
              {perks.map(p => (
                <li key={p} className="flex items-center gap-2 text-xs text-foreground/80">
                  <Check className="size-3.5 shrink-0 text-primary" /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
              Activar <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        ))}
      </div>
      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}

// ── Organization Form ─────────────────────────────────────────────────────────
function OrgForm({ org, onSaved }: { org: Organization | null; onSaved: () => void }) {
  const { refreshProfile } = useAuth()
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name:        org?.name        ?? '',
    description: org?.description ?? '',
    logoUrl:     org?.logoUrl     ?? '',
    website:     org?.website     ?? '',
    phone:       org?.phone       ?? '',
    address:     org?.address     ?? '',
  })

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false)
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      await updateMyOrganization(payload)
      await refreshProfile()
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onSaved() }, 1500)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'name',        label: 'Nombre de la inmobiliaria', type: 'text' },
    { key: 'description', label: 'Descripción',               type: 'text' },
    { key: 'website',     label: 'Sitio web',                 type: 'url'  },
    { key: 'phone',       label: 'Teléfono',                  type: 'tel'  },
    { key: 'address',     label: 'Dirección',                 type: 'text' },
    { key: 'logoUrl',     label: 'URL del logo',              type: 'url'  },
  ] as const

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="size-5 text-primary" />
        <h2 className="font-medium text-foreground">
          {org?.name ? 'Editar organización' : 'Configurá tu inmobiliaria'}
        </h2>
      </div>
      {fields.map(({ key, label, type }) => (
        <div key={key}>
          <label className="text-xs text-muted-foreground">{label}</label>
          <input
            type={type}
            value={form[key]}
            onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      ))}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <Check className="size-4" /> Guardado correctamente
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        {saving ? 'Guardando...' : 'Guardar organización'}
      </button>
    </div>
  )
}

// ── Copy Code ─────────────────────────────────────────────────────────────────
function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-mono font-medium text-foreground hover:bg-primary/5 transition-all"
    >
      <span>{code}</span>
      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4 text-muted-foreground" />}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { firebaseUser, profile, loading, busy, logout, refreshProfile } = useAuth()
  const [editingOrg, setEditingOrg] = useState(false)

  useEffect(() => {
    if (!loading && !busy && !firebaseUser) router.push('/')
  }, [loading, busy, firebaseUser, router])

  // Mostrar skeleton mientras carga Firebase o el backend
  if (loading || busy) return <ProfileSkeleton />
  if (!firebaseUser || !profile) return <ProfileSkeleton />

  const displayName = profile.displayName ?? firebaseUser.displayName ?? profile.email
  const initials    = (displayName ?? 'U').charAt(0).toUpperCase()
  const noRole      = !profile.isOwner && !profile.isAffiliate

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName ?? ''}
                  className="size-16 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-serif text-xl text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-1 flex gap-2">
                {profile.isOwner     && <span className="text-xs font-medium text-primary">Owner</span>}
                {profile.isAffiliate && <span className="text-xs font-medium text-emerald-600">Afiliado</span>}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Sin rol → selector */}
            {noRole && (
              <motion.div
                key="role-selector"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <RoleSelector onSelected={() => {}} />
              </motion.div>
            )}

            {/* Owner → organización */}
            {profile.isOwner && (
              <motion.div
                key="org"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                {editingOrg || !profile.organization?.name ? (
                  <OrgForm
                    org={profile.organization ?? null}
                    onSaved={() => setEditingOrg(false)}
                  />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-5 text-primary" />
                        <h2 className="font-medium text-foreground">Mi organización</h2>
                      </div>
                      <button onClick={() => setEditingOrg(true)} className="text-sm text-primary hover:underline">
                        Editar
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Nombre',      value: profile.organization?.name        },
                        { label: 'Descripción', value: profile.organization?.description },
                        { label: 'Sitio web',   value: profile.organization?.website     },
                        { label: 'Teléfono',    value: profile.organization?.phone       },
                        { label: 'Dirección',   value: profile.organization?.address     },
                      ].filter(({ value }) => value).map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Afiliado → código */}
            {profile.isAffiliate && profile.affiliateCode && (
              <motion.div
                key="affiliate"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="rounded-2xl border border-border bg-card p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-emerald-600" />
                  <h2 className="font-medium text-foreground">Panel de afiliado</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Referidos</p>
                    <p className="text-lg font-semibold text-foreground">
                      {profile.affiliateData?.referralCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${profile.affiliateData?.balance ?? '0.00'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tu código de afiliado</p>
                  <CopyCode code={profile.affiliateCode} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cerrar sesión */}
          <button
            onClick={async () => { await logout(); router.push('/') }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm text-destructive hover:bg-destructive/5"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </motion.div>
      </div>
    </div>
  )
}
