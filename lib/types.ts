// lib/types.ts
// ─── Tipos centralizados de la aplicación ────────────────────────────────────

// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  userId: string
  name: string | null
  description: string | null
  logoUrl: string | null
  website: string | null
  phone: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export interface AffiliateData {
  id: string
  userId: string
  balance: string
  referralCount: number
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  firebaseUid: string
  email: string
  isOwner: boolean
  isAffiliate: boolean
  affiliateCode: string | null
  referredByCode: string | null
  createdAt: string
  updatedAt: string
  organization: Organization | null
  affiliateData: AffiliateData | null
}

export interface AffiliateReferral {
  id: string
  email: string
  isOwner: boolean
  isAffiliate: boolean
  createdAt: string
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export type CollaboratorStatus = 'PENDING' | 'ACTIVE' | 'REMOVED'

export interface CollaboratorPermissions {
  canViewListings: boolean
  canCreateListings: boolean
  canEditListings: boolean
  canDeleteListings: boolean
  canViewStats: boolean
  canManageLeads: boolean
  canManageCollaborators: boolean
}

export interface Collaborator extends CollaboratorPermissions {
  id: string
  organizationId: string
  userId: string | null
  email: string
  status: CollaboratorStatus
  invitedAt: string
  acceptedAt: string | null
  updatedAt: string
  user: { email: string; firebaseUid: string } | null
  invitation: {
    expiresAt: string
    usedAt: string | null
    token: string
  } | null
}

export interface InvitationInfo {
  email: string
  organization: { id: string; name: string | null; logoUrl: string | null }
  expiresAt: string
  permissions: CollaboratorPermissions
}

export type InviteCollaboratorPayload = { email: string } & Partial<CollaboratorPermissions>