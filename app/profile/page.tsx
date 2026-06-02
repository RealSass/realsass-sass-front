'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Camera, Check, Loader2, LogOut, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { updateMyOrganization } from '@/lib/api'
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router   = useRouter()
  const { firebaseUser, profile, loading, logout, refreshProfile } = useAuth()

  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const org = profile?.organization

  const [form, setForm] = useState<Partial<Organization>>({
    name:        org?.name        ?? '',
    description: org?.description ?? '',
    logoUrl:     org?.logoUrl     ?? '',
    website:     org?.website     ?? '',
    phone:       org?.phone       ?? '',
    address:     org?.address     ?? '',
  })

  // Sincronizar form cuando el perfil cargue
  useEffect(() => {
    if (org) {
      setForm({
        name:        org.name        ?? '',
        description: org.description ?? '',
        logoUrl:     org.logoUrl     ?? '',
        website:     org.website     ?? '',
        phone:       org.phone       ?? '',
        address:     org.address     ?? '',
      })
    }
  }, [org])

  // Redirect si no está autenticado después de cargar
  useEffect(() => {
    if (!loading && !firebaseUser) router.push('/')
  }, [loading, firebaseUser, router])

  if (loading) return <ProfileSkeleton />
  if (!firebaseUser || !profile) return <ProfileSkeleton />

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateMyOrganization(form)
      await refreshProfile()
      setSaveSuccess(true)
      setEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const displayName = profile.displayName ?? firebaseUser.displayName ?? profile.email
  const initials    = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header: avatar + nombre */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
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
                {profile.isOwner    && <span className="text-xs font-medium text-primary">Owner</span>}
                {profile.isAffiliate && <span className="text-xs font-medium text-accent-foreground">Afiliado</span>}
              </div>
            </div>
          </div>

          {/* Organización */}
          {profile.isOwner && org && (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-primary" />
                  <h2 className="font-medium text-foreground">Mi organización</h2>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  {[
                    { key: 'name',        label: 'Nombre',      type: 'text'  },
                    { key: 'description', label: 'Descripción', type: 'text'  },
                    { key: 'website',     label: 'Sitio web',   type: 'url'   },
                    { key: 'phone',       label: 'Teléfono',    type: 'tel'   },
                    { key: 'address',     label: 'Dirección',   type: 'text'  },
                    { key: 'logoUrl',     label: 'URL del logo', type: 'url'  },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="text-xs text-muted-foreground">{label}</label>
                      <input
                        type={type}
                        value={(form as Record<string, string>)[key] ?? ''}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  ))}

                  {/* Error de guardado */}
                  {saveError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="size-4 shrink-0" />
                      {saveError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setSaveError(null) }}
                      disabled={saving}
                      className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted-foreground hover:bg-muted disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Nombre',     value: org.name        },
                    { label: 'Descripción', value: org.description },
                    { label: 'Sitio web',  value: org.website     },
                    { label: 'Teléfono',   value: org.phone       },
                    { label: 'Dirección',  value: org.address     },
                  ]
                    .filter(({ value }) => value)
                    .map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  {!org.name && (
                    <p className="text-muted-foreground italic">
                      Completá el perfil de tu organización
                    </p>
                  )}
                </div>
              )}

              {/* Éxito de guardado */}
              {saveSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  <Check className="size-4" />
                  Organización actualizada
                </div>
              )}
            </div>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={async () => { await logout(); router.push('/') }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm text-destructive hover:bg-destructive/5"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </motion.div>
      </div>
    </div>
  )
}
