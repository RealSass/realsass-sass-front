/**
 * lib/trpc/router-type.ts
 *
 * Re-exporta el AppRouter como tipo opaco para evitar
 * que TypeScript compile el source del back.
 * Usamos import type para que sea solo a nivel de tipos.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AppRouter } from '../../../realsass-sass-back/src/trpc/app-router';

export type { AppRouter };