/**
 * Jest mock for the generated Prisma client.
 *
 * The real generated client (`generated/prisma/client`) uses ESM syntax that
 * Jest's CommonJS transform cannot parse. This stub lets unit tests import
 * `PrismaService` without loading the real client, mirroring the shape needed
 * for type references. All DB interactions are mocked per-test via `useValue`.
 */
export class PrismaClient {}

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const Interval = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;
export type Interval = (typeof Interval)[keyof typeof Interval];

export const PlannedTransactionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;
export type PlannedTransactionStatus =
  (typeof PlannedTransactionStatus)[keyof typeof PlannedTransactionStatus];

export const PlannedTransactionAlertStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type PlannedTransactionAlertStatus =
  (typeof PlannedTransactionAlertStatus)[keyof typeof PlannedTransactionAlertStatus];

export type User = Record<string, any>;
export type AuthMethod = Record<string, any>;
export type RefreshToken = Record<string, any>;
export type PlannedTransaction = Record<string, any>;
export type PlannedTransactionAlert = Record<string, any>;