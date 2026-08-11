/**
 * Jest mock for the generated Prisma client.
 *
 * The real generated client (`generated/prisma/client`) uses ESM syntax that
 * Jest's CommonJS transform cannot parse. This stub lets unit tests import
 * `PrismaService` without loading the real client, mirroring the shape needed
 * for type references. All DB interactions are mocked per-test via `useValue`.
 */
export class PrismaClient {}

export type User = Record<string, any>;
export type AuthMethod = Record<string, any>;
