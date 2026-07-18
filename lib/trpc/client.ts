/**
 * lib/trpc/client.ts
 *
 * Cliente tRPC para realsass-sass-front (owner panel).
 * Conecta con realsass-sass-back en /api/v1/trpc.
 *
 * Este front no usa x-organization-id como tenant header porque
 * el owner accede a su propia org — el backend la resuelve por firebaseUid.
 * Solo se pasa el token de Firebase en Authorization.
 */
'use client';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink }   from '@trpc/client';
import type { AppRouter } from './router-type';

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient(getToken: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env['NEXT_PUBLIC_API_URL']}/trpc`,
        async headers() {
          const token = await getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
