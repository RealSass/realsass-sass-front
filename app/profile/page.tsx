'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, Check, ChevronRight, Copy,
  Globe, Phone, MapPin, FileText, ImageIcon, Loader2,
  TrendingUp, UserCheck, Star, ArrowRight, Pencil, X,
  ExternalLink, Lock,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { selectRole, updateMyOrganization } from '@/lib/api'
import type { Organization } from '@/lib/types'
import { CollaboratorsSection } from '@/components/collaborators-section'

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 }

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── Copy Code ────────────────────────────────────────────────────────────────

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-mono font-medium text-foreground transition-all hover:bg-primary/5 hover:border-primary/30"
    >
      <span>{code}</span>
      {copied
        ? <Check className="size-4 text-primary" />
        : <Copy className="size-4 text-muted-foreground" />
      }
    </button>
  )
}

// ─── Role Selector ────────────────────────────────────────────────────────────

function RoleSelector({ onRoleSelected }: { onRoleSelected: () => void }) {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState<'owner' | 'affiliate' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = async (role: 'owner' | 'affiliate') => {
    setLoading(role)
    setError(null)
    try {
      await selectRole(role)
      await refreshProfile()
      onRoleSelected()
    } catch (e: any) {
      setError(e.message ?? 'Error al seleccionar el rol')
    } finally {
      setLoading(null)
    }
  }

  const cards = [
    {
      role: 'owner' as const,
      icon: Building2,
      title: 'Propietario / Agencia',
      description: 'Gestioná tus propiedades, publicaciones y equipo desde un solo lugar.',
      perks: ['Panel de propiedades', 'Perfil de organización', 'Estadísticas de visitas'],
      accent: 'from-amber-500/10 to-orange-500/5 border-amber-200/50',
    },
    {
      role: 'affiliate' as const,
      icon: Users,
      title: 'Afiliado',
      description: 'Referí nuevas agencias y ganá comisiones por cada cliente que sumés.',
      perks: ['Código de referido único', 'Dashboard de comisiones', 'Historial de referidos'],
      accent: 'from-emerald-500/10 to-teal-500/5 border-emerald-200/50',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="font-serif text-2xl text-foreground md:text-3xl">¿Cómo querés usar Propiedad?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Podés tener ambos roles activos al mismo tiempo.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map(({ role, icon: Icon, title, description, perks, accent }) => (
          <motion.button
            key={role}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(role)}
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
              Activar <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        ))}
      </div>
      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}

// ─── Organization Edit Form ───────────────────────────────────────────────────

function OrganizationEditForm({
  org,
  onCancel,
  onSaved,
}: {
  org: Organization | null
  onCancel: () => void
  onSaved: () => void
}) {
  const { refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name:        org?.name        ?? '',
    description: org?.description ?? '',
    logoUrl:     org?.logoUrl     ?? '',
    website:     org?.website     ?? '',
    phone:       org?.phone       ?? '',
    address:     org?.address     ?? '',
  })

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '')
      )
      await updateMyOrganization(payload)
      await refreshProfile()
      onSaved()
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'name'        as const, label: 'Nombre',       icon: Building2, placeholder: 'Ej: Inmobiliaria San Martín',       type: 'input'    },
    { key: 'description' as const, label: 'Descripción',  icon: FileText,  placeholder: 'Contá brevemente a qué se dedican', type: 'textarea' },
    { key: 'logoUrl'     as const, label: 'URL del logo', icon: ImageIcon, placeholder: 'https://...',                        type: 'input'    },
    { key: 'website'     as const, label: 'Sitio web',    icon: Globe,     placeholder: 'https://miinmobiliaria.com',         type: 'input'    },
    { key: 'phone'       as const, label: 'Teléfono',     icon: Phone,     placeholder: '+54 11 1234-5678',                   type: 'input'    },
    { key: 'address'     as const, label: 'Dirección',    icon: MapPin,    placeholder: 'Av. Corrientes 1234, CABA',          type: 'input'    },
  ]

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Editar organización</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Todos los campos son opcionales</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-4">
        {fields.map(({ key, label, icon: Icon, placeholder, type }) => (
          <div key={key} className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Icon className="size-3.5 text-muted-foreground" /> {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            ) : (
              <input
                type="text"
                value={form[key]}
                onChange={set(key)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {saving
            ? <><Loader2 className="size-4 animate-spin" /> Guardando…</>
            : <>Guardar <ArrowRight className="size-4" /></>
          }
        </button>
      </div>
    </form>
  )
}

// ─── Organization Profile View ────────────────────────────────────────────────

function OrganizationProfile({ org }: { org: Organization | null }) {
  const [editing, setEditing] = useState(false)
  const isEmpty = !org?.name && !org?.description && !org?.website && !org?.phone && !org?.address

  if (editing) {
    return (
      <motion.div
        key="edit"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
        <OrganizationEditForm
          org={org}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      key="view"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {org?.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name ?? 'Logo'}
              className="size-16 rounded-2xl border border-border object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary">
              <Building2 className="size-7 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-xl text-foreground truncate">
            {org?.name ?? 'Sin nombre aún'}
          </h2>
          {org?.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {org.description}
            </p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <Pencil className="size-3" /> Editar
        </button>
      </div>

      {/* Contacto */}
      {!isEmpty ? (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {org?.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors group"
            >
              <Globe className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{org.website}</span>
              <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          )}
          {org?.phone && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-foreground">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span>{org.phone}</span>
            </div>
          )}
          {org?.address && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-foreground">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1">{org.address}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center">
          <Building2 className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">Tu organización está lista</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Completá el perfil para que tus clientes puedan encontrarte.
          </p>
          <button
            onClick={() => setEditing(true)}
            className="mt-4 flex items-center gap-2 mx-auto h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            <Pencil className="size-3.5" /> Completar perfil
          </button>
        </div>
      )}

      {/* Colaboradores */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <CollaboratorsSection />
      </div>
      
      <SensitiveDataCard/>

    </motion.div>
  )
}

// ─── Affiliate Dashboard ──────────────────────────────────────────────────────

function AffiliateDashboard({ affiliateCode, balance, referralCount }: {
  affiliateCode: string
  balance: string
  referralCount: number
}) {
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${affiliateCode}`
    : `https://propiedad.app/?ref=${affiliateCode}`

  const [copiedLink, setCopiedLink] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Panel de afiliado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compartí tu código y ganá por cada referido que se convierte.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Balance acumulado" value={`$${balance}`} />
        <StatCard icon={UserCheck}  label="Referidos activos" value={referralCount} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">Tu código de afiliado</p>
        <CopyCode code={affiliateCode} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">Link de referido</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground font-mono">
            {referralLink}
          </p>
          <button
            onClick={copyLink}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-all hover:bg-secondary"
          >
            {copiedLink
              ? <><Check className="size-4 text-primary" /> Copiado</>
              : <><Copy className="size-4" /> Copiar</>
            }
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Compartí este link. Cuando alguien se registre con él, se contará como tu referido.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'organization' | 'affiliate'

export default function ProfilePage() {
  const router = useRouter()
  const { profile, loading, firebaseUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // No autenticado
  if (!loading && !firebaseUser) {
    router.replace('/')
    return null
  }

  // Cargando Firebase
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Firebase ok pero el backend no respondió
  if (firebaseUser && !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No se pudo cargar tu perfil</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Verificá que el backend esté corriendo en{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">
              {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}
            </code>
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const hasOwner     = profile?.isOwner
  const hasAffiliate = profile?.isAffiliate
  const hasAnyRole   = hasOwner || hasAffiliate

  const tabs = [
    { id: 'overview'     as Tab, label: 'Resumen'      },
    ...(hasOwner     ? [{ id: 'organization' as Tab, label: 'Organización' }] : []),
    ...(hasAffiliate ? [{ id: 'affiliate'    as Tab, label: 'Afiliado'     }] : []),
  ]

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mb-8 flex items-center gap-4"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
            {profile?.email?.slice(0, 2).toUpperCase() ?? 'U'}
          </div>
          <div>
            <h1 className="font-serif text-2xl text-foreground md:text-3xl">Mi cuenta</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        {hasAnyRole && (
          <div className="mb-8 flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* OVERVIEW */}
            {(activeTab === 'overview' || !hasAnyRole) && (
              <div className="space-y-6">
                {hasAnyRole && (
                  <div className="flex flex-wrap gap-2">
                    {hasOwner && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        <Building2 className="size-3" /> Propietario
                      </span>
                    )}
                    {hasAffiliate && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Star className="size-3" /> Afiliado · {profile?.affiliateCode}
                      </span>
                    )}
                  </div>
                )}

                {!hasAnyRole && (
                  <RoleSelector onRoleSelected={() => setActiveTab('overview')} />
                )}

                {hasAnyRole && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {hasOwner && (
                      <button
                        onClick={() => setActiveTab('organization')}
                        className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                          <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {profile?.organization?.name ?? 'Completar organización'}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {profile?.organization?.name ? 'Ver y editar perfil' : 'Nombre, logo, contacto…'}
                          </p>
                        </div>
                        <ChevronRight className="mt-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                    {hasAffiliate && (
                      <button
                        onClick={() => setActiveTab('affiliate')}
                        className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                          <Users className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Panel de afiliado</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {profile?.affiliateData?.referralCount ?? 0} referidos · ${profile?.affiliateData?.balance ?? '0.00'}
                          </p>
                        </div>
                        <ChevronRight className="mt-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>
                )}

                {hasAnyRole && !(hasOwner && hasAffiliate) && (
                  <div className="mt-2">
                    <p className="mb-3 text-sm text-muted-foreground">¿También querés activar otro rol?</p>
                    <RoleSelector onRoleSelected={() => setActiveTab('overview')} />
                  </div>
                )}
              </div>
            )}

            {/* ORGANIZATION */}
            {activeTab === 'organization' && hasOwner && (
              <OrganizationProfile org={profile?.organization ?? null} />
            )}

            {/* AFFILIATE */}
            {activeTab === 'affiliate' && hasAffiliate && profile?.affiliateCode && (
              <AffiliateDashboard
                affiliateCode={profile.affiliateCode}
                balance={profile.affiliateData?.balance ?? '0.00'}
                referralCount={profile.affiliateData?.referralCount ?? 0}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}

// ─── Sensitive Data Card ──────────────────────────────────────────────────────

function SensitiveDataCard() {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
          <Lock className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Datos sensibles y API keys</p>
          <p className="text-xs text-muted-foreground">Claves de acceso, tokens y credenciales</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2.5 dark:border-yellow-900/50 dark:bg-yellow-950/30">
        <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-500" />
        <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed">
          Nunca compartas tus API keys. Tratá esta página como si fuera una contraseña.
        </p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {['API keys de tu cuenta', 'Webhooks y secretos', 'Tokens de integración'].map(item => (
          <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <button
        onClick={() => router.push('/settings/api-keys')}
        className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Lock className="size-3.5" />
        Ir a datos sensibles
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  )
}