// lib/api.ts
// ─── Cliente HTTP base + endpoints de Auth, Users, Organizations, Affiliates ──
import { getIdToken } from '@/lib/firebase'
import type {
  UserProfile,
  Organization,
  AffiliateReferral,
  Collaborator,
  InvitationInfo,
  InviteCollaboratorPayload,
  CollaboratorPermissions,
} from '@/lib/types'

 
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/** Petición autenticada — adjunta el Bearer token de Firebase */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getIdToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error?.message ?? `Error ${res.status}`)
  }

  return res.json() as Promise<T>
}

/** Petición pública — sin token (para rutas como GET /invitations/:token) */
export async function apiFetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error?.message ?? `Error ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** POST /auth/sync — sincroniza el usuario con la DB.
 *  Pasar refCode si viene de un link de afiliado (?ref=). */
export async function syncUser(refCode?: string) {
  const qs = refCode ? `?ref=${encodeURIComponent(refCode)}` : ''
  return apiFetch<{ success: boolean; isNew: boolean; data: UserProfile }>(
    `/auth/sync${qs}`,
    { method: 'POST' },
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────

/** GET /users/me */
export async function getMe() {
  return apiFetch<{ success: boolean; data: UserProfile }>('/users/me')
}

/** PATCH /users/select-role */
export async function selectRole(role: 'owner' | 'affiliate') {
  return apiFetch<{ success: boolean; message: string; data: UserProfile }>(
    '/users/select-role',
    { method: 'PATCH', body: JSON.stringify({ role }) },
  )
}

// ─── Organizations ────────────────────────────────────────────────────────────

/** GET /organizations/me */
export async function getMyOrganization() {
  return apiFetch<{ success: boolean; data: Organization }>('/organizations/me')
}

/** PATCH /organizations/me */
export async function updateMyOrganization(
  data: Partial<Omit<Organization, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
) {
  return apiFetch<{ success: boolean; message: string; data: Organization }>(
    '/organizations/me',
    { method: 'PATCH', body: JSON.stringify(data) },
  )
}

// ─── Affiliates ───────────────────────────────────────────────────────────────

/** GET /affiliates/me */
export async function getMyAffiliateProfile() {
  return apiFetch<{
    success: boolean
    data: {
      affiliateCode: string
      balance: string
      referralCount: number
      createdAt: string
    }
  }>('/affiliates/me')
}

/** GET /affiliates/me/referrals */
export async function getMyReferrals() {
  return apiFetch<{
    success: boolean
    data: {
      affiliateCode: string
      total: number
      referrals: AffiliateReferral[]
    }
  }>('/affiliates/me/referrals')
}
 
// ─── Collaborators (owner) ────────────────────────────────────────────────────
 
/** GET /organizations/me/collaborators */
export async function listCollaborators() {
  return apiFetch<{ success: boolean; data: Collaborator[] }>(
    '/organizations/me/collaborators',
  )
}
 
/** POST /organizations/me/collaborators — invita por email y genera link */
export async function inviteCollaborator(payload: InviteCollaboratorPayload) {
  return apiFetch<{
    success: boolean
    message: string
    data: {
      collaborator: Collaborator
      inviteLink: string
      expiresAt: string
    }
  }>('/organizations/me/collaborators', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
 
/** PATCH /organizations/me/collaborators/:id — actualiza permisos */
export async function updateCollaboratorPermissions(
  collaboratorId: string,
  permissions: Partial<CollaboratorPermissions>,
) {
  return apiFetch<{ success: boolean; message: string; data: Collaborator }>(
    `/organizations/me/collaborators/${collaboratorId}`,
    { method: 'PATCH', body: JSON.stringify(permissions) },
  )
}
 
/** DELETE /organizations/me/collaborators/:id — remueve colaborador */
export async function removeCollaborator(collaboratorId: string) {
  return apiFetch<{ success: boolean; message: string }>(
    `/organizations/me/collaborators/${collaboratorId}`,
    { method: 'DELETE' },
  )
}
 
// ─── Invitations (colaborador) ────────────────────────────────────────────────
 
/** GET /invitations/:token — info pública de la invitación (sin auth) */
export async function getInvitationInfo(token: string) {
  return apiFetchPublic<{ success: boolean; data: InvitationInfo }>(
    `/invitations/${token}`,
  )
}
 
/** POST /invitations/:token/accept — el colaborador logueado acepta */
export async function acceptInvitation(token: string) {
  return apiFetch<{ success: boolean; message: string }>(
    `/invitations/${token}/accept`,
    { method: 'POST' },
  )
}
 