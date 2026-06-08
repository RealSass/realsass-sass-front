'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, Check, Loader2, LogOut,
  ArrowRight, Copy, AlertCircle, ChevronLeft,
  Star, Plus,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { selectRole, updateMyOrganization } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import type { Organization } from '@/lib/types'

// ── tipos de vista ────────────────────────────────────────────────────────────
type View = 'overview' | 'add-role' | 'edit-org'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-4 w-56 rounded bg-muted" />
          </div>
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted" />)}
      </div>
    </div>
  )
}

// ── Back button ───────────────────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ChevronLeft className="size-4" /> Volver
    </button>
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

// ── Role Selector ─────────────────────────────────────────────────────────────
function RoleSelector({
  currentIsOwner,
  currentIsAffiliate,
  onSelected,
  onBack,
}: {
  currentIsOwner:     boolean
  currentIsAffiliate: boolean
  onSelected:         () => void
  onBack:             () => void
}) {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState<'owner' | 'affiliate' | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handle = async (role: 'owner' | 'affiliate') => {
    setLoading(role); setError(null)
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
      disabled:    currentIsOwner,
      disabledMsg: 'Ya sos Owner',
    },
    {
      role:        'affiliate' as const,
      icon:        Users,
      title:       'Afiliado',
      description: 'Referí nuevas agencias y ganá comisiones por cada cliente activo.',
      perks:       ['Código único de referido', 'Dashboard de comisiones', 'Historial'],
      accent:      'from-emerald-500/10 to-teal-500/5 border-emerald-200/50',
      disabled:    currentIsAffiliate,
      disabledMsg: 'Ya sos Afiliado',
    },
  ]

  return (
    <div>
      <BackButton onClick={onBack} />
      <div className="mb-6 text-center">
        <h2 className="font-serif text-2xl text-foreground">Activar rol</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Podés tener ambos roles activos al mismo tiempo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map(({ role, icon: Icon, title, description, perks, accent, disabled, disabledMsg }) => (
          <motion.button
            key={role}
            whileHover={disabled ? {} : { y: -2 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
            onClick={() => !disabled && handle(role)}
            disabled={!!loading || disabled}
            className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left transition-all ${accent} ${disabled ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-60'}`}
          >
            {disabled && (
              <span className="absolute top-3 right-3 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-foreground">
                {disabledMsg}
              </span>
            )}
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
            {!disabled && (
              <div className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
                Activar <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}

// ── Org Form ──────────────────────────────────────────────────────────────────
function OrgForm({
  org,
  onBack,
  onSaved,
}: {
  org:     Organization | null
  onBack:  () => void
  onSaved: () => void
}) {
  const { refreshProfile } = useAuth()
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
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
      setTimeout(() => { setSuccess(false); onSaved() }, 1200)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'name',        label: 'Nombre de la inmobiliaria *', type: 'text' },
    { key: 'description', label: 'Descripción',                 type: 'text' },
    { key: 'website',     label: 'Sitio web',                   type: 'url'  },
    { key: 'phone',       label: 'Teléfono',                    type: 'tel'  },
    { key: 'address',     label: 'Dirección',                   type: 'text' },
    { key: 'logoUrl',     label: 'URL del logo',                type: 'url'  },
  ] as const

  return (
    <div>
      <BackButton onClick={onBack} />
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="size-5 text-primary" />
          <h2 className="font-medium text-foreground">
            {org?.name ? 'Editar organización' : 'Configurá tu inmobiliaria'}
          </h2>
        </div>
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
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
        <div className="flex gap-3 pt-1">
          <button
            onClick={onBack}
            disabled={saving}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || success}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {saving  ? <><Loader2 className="size-4 animate-spin" /> Guardando...</> :
             success ? <><Check className="size-4" /> Guardado</> :
                       <><Check className="size-4" /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Overview (vista principal) ────────────────────────────────────────────────
function Overview({
  onAddRole,
  onEditOrg,
}: {
  onAddRole:  () => void
  onEditOrg:  () => void
}) {
  const { profile, firebaseUser, logout } = useAuth()
  const router = useRouter()

  if (!profile || !firebaseUser) return null

  const displayName = profile.displayName ?? firebaseUser.displayName ?? profile.email
  const initials    = (displayName ?? 'U').charAt(0).toUpperCase()
  const org         = profile.organization
  const noRole      = !profile.isOwner && !profile.isAffiliate
  const canAddRole  = !profile.isOwner || !profile.isAffiliate  // puede agregar si le falta uno

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={displayName ?? ''} className="size-16 rounded-full object-cover border-2 border-border" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-xl text-foreground truncate">{displayName}</h1>
          <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.isOwner     && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"><Building2 className="size-3" /> Owner</span>}
            {profile.isAffiliate && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"><Star className="size-3" /> Afiliado</span>}
          </div>
        </div>
      </div>

      {/* Sin rol → prompt para elegir */}
      {noRole && (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-foreground">¿Cómo querés usar la plataforma?</p>
          <p className="text-xs text-muted-foreground">Elegí tu rol para empezar</p>
          <button
            onClick={onAddRole}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="size-4" /> Elegir rol
          </button>
        </div>
      )}

      {/* Owner → organización */}
      {profile.isOwner && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <h2 className="text-sm font-medium text-foreground">Mi organización</h2>
            </div>
            <button onClick={onEditOrg} className="text-xs text-primary hover:underline">
              {org?.name ? 'Editar' : 'Completar'}
            </button>
          </div>
          {org?.name ? (
            <div className="space-y-1.5 text-sm">
              {[
                { label: 'Nombre',      value: org.name        },
                { label: 'Descripción', value: org.description },
                { label: 'Sitio web',   value: org.website     },
                { label: 'Teléfono',    value: org.phone       },
                { label: 'Dirección',   value: org.address     },
              ].filter(({ value }) => value).map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-foreground text-right truncate">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Completá los datos de tu inmobiliaria
            </p>
          )}
        </div>
      )}

      {/* Afiliado → código + stats */}
      {profile.isAffiliate && profile.affiliateCode && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-emerald-600" />
            <h2 className="text-sm font-medium text-foreground">Panel de afiliado</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Referidos</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">
                {profile.affiliateData?.referralCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">
                ${profile.affiliateData?.balance ?? '0.00'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Tu código de referido</p>
            <CopyCode code={profile.affiliateCode} />
          </div>
        </div>
      )}

      {/* Agregar rol faltante */}
      {canAddRole && !noRole && (
        <button
          onClick={onAddRole}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Plus className="size-4" />
          {!profile.isOwner ? 'Activar rol Owner' : 'Activar rol Afiliado'}
        </button>
      )}

      {/* Cerrar sesión */}
      <button
        onClick={async () => { await logout(); router.push('/') }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm text-destructive hover:bg-destructive/5 transition-all"
      >
        <LogOut className="size-4" /> Cerrar sesión
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { firebaseUser, profile, loading, busy } = useAuth()
  const [view, setView] = useState<View>('overview')

  useEffect(() => {
    if (!loading && !busy && !firebaseUser) router.push('/')
  }, [loading, busy, firebaseUser, router])

  if (loading || busy) return <ProfileSkeleton />
  if (!firebaseUser || !profile) return <ProfileSkeleton />

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {view === 'overview' && (
              <Overview
                onAddRole={() => setView('add-role')}
                onEditOrg={() => setView('edit-org')}
              />
            )}
            {view === 'add-role' && (
              <RoleSelector
                currentIsOwner={profile.isOwner}
                currentIsAffiliate={profile.isAffiliate}
                onSelected={() => setView('overview')}
                onBack={() => setView('overview')}
              />
            )}
            {view === 'edit-org' && (
              <OrgForm
                org={profile.organization ?? null}
                onBack={() => setView('overview')}
                onSaved={() => setView('overview')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
