import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AppConfig } from '../../config/app.config';
import { Tenant, User } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/me.dto';
import { RefreshTokensService } from './services/refresh-tokens.service';
import {
  AUTH_STRATEGIES,
  AuthStrategy,
  CredentialStrategy,
  OAuthProfile,
} from './strategies/auth-strategy.interface';
import { CREDENTIALS_PROVIDER } from './strategies/credentials.strategy';

const DEFAULT_TENANT_NAME = 'Mi hogar';
const ACCESS_TOKEN_PURPOSE = 'access';
const EMAIL_VERIFICATION_PURPOSE = 'email-verification';
const EMAIL_VERIFICATION_EXPIRES_IN = '24h';
const PASSWORD_RESET_PURPOSE = 'password-reset';
const PASSWORD_RESET_EXPIRES_IN = '1h';
const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000;
const INVALID_RESET_TOKEN_MESSAGE = 'Invalid or expired reset token';

const hashResetNonce = (nonce: string): string =>
  createHash('sha256').update(nonce).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly config: AppConfig,
    private readonly mailService: MailService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly prisma: PrismaService,
    @Inject(AUTH_STRATEGIES) private readonly strategies: AuthStrategy[],
  ) {}

  private getStrategy(provider: string): AuthStrategy {
    const strategy = this.strategies.find((s) => s.provider === provider);
    if (!strategy)
      throw new UnauthorizedException(`Unsupported auth provider: ${provider}`);
    return strategy;
  }

  private async signToken(
    userId: string,
    provider: string,
    tenantId: string | null,
  ): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      provider,
      tenantId,
      purpose: ACCESS_TOKEN_PURPOSE,
    });
  }

  private signPurposeToken(
    userId: string,
    purpose: string,
    expiresIn: string,
    extraClaims: Record<string, unknown> = {},
  ): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, purpose, ...extraClaims }, {
      expiresIn,
    } as JwtSignOptions);
  }

  private async buildSession(user: { id: string; provider: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    tenant: Tenant | null;
  }> {
    const tenant = await this.tenantsService.findByUserId(user.id);
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, user.provider, tenant?.id ?? null),
      this.refreshTokensService.generate(user.id, user.provider),
    ]);
    return { accessToken, refreshToken, tenant };
  }

  private async sendVerificationEmail(user: {
    id: string;
    email: string;
    name?: string | null;
  }): Promise<void> {
    const token = await this.signPurposeToken(
      user.id,
      EMAIL_VERIFICATION_PURPOSE,
      EMAIL_VERIFICATION_EXPIRES_IN,
    );
    const frontendUrl = this.config.frontendUrl ?? 'http://localhost:3000';
    const link = `${frontendUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name ?? undefined,
      link,
    );
  }

  private isAdminEmail(email: string): boolean {
    return this.config.adminEmails.includes(email.trim().toLowerCase());
  }

  private async maybePromoteToAdmin(user: User): Promise<User> {
    if (user.role === 'ADMIN' || !this.isAdminEmail(user.email)) return user;
    return this.usersService.update(user.id, { role: 'ADMIN' });
  }

  async me(userId: string) {
    const user = await this.usersService.findOne(userId);
    const tenant = await this.tenantsService.findByUserId(userId);
    return this.toProfile(user, tenant);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.usersService.update(userId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });
    const tenant = await this.tenantsService.findByUserId(userId);
    return this.toProfile(user, tenant);
  }

  private toProfile(user: User, tenant: Tenant | null) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerifiedAt: user.emailVerifiedAt,
      role: user.role,
      tenant: tenant ? { id: tenant.id, name: tenant.name } : null,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const autoVerify = !this.mailService.enabled;
    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);

    const { user, tenant, authMethod } = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            name: dto.name,
            phone: dto.phone,
            role: this.isAdminEmail(dto.email) ? 'ADMIN' : 'USER',
            emailVerifiedAt: autoVerify ? new Date() : null,
          },
        });

        const tenant = await this.tenantsService.createForUser(
          user.id,
          {
            name: dto.name ? `${dto.name}'s home` : DEFAULT_TENANT_NAME,
          },
          tx,
        );

        const authMethod = await strategy.create(
          {
            userId: user.id,
            providerAccountId: dto.email,
            password: dto.password,
          },
          tx,
        );

        return { user, tenant, authMethod };
      },
    );

    if (autoVerify) {
      this.logger.warn(
        `RESEND_API_KEY not configured, auto-verified email for ${user.email}`,
      );
    }

    void this.sendVerificationEmail(user).catch((error: unknown) =>
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      ),
    );

    return { user, tenant, authMethod };
  }

  async verifyEmail(token: string) {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub?: string;
        purpose?: string;
      }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (!payload.sub || payload.purpose !== EMAIL_VERIFICATION_PURPOSE)
      throw new UnauthorizedException('Invalid or expired verification token');

    const user = await this.usersService.update(payload.sub, {
      emailVerifiedAt: new Date(),
    });

    const promoted = await this.maybePromoteToAdmin(user);

    const session = await this.buildSession({
      id: promoted.id,
      provider: CREDENTIALS_PROVIDER,
    });

    return { user: promoted, ...session };
  }

  async login(dto: LoginDto) {
    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    if (strategy.flow !== 'credentials')
      throw new UnauthorizedException('Unsupported auth flow');

    const result = await (strategy as CredentialStrategy).authenticate({
      email: dto.email,
      password: dto.password,
    });
    if (!result) throw new UnauthorizedException('Invalid credentials');

    let user: User;
    try {
      user = await this.usersService.findOne(result.userId);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt)
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );

    const promoted = await this.maybePromoteToAdmin(user);

    const session = await this.buildSession({
      id: promoted.id,
      provider: result.provider,
    });

    return { user: promoted, ...session };
  }

  async oauthLogin(dto: OAuthProfile) {
    const strategy = this.getStrategy(dto.provider);

    const existing = await strategy.findMethod(dto.providerAccountId);
    if (existing) {
      let user = await this.usersService.findOne(existing.userId);
      if (!user.emailVerifiedAt)
        user = await this.usersService.update(user.id, {
          emailVerifiedAt: new Date(),
        });
      user = await this.maybePromoteToAdmin(user);
      const session = await this.buildSession({
        id: user.id,
        provider: dto.provider,
      });
      return { user, isNew: false, ...session };
    }

    const existingByEmail = dto.email
      ? await this.usersService.findByEmail(dto.email)
      : null;
    if (existingByEmail) {
      if (dto.emailVerified === false)
        throw new ConflictException(
          'An account already exists with this email. Verify your email with your provider to link it.',
        );
      await strategy.create({
        userId: existingByEmail.id,
        providerAccountId: dto.providerAccountId,
      });
      if (!existingByEmail.emailVerifiedAt)
        await this.usersService.update(existingByEmail.id, {
          emailVerifiedAt: new Date(),
        });
      const user = await this.maybePromoteToAdmin(existingByEmail);
      const session = await this.buildSession({
        id: user.id,
        provider: dto.provider,
      });
      return { user, isNew: false, ...session };
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          emailVerifiedAt: new Date(),
          role: this.isAdminEmail(dto.email) ? 'ADMIN' : 'USER',
        },
      });

      await this.tenantsService.createForUser(
        created.id,
        {
          name: dto.name ? `${dto.name}'s home` : DEFAULT_TENANT_NAME,
        },
        tx,
      );

      await strategy.create(
        {
          userId: created.id,
          providerAccountId: dto.providerAccountId,
        },
        tx,
      );

      return created;
    });

    const session = await this.buildSession({
      id: user.id,
      provider: dto.provider,
    });

    return { user, isNew: true, ...session };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    const method = await strategy.findMethod(user.email);
    if (!method) return;

    // Single-use nonce: only its sha256 hash is stored, so a database leak
    // cannot be replayed as a reset link. Issuing a new link overwrites the
    // previous one, revoking any link still in flight.
    const nonce = randomBytes(32).toString('hex');
    const token = await this.signPurposeToken(
      user.id,
      PASSWORD_RESET_PURPOSE,
      PASSWORD_RESET_EXPIRES_IN,
      { jti: nonce },
    );

    await this.usersService.update(user.id, {
      passwordResetTokenHash: hashResetNonce(nonce),
      passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS),
    });

    const frontendUrl = this.config.frontendUrl ?? 'http://localhost:3000';
    const link = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

    void this.mailService
      .sendPasswordResetEmail(user.email, user.name ?? undefined, link)
      .catch((error: unknown) =>
        this.logger.error(
          `Failed to send password reset email to ${user.email}`,
          error instanceof Error ? error.stack : String(error),
        ),
      );
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub?: string; purpose?: string; jti?: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub?: string;
        purpose?: string;
        jti?: string;
      }>(token);
    } catch {
      throw new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);
    }

    if (
      !payload.sub ||
      payload.purpose !== PASSWORD_RESET_PURPOSE ||
      !payload.jti
    )
      throw new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !user?.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    )
      throw new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);

    const candidate = Buffer.from(hashResetNonce(payload.jti), 'hex');
    const stored = Buffer.from(user.passwordResetTokenHash, 'hex');
    if (
      candidate.length !== stored.length ||
      !timingSafeEqual(candidate, stored)
    )
      throw new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);

    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    if (strategy.flow !== 'credentials')
      throw new UnauthorizedException('Unsupported auth flow');

    // Atomic claim: only the first request holding the matching hash consumes
    // the token, so a reset link can never be used twice.
    const claimed = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        passwordResetTokenHash: user.passwordResetTokenHash,
      },
      data: {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
    if (claimed.count === 0)
      throw new UnauthorizedException(INVALID_RESET_TOKEN_MESSAGE);

    await (strategy as CredentialStrategy).resetPassword(
      payload.sub,
      newPassword,
    );

    await this.refreshTokensService.revokeAllForUser(payload.sub);

    return { message: 'Password updated successfully' };
  }

  async refresh(refreshToken: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    tenant: Tenant | null;
  }> {
    const { userId, provider, token } =
      await this.refreshTokensService.rotate(refreshToken);
    const [user, tenant] = await Promise.all([
      this.usersService.findOne(userId),
      this.tenantsService.findByUserId(userId),
    ]);
    const accessToken = await this.signToken(
      userId,
      provider,
      tenant?.id ?? null,
    );
    return { user, accessToken, refreshToken: token, tenant };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.refreshTokensService.revoke(refreshToken);
    return { message: 'Logged out successfully' };
  }
}
