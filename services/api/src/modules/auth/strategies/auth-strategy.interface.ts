export const AUTH_STRATEGIES = 'AUTH_STRATEGIES';

export interface CredentialsInput {
  email: string;
  password: string;
}

export interface CreateAuthMethodInput {
  userId: string;
  providerAccountId: string;
  password: string;
}

export interface ValidatedAuthResult {
  authMethodId: string;
  userId: string;
  provider: string;
  providerAccountId: string;
}

export interface AuthStrategy {
  readonly provider: string;

  create(
    input: CreateAuthMethodInput,
  ): Promise<{ id: string; provider: string }>;

  validate(input: CredentialsInput): Promise<ValidatedAuthResult | null>;
}
