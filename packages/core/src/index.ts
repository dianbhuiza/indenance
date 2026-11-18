export * from './types';

export { CURRENCIES } from './constants/currencies';
export { INTERVALS, INTERVAL_VALUES, type IntervalValue } from './constants/intervals';
export {
  CLIENT_PLATFORM_HEADER,
  CLIENT_PLATFORM_NATIVE,
  CLIENT_PLATFORM_WEB,
} from './constants/platform';

export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from './schemas/auth.schema';
export { accountSchema, type AccountFormData } from './schemas/account.schema';
export {
  transactionSchema,
  type TransactionFormData,
} from './schemas/transaction.schema';
export {
  plannedTransactionSchema,
  type PlannedTransactionFormData,
} from './schemas/planned-transaction.schema';
export { loanSchema, type LoanFormData } from './schemas/loan.schema';

export { getMonthKey, getMonthLabel, toDateString } from './domain/dates';
export {
  CATEGORY_COLORS,
  CATEGORY_FALLBACK_COLOR,
  CATEGORY_FALLBACK_ICON,
  CATEGORY_ICONS,
  UNASSIGNED_CATEGORY,
  getCategoryColor,
  getCategoryIcon,
} from './domain/category-meta';
export {
  computeCategorySpending,
  computeMonthTotals,
  computeMonthlySpending,
  type MonthTotals,
} from './domain/spending';
export { computeBudgetProgress, type BudgetProgress } from './domain/budgets';
export { buildLoanPayload, computeLoanSummary, type LoanSummary } from './domain/loan';
export { buildPlannedTransactionPayload } from './domain/planned-transaction';

export {
  formatAmount,
  formatCompactAmount,
  formatDayMonth,
  formatNumber,
} from './lib/format';
export { getApiError, getApiErrorMessage, type ApiErrorInfo } from './lib/errors';

export { api, configureApi, type ApiClientOptions } from './api/client';

export {
  isAuthenticated,
  setAuthenticated,
  useIsAuthenticated,
} from './auth/session';
export { createAuthStore, type AuthState } from './auth/auth-store';

export { queryKeys } from './queries/keys';
export type { QueryToggle } from './queries/options';
export { useAccountsQuery, useCreateAccountMutation } from './queries/accounts';
export { useTransactionsQuery } from './queries/transactions';
export { useCategoriesQuery } from './queries/categories';
export { useBudgetsQuery } from './queries/budgets';
