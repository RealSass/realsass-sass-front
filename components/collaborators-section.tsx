'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Mail, Check, X, Trash2, Loader2,
  ChevronDown, ChevronUp, Copy, Clock, ShieldCheck,
  AlertCircle, RefreshCw,
} from 'lucide-react'
import {
  listCollaborators,
  inviteCollaborator,
  updateCollaboratorPermissions,
  removeCollaborator,
} from '@/lib/api'
import type { Collaborator, CollaboratorPermissions } from '@/lib/types'

// ─── Permisos disponibles ─────────────────────────────────────────────────────

const PERMISSION_LABELS: { key: keyof CollaboratorPermissions; label: string; description: string }[] = [
  { key: 'canViewListings',        label: 'Ver propiedades',          description: 'Puede ver el listado de propiedades' },
  { key: 'canCreateListings',      label: 'Crear propiedades',        description: 'Puede agregar nuevas propiedades' },
  { key: 'canEditListings',        label: 'Editar propiedades',       description: 'Puede modificar propiedades existentes' },
  { key: 'canDeleteListings',      label: 'Eliminar propiedades',     description: 'Puede eliminar propiedades' },
  { key: 'canViewStats',           label: 'Ver estadísticas',         description: 'Acceso a analytics y reportes' },
  { key: 'canManageLeads',         label: 'Gestionar clientes',       description: 'Puede ver y gestionar leads' },
  { key: 'canManageCollaborators', label: 'Gestionar colaboradores',  description: 'Puede invitar y remover colaboradores' },
]

const DEFAULT_PERMISSIONS: CollaboratorPermissions = {
  canViewListings: true,
  canCreateListings: false,
  canEditListings: false,
  canDeleteListings: false,
  canViewStats: false,
  canManageLeads: false,
  canManageCollaborators: false,
}

// ─── Permission Toggle ─────────────────────────────────────────────────────────

function PermissionToggle({
  permKey,
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  permKey: keyof CollaboratorPermissions
  label: string
  description: string
  value: boolean
  onChange: (key: keyof CollaboratorPermissions, val: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(permKey, !value)}
      disabled={disabled}
      className={`flex items-center justify-between w-full rounded-xl border px-4 py-3 text-left transition-all ${
        value
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card hover:bg-secondary/50'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div>
        <p className={`text-sm font-medium ${value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        value ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}>
        {value && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
      </div>
    </button>
  )
}

// ─── Invite Form ───────────────────────────────────────────────────────────────

function InviteForm({ onInvited, onCancel }: { onInvited: (link: string) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('')
  const [permissions, setPermissions] = useState<CollaboratorPermissions>({ ...DEFAULT_PERMISSIONS })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePerm = (key: keyof CollaboratorPermissions, val: boolean) =>
    setPermissions(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await inviteCollaborator({ email: email.trim(), ...permissions })
      onInvited(res.data.inviteLink)
    } catch (err: any) {
      setError(err.message ?? 'Error al enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Invitar colaborador</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Generá un link de invitación para compartir</p>
        </div>
        <button type="button" onClick={onCancel}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">
          <X className="size-4" />
        </button>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Mail className="size-3.5 text-muted-foreground" /> Email del colaborador
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="colaborador@ejemplo.com"
          required
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Permisos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-muted-foreground" /> Permisos
        </p>
        <div className="space-y-2">
          {PERMISSION_LABELS.map(({ key, label, description }) => (
            <PermissionToggle
              key={key}
              permKey={key}
              label={label}
              description={description}
              value={permissions[key]}
              onChange={togglePerm}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-all">
          Cancelar
        </button>
        <button type="submit" disabled={loading || !email.trim()}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Generando…</> : <><UserPlus className="size-4" /> Generar link</>}
        </button>
      </div>
    </motion.form>
  )
}

// ─── Invite Link Result ────────────────────────────────────────────────────────

function InviteLinkResult({ link, onDone }: { link: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100">
          <Check className="size-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Link generado</p>
          <p className="text-xs text-emerald-600 mt-0.5">Válido por 7 días. Compartilo con el colaborador.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary p-3 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Link de invitación</p>
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-xs font-mono text-foreground">{link}</p>
          <button onClick={copy}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-all">
            {copied ? <><Check className="size-3.5 text-primary" /> Copiado</> : <><Copy className="size-3.5" /> Copiar</>}
          </button>
        </div>
      </div>

      <button onClick={onDone}
        className="flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
        Listo
      </button>
    </motion.div>
  )
}

// ─── Collaborator Row ─────────────────────────────────────────────────────────

function CollaboratorRow({
  collab,
  onUpdate,
  onRemove,
}: {
  collab: Collaborator
  onUpdate: (id: string, perms: Partial<CollaboratorPermissions>) => Promise<void>
  onRemove: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [permissions, setPermissions] = useState<CollaboratorPermissions>({
    canViewListings:        collab.canViewListings,
    canCreateListings:      collab.canCreateListings,
    canEditListings:        collab.canEditListings,
    canDeleteListings:      collab.canDeleteListings,
    canViewStats:           collab.canViewStats,
    canManageLeads:         collab.canManageLeads,
    canManageCollaborators: collab.canManageCollaborators,
  })
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [dirty, setDirty] = useState(false)

  const togglePerm = (key: keyof CollaboratorPermissions, val: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: val }))
    setDirty(true)
  }

  const savePerms = async () => {
    setSaving(true)
    await onUpdate(collab.id, permissions)
    setSaving(false)
    setDirty(false)
  }

  const handleRemove = async () => {
    if (!confirm(`¿Remover a ${collab.email} como colaborador?`)) return
    setRemoving(true)
    await onRemove(collab.id)
  }

  const copyInviteLink = () => {
    if (!collab.invitation?.token) return
    const link = `${window.location.origin}/invite/${collab.invitation.token}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const statusColors = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACTIVE:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    REMOVED: 'bg-secondary text-muted-foreground border-border',
  }

  const statusLabels = { PENDING: 'Pendiente', ACTIVE: 'Activo', REMOVED: 'Removido' }
  const activePermsCount = Object.values(permissions).filter(Boolean).length

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
          {collab.email.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{collab.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activePermsCount} permiso{activePermsCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[collab.status]}`}>
            {statusLabels[collab.status]}
          </span>

          {/* Copiar link si está pendiente */}
          {collab.status === 'PENDING' && collab.invitation && (
            <button onClick={copyInviteLink} title="Copiar link de invitación"
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">
              {copiedLink ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
            </button>
          )}

          <button onClick={() => setExpanded(v => !v)}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded: permisos */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permisos</p>
              <div className="space-y-2">
                {PERMISSION_LABELS.map(({ key, label, description }) => (
                  <PermissionToggle
                    key={key}
                    permKey={key}
                    label={label}
                    description={description}
                    value={permissions[key]}
                    onChange={togglePerm}
                  />
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-all"
                >
                  {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  Remover
                </button>
                {dirty && (
                  <button
                    onClick={savePerms}
                    disabled={saving}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all"
                  >
                    {saving ? <><Loader2 className="size-4 animate-spin" /> Guardando…</> : <><Check className="size-4" /> Guardar cambios</>}
                  </button>
                )}
              </div>

              {/* Info de expiración si es pendiente */}
              {collab.status === 'PENDING' && collab.invitation && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>
                    Invitación expira el{' '}
                    {new Date(collab.invitation.expiresAt).toLocaleDateString('es-AR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CollaboratorsSection() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [mode, setMode] = useState<'list' | 'invite' | 'link'>('list')
  const [generatedLink, setGeneratedLink] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const res = await listCollaborators()
      setCollaborators(res.data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar colaboradores')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleInvited = (link: string) => {
    setGeneratedLink(link)
    setMode('link')
    load()
  }

  const handleUpdate = async (id: string, perms: Partial<CollaboratorPermissions>) => {
    await updateCollaboratorPermissions(id, perms)
    await load()
  }

  const handleRemove = async (id: string) => {
    await removeCollaborator(id)
    await load()
  }

  const active  = collaborators.filter(c => c.status === 'ACTIVE')
  const pending = collaborators.filter(c => c.status === 'PENDING')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" /> Colaboradores
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {active.length} activo{active.length !== 1 ? 's' : ''}{pending.length > 0 ? ` · ${pending.length} pendiente${pending.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors">
            <RefreshCw className={`size-3.5 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
          {mode === 'list' && (
            <button onClick={() => setMode('invite')}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all">
              <UserPlus className="size-3.5" /> Invitar
            </button>
          )}
        </div>
      </div>

      {/* Formulario / Link / Lista */}
      <AnimatePresence mode="wait">
        {mode === 'invite' && (
          <motion.div key="invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InviteForm onInvited={handleInvited} onCancel={() => setMode('list')} />
          </motion.div>
        )}

        {mode === 'link' && (
          <motion.div key="link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InviteLinkResult link={generatedLink} onDone={() => setMode('list')} />
          </motion.div>
        )}

        {mode === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="size-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center">
                <Users className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-foreground">Sin colaboradores todavía</p>
                <p className="mt-1 text-xs text-muted-foreground">Invitá a tu equipo para trabajar juntos.</p>
                <button onClick={() => setMode('invite')}
                  className="mt-4 flex items-center gap-2 mx-auto h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
                  <UserPlus className="size-3.5" /> Invitar primer colaborador
                </button>
              </div>
            ) : (
              collaborators.map(c => (
                <CollaboratorRow
                  key={c.id}
                  collab={c}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
