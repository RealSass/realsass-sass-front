/**
 * hooks/use-collaborators.ts
 *
 * Reemplaza las llamadas manuales a lib/api:
 *   listCollaborators()              → trpc.collaborators.list
 *   inviteCollaborator(uid, dto)     → trpc.collaborators.invite
 *   removeCollaborator(uid, id)      → trpc.collaborators.remove
 *   updateCollaboratorPermissions()  → trpc.collaborators.update
 *
 * Uso en componentes:
 *   const { data, isLoading } = useCollaborators();
 *   const invite = useInviteCollaborator();
 *   await invite.mutateAsync({ email, canViewListings: true, ... });
 */
import { trpc } from '@/lib/trpc/client';

export function useCollaborators() {
  return trpc.collaborators.list.useQuery(undefined, {
    staleTime: 30_000,
  });
}

export function useInviteCollaborator() {
  const utils = trpc.useUtils();
  return trpc.collaborators.invite.useMutation({
    onSuccess: () => void utils.collaborators.list.invalidate(),
  });
}

export function useRemoveCollaborator() {
  const utils = trpc.useUtils();
  return trpc.collaborators.remove.useMutation({
    onSuccess: () => void utils.collaborators.list.invalidate(),
  });
}

export function useUpdateCollaboratorPermissions() {
  const utils = trpc.useUtils();
  return trpc.collaborators.update.useMutation({
    onSuccess: () => void utils.collaborators.list.invalidate(),
  });
}

export function useAcceptInvitation() {
  return trpc.collaborators.acceptInvitation.useMutation();
}
