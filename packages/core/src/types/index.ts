export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  createdAt: string;
  categoryId: string | null;
  tenantId: string;
  account: { id: string; name: string; currency: string };
  category: { id: string; name: string } | null;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

export interface Account {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string | null;
  isRecurring: boolean;
  interval: string | null;
  exceededAt: string | null;
  tenantId: string;
  categoryId: string | null;
  spent: number;
  remaining: number;
  isExceeded: boolean;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  tenantId: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
}

export interface Tenant {
  id: string;
  name: string;
}

export interface Session {
  user: User;
  tenant: Tenant | null;
  accessToken: string;
  refreshToken?: string;
}
