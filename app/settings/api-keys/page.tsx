'use client'
 
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Copy, Check, Eye, EyeOff, Trash2,
  Pencil, Loader2, Key, Zap, ShieldCheck, AlertTriangle,
  X, ChevronRight, Lock,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
 
// ─── Types ─────────────────────────────────────────────────────────────────────
 
type KeyType = 'api_key' | 'integration_token'
 
type KeyPermission = 'read' | 'write' | 'admin'
 
interface SensitiveKey {
  id: string
  name: string
  description?: string
  type: KeyType
  permissions: KeyPermission[]
  prefix: string          // e.g. "pk_live_"
  maskedValue: string     // e.g. "pk_live_••••••••••••••••3f9a"
  fullValue?: string      // only set temporarily after creation
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
}
 
// ─── Mock data (replace with real API calls) ───────────────────────────────────
 
const MOCK_KEYS: SensitiveKey[] = [
  {
    id: 'key_1',
    name: 'Producción principal',
    description: 'Usada por el servidor de producción',
    type: 'api_key',
    permissions: ['read', 'write'],
    prefix: 'pk_live_',
    maskedValue: 'pk_live_••••••••••••••••3f9a',
    createdAt: '2025-11-10T14:22:00Z',
    lastUsedAt: '2026-03-18T09:11:00Z',
  },
  {
    id: 'key_2',
    name: 'CI / Testing',
    description: 'Integración continua en GitHub Actions',
    type: 'api_key',
    permissions: ['read'],
    prefix: 'pk_test_',
    maskedValue: 'pk_test_••••••••••••••••c12b',
    createdAt: '2025-12-01T08:00:00Z',
    lastUsedAt: '2026-03-17T22:48:00Z',
  },
  {
    id: 'tok_1',
    name: 'Integración Zapier',
    type: 'integration_token',
    permissions: ['read', 'write'],
    prefix: 'tok_',
    maskedValue: 'tok_••••••••••••••••••••a77d',
    createdAt: '2026-01-15T11:30:00Z',
  },
]
 
// ─── Helpers ───────────────────────────────────────────────────────────────────
 
const TYPE_META: Record<KeyType, { label: string; icon: any; color: string }> = {
  api_key:           { label: 'API key',             icon: Key,  color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-900/50' },
  integration_token: { label: 'Token de integración', icon: Zap,  color: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/40 dark:border-purple-900/50' },
}
 
const PERM_LABELS: Record<KeyPermission, string> = {
  read:  'Lectura',
  write: 'Escritura',
  admin: 'Administrador',
}
 
function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}
 
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'hace menos de 1h'
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d}d`
  return formatDate(iso)
}
 
// ─── Copy Button ───────────────────────────────────────────────────────────────
 
function CopyBtn({ value, size = 'sm' }: { value: string; size?: 'sm' | 'xs' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="Copiar"
      className={`flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:bg-secondary hover:text-foreground ${size === 'xs' ? 'size-7' : 'size-8'}`}
    >
      {copied
        ? <Check className={size === 'xs' ? 'size-3 text-primary' : 'size-3.5 text-primary'} />
        : <Copy className={size === 'xs' ? 'size-3' : 'size-3.5'} />
      }
    </button>
  )
}
 
// ─── Permission Badge ──────────────────────────────────────────────────────────
 
function PermBadge({ perm }: { perm: KeyPermission }) {
  const styles: Record<KeyPermission, string> = {
    read:  'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400',
    write: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400',
    admin: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[perm]}`}>
      {PERM_LABELS[perm]}
    </span>
  )
}
 
// ─── Reveal value inline ───────────────────────────────────────────────────────
 
function RevealValue({ masked, full }: { masked: string; full?: string }) {
  const [revealed, setRevealed] = useState(false)
  const display = revealed && full ? full : masked
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 rounded-lg border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground tracking-wide truncate">
        {display}
      </code>
      {full && (
        <button
          onClick={() => setRevealed(v => !v)}
          title={revealed ? 'Ocultar' : 'Mostrar'}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        >
          {revealed
            ? <EyeOff className="size-3.5" />
            : <Eye     className="size-3.5" />
          }
        </button>
      )}
      <CopyBtn value={full ?? masked} size="xs" />
    </div>
  )
}
 
// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
 
function DeleteModal({ keyItem, onClose, onConfirm }: {
  keyItem: SensitiveKey
  onClose: () => void
  onConfirm: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [typed,   setTyped]   = useState('')
  const target = keyItem.name
 
  const handleConfirm = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // replace with real API
    onConfirm()
  }
 
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1,    y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 mb-4">
          <Trash2 className="size-5 text-destructive" />
        </div>
        <h3 className="font-semibold text-foreground">Revocar credencial</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Esta acción es <strong className="text-foreground">irreversible</strong>. Cualquier aplicación que use esta key dejará de funcionar de inmediato.
        </p>
        <div className="mt-4 space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Escribí <span className="font-medium text-foreground">{target}</span> para confirmar
          </label>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder={target}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-2 focus:ring-destructive/20 transition-all"
          />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={typed !== target || loading}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading
              ? <Loader2 className="size-4 animate-spin" />
              : <><Trash2 className="size-3.5" /> Revocar</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
 
// ─── Edit Drawer ───────────────────────────────────────────────────────────────
 
const ALL_PERMS: KeyPermission[] = ['read', 'write', 'admin']
 
function EditDrawer({ keyItem, onClose, onSaved }: {
  keyItem: SensitiveKey
  onClose: () => void
  onSaved: (updated: Partial<SensitiveKey>) => void
}) {
  const [name,        setName]        = useState(keyItem.name)
  const [description, setDescription] = useState(keyItem.description ?? '')
  const [permissions, setPermissions] = useState<KeyPermission[]>(keyItem.permissions)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
 
  const togglePerm = (p: KeyPermission) =>
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
 
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('El nombre es obligatorio')
    if (permissions.length === 0) return setError('Seleccioná al menos un permiso')
    setSaving(true)
    setError(null)
    await new Promise(r => setTimeout(r, 700)) // replace with real API
    onSaved({ name: name.trim(), description: description.trim(), permissions })
  }
 
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.form
        onSubmit={handleSave}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Editar credencial</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Actualizá nombre, descripción o permisos</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
 
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nombre</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder="Ej: Servidor de producción"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
 
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Para qué se usa esta key"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
 
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Permisos</label>
          <div className="flex gap-2 flex-wrap">
            {ALL_PERMS.map(p => (
              <button
                key={p} type="button" onClick={() => togglePerm(p)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  permissions.includes(p)
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                }`}
              >
                {permissions.includes(p) && <Check className="size-3" />}
                {PERM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
 
        {error && <p className="text-sm text-destructive">{error}</p>}
 
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-all"
          >
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <>Guardar <ArrowLeft className="size-3.5 rotate-180" /></>}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}
 
// ─── Create Key Modal ──────────────────────────────────────────────────────────
 
function CreateKeyModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (key: SensitiveKey) => void
}) {
  const [step,        setStep]        = useState<'form' | 'reveal'>('form')
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [type,        setType]        = useState<KeyType>('api_key')
  const [permissions, setPermissions] = useState<KeyPermission[]>(['read'])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [newKey,      setNewKey]      = useState<SensitiveKey | null>(null)
 
  const togglePerm = (p: KeyPermission) =>
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
 
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('El nombre es obligatorio')
    if (permissions.length === 0) return setError('Seleccioná al menos un permiso')
    setLoading(true)
    setError(null)
    await new Promise(r => setTimeout(r, 900)) // replace with real API
 
    // Mock: generate a fake key value
    const prefix    = type === 'api_key' ? 'pk_live_' : 'tok_'
    const raw       = prefix + Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')
    const created: SensitiveKey = {
      id:          'key_' + Date.now(),
      name:        name.trim(),
      description: description.trim() || undefined,
      type,
      permissions,
      prefix,
      maskedValue: prefix + '•'.repeat(16) + raw.slice(-4),
      fullValue:   raw,
      createdAt:   new Date().toISOString(),
    }
    setNewKey(created)
    setStep('reveal')
    setLoading(false)
  }
 
  const handleDone = () => {
    if (newKey) onCreate(newKey)
    onClose()
  }
 
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && step !== 'reveal') onClose() }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <AnimatePresence mode="wait">
 
          {/* ── Step 1: Form ── */}
          {step === 'form' && (
            <motion.form
              key="form"
              onSubmit={handleCreate}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Nueva credencial</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Configurá nombre, tipo y permisos</p>
                </div>
                <button type="button" onClick={onClose}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
 
              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(TYPE_META) as [KeyType, typeof TYPE_META[KeyType]][]).map(([t, meta]) => {
                    const Icon = meta.icon
                    return (
                      <button
                        key={t} type="button" onClick={() => setType(t)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                          type === t
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        <Icon className="size-4 shrink-0" /> {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>
 
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: Servidor de producción"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
 
              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Para qué se va a usar"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
 
              {/* Permisos */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Permisos</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_PERMS.map(p => (
                    <button
                      key={p} type="button" onClick={() => togglePerm(p)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        permissions.includes(p)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {permissions.includes(p) && <Check className="size-3" />}
                      {PERM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
 
              {error && <p className="text-sm text-destructive">{error}</p>}
 
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-all"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
                >
                  {loading
                    ? <Loader2 className="size-4 animate-spin" />
                    : <><Plus className="size-4" /> Crear credencial</>
                  }
                </button>
              </div>
            </motion.form>
          )}
 
          {/* ── Step 2: Reveal ── */}
          {step === 'reveal' && newKey && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
 
              <div>
                <h3 className="font-semibold text-foreground">Credencial creada</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Copiá el valor ahora. <strong className="text-foreground">No volvés a verlo completo</strong> una vez que cerrés este modal.
                </p>
              </div>
 
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tu nueva key</p>
                <RevealValue masked={newKey.maskedValue} full={newKey.fullValue} />
              </div>
 
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                  Guardala en un lugar seguro. Tratala como una contraseña — nunca la compartas ni la expongas en código fuente.
                </p>
              </div>
 
              <button
                onClick={handleDone}
                className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Listo, la guardé <Check className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
 
// ─── Key Card ──────────────────────────────────────────────────────────────────
 
function KeyCard({
  item,
  onEdit,
  onDelete,
}: {
  item: SensitiveKey
  onEdit:   (item: SensitiveKey) => void
  onDelete: (item: SensitiveKey) => void
}) {
  const meta = TYPE_META[item.type]
  const Icon = meta.icon
 
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{item.name}</p>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          {item.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
          )}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(item)}
            title="Editar"
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(item)}
            title="Revocar"
            className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
 
      {/* Value */}
      <RevealValue masked={item.maskedValue} full={item.fullValue} />
 
      {/* Permissions + meta */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.permissions.map(p => <PermBadge key={p} perm={p} />)}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>Creada {formatDate(item.createdAt)}</span>
          {item.lastUsedAt && <span>· Usada {relativeTime(item.lastUsedAt)}</span>}
        </div>
      </div>
    </motion.div>
  )
}
 
// ─── Page ──────────────────────────────────────────────────────────────────────
 
export default function ApiKeysPage() {
  const router  = useRouter()
  const { profile, loading, firebaseUser } = useAuth()
 
  const [keys,         setKeys]         = useState<SensitiveKey[]>(MOCK_KEYS)
  const [showCreate,   setShowCreate]   = useState(false)
  const [editTarget,   setEditTarget]   = useState<SensitiveKey | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SensitiveKey | null>(null)
 
  // Filter by type for tabs
  const [tab, setTab] = useState<'all' | KeyType>('all')
  const filtered = tab === 'all' ? keys : keys.filter(k => k.type === tab)
 
  if (!loading && !firebaseUser) {
    router.replace('/')
    return null
  }
 
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
 
  const handleCreate = (key: SensitiveKey) => setKeys(prev => [key, ...prev])
 
  const handleSaveEdit = (updated: Partial<SensitiveKey>) => {
    if (!editTarget) return
    setKeys(prev => prev.map(k => k.id === editTarget.id ? { ...k, ...updated } : k))
    setEditTarget(null)
  }
 
  const handleDelete = () => {
    if (!deleteTarget) return
    setKeys(prev => prev.filter(k => k.id !== deleteTarget.id))
    setDeleteTarget(null)
  }
 
  const tabs: { id: 'all' | KeyType; label: string; count: number }[] = [
    { id: 'all',               label: 'Todas',                count: keys.length },
    { id: 'api_key',           label: 'API keys',             count: keys.filter(k => k.type === 'api_key').length },
    { id: 'integration_token', label: 'Tokens de integración', count: keys.filter(k => k.type === 'integration_token').length },
  ]
 
  return (
    <>
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
 
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="mb-8"
          >
            <button
              onClick={() => router.back()}
              className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> Volver
            </button>
 
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Lock className="size-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl text-foreground md:text-3xl">Datos sensibles</h1>
                  <p className="text-sm text-muted-foreground">API keys y tokens de integración</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex shrink-0 items-center gap-2 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Plus className="size-4" /> Nueva
              </button>
            </div>
          </motion.div>
 
          {/* ── Warning banner ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 300, damping: 28 }}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-900/50 dark:bg-amber-950/20"
          >
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              Tratá estas credenciales como contraseñas. No las expongas en código fuente, logs ni repositorios públicos.
            </p>
          </motion.div>
 
          {/* ── Tabs ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex gap-1 rounded-xl border border-border bg-secondary/50 p-1"
          >
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === t.id ? 'bg-primary/10 text-primary' : 'bg-border text-muted-foreground'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
 
          {/* ── Key list ── */}
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-12 text-center"
              >
                <Key className="mx-auto size-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">No hay credenciales en esta categoría</p>
                <p className="mt-1 text-xs text-muted-foreground">Creá una nueva con el botón de arriba</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-5 inline-flex items-center gap-2 h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
                >
                  <Plus className="size-3.5" /> Nueva credencial
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filtered.map(item => (
                  <KeyCard
                    key={item.id}
                    item={item}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
 
        </div>
      </main>
 
      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateKeyModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
        {editTarget && (
          <EditDrawer
            keyItem={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={handleSaveEdit}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            keyItem={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  )
}
 