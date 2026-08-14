export const AUTH_STRATEGIES = 'AUTH_STRATEGIES';

export type AuthFlow = 'credentials' | 'oauth';

export interface CreateAuthMethodInput {
  userId: string;
  providerAccountId: string;
  password?: string;
}

export interface ValidatedAuthResult {
  authMethodId: string;
  userId: string;
  provider: string;
  providerAccountId: string;
}

export interface OAuthProfile {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}

export interface AuthStrategy {
  readonly provider: string;
  readonly flow: AuthFlow;

  create(
    input: CreateAuthMethodInput,
  ): Promise<{ id: string; provider: string }>;

  findMethod(
    providerAccountId: string,
  ): Promise<{ id: string; userId: string } | null>;
}

export interface CredentialStrategy extends AuthStrategy {
  readonly flow: 'credentials';

  authenticate(input: {
    email: string;
    password: string;
  }): Promise<ValidatedAuthResult | null>;

  resetPassword(userId: string, newPassword: string): Promise<void>;
}
