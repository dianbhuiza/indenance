import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { AppConfig } from '../../config/app.config';
import { Tenant } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { RefreshTokensService } from './services/refresh-tokens.service';
import {
  AUTH_STRATEGIES,
  AuthStrategy,
  CredentialStrategy,
  OAuthProfile,
} from './strategies/auth-strategy.interface';
import { CREDENTIALS_PROVIDER } from './strategies/credentials.strategy';

const DEFAULT_TENANT_NAME = 'Mi hogar';
const EMAIL_VERIFICATION_PURPOSE = 'email-verification';
const EMAIL_VERIFICATION_EXPIRES_IN = '24h';
const PASSWORD_RESET_PURPOSE = 'password-reset';
const PASSWORD_RESET_EXPIRES_IN = '1h';

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
    return this.jwtService.signAsync({ sub: userId, provider, tenantId });
  }

  private signPurposeToken(
    userId: string,
    purpose: string,
    expiresIn: string,
  ): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, purpose }, {
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

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
    });

    const tenant = await this.tenantsService.createForUser(user.id, {
      name: dto.name ? `${dto.name}'s home` : DEFAULT_TENANT_NAME,
    });

    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    const authMethod = await strategy.create({
      userId: user.id,
      providerAccountId: dto.email,
      password: dto.password,
    });

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

    const session = await this.buildSession({
      id: user.id,
      provider: CREDENTIALS_PROVIDER,
    });

    return { user, ...session };
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

    let user;
    try {
      user = await this.usersService.findOne(result.userId);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt)
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );

    const session = await this.buildSession({
      id: user.id,
      provider: result.provider,
    });

    return { user, ...session };
  }

  async oauthLogin(dto: OAuthProfile) {
    const strategy = this.getStrategy(dto.provider);

    const existing = await strategy.findMethod(dto.providerAccountId);
    if (existing) {
      const user = await this.usersService.findOne(existing.userId);
      if (!user.emailVerifiedAt)
        await this.usersService.update(user.id, {
          emailVerifiedAt: new Date(),
        });
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
      const session = await this.buildSession({
        id: existingByEmail.id,
        provider: dto.provider,
      });
      return { user: existingByEmail, isNew: false, ...session };
    }

    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      emailVerifiedAt: new Date(),
    });

    await this.tenantsService.createForUser(user.id, {
      name: dto.name ? `${dto.name}'s home` : DEFAULT_TENANT_NAME,
    });

    await strategy.create({
      userId: user.id,
      providerAccountId: dto.providerAccountId,
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

    const token = await this.signPurposeToken(
      user.id,
      PASSWORD_RESET_PURPOSE,
      PASSWORD_RESET_EXPIRES_IN,
    );
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
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub?: string;
        purpose?: string;
      }>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (!payload.sub || payload.purpose !== PASSWORD_RESET_PURPOSE)
      throw new UnauthorizedException('Invalid or expired reset token');

    const strategy = this.getStrategy(CREDENTIALS_PROVIDER);
    if (strategy.flow !== 'credentials')
      throw new UnauthorizedException('Unsupported auth flow');

    await (strategy as CredentialStrategy).resetPassword(
      payload.sub,
      newPassword,
    );

    await this.refreshTokensService.revokeAllForUser(payload.sub);

    return { message: 'Password updated successfully' };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tenant: Tenant | null;
  }> {
    const { userId, provider, token } =
      await this.refreshTokensService.rotate(refreshToken);
    const tenant = await this.tenantsService.findByUserId(userId);
    const accessToken = await this.signToken(
      userId,
      provider,
      tenant?.id ?? null,
    );
    return { accessToken, refreshToken: token, tenant };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.refreshTokensService.revoke(refreshToken);
    return { message: 'Logged out successfully' };
  }
}
