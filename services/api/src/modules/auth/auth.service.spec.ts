import { createHash } from 'node:crypto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../../config/app.config';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { AUTH_STRATEGIES } from './strategies/auth-strategy.interface';
import { CREDENTIALS_PROVIDER } from './strategies/credentials.strategy';

const usersServiceMock = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const tenantsServiceMock = {
  createForUser: jest.fn(),
  findByUserId: jest.fn(),
};

const jwtServiceMock = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const refreshTokensServiceMock = {
  generate: jest.fn(),
  rotate: jest.fn(),
  revoke: jest.fn(),
  revokeAllForUser: jest.fn(),
};

const mailServiceMock = {
  enabled: true,
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

const credentialsStrategyMock = {
  provider: CREDENTIALS_PROVIDER,
  flow: 'credentials' as const,
  create: jest.fn(),
  findMethod: jest.fn(),
  authenticate: jest.fn(),
  resetPassword: jest.fn(),
};

const configMock = {
  frontendUrl: 'http://localhost:5173',
  adminEmails: [] as string[],
};

const prismaTxMock = {
  user: {
    create: jest.fn(),
  },
};

const prismaMock = {
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
    fn(prismaTxMock),
  ),
  user: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
};

const hashNonce = (nonce: string) =>
  createHash('sha256').update(nonce).digest('hex');

const ACCESS_TOKEN = {
  sub: 'user-1',
  provider: CREDENTIALS_PROVIDER,
  tenantId: 'tenant-1',
  purpose: 'access',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    configMock.adminEmails = [];
    mailServiceMock.enabled = true;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: TenantsService, useValue: tenantsServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        {
          provide: AppConfig,
          useValue: configMock,
        },
        { provide: MailService, useValue: mailServiceMock },
        { provide: RefreshTokensService, useValue: refreshTokensServiceMock },
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: AUTH_STRATEGIES,
          useValue: [credentialsStrategyMock],
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('me', () => {
    it('returns the profile for the current user', async () => {
      usersServiceMock.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
        phone: '+34600000000',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        role: 'USER',
      });
      tenantsServiceMock.findByUserId.mockResolvedValue({
        id: 'tenant-1',
        name: 'Mi hogar',
      });

      const result = await service.me('user-1');

      expect(usersServiceMock.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
        phone: '+34600000000',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        role: 'USER',
        tenant: { id: 'tenant-1', name: 'Mi hogar' },
      });
    });
  });

  describe('updateMe', () => {
    it('updates the allowed profile fields', async () => {
      usersServiceMock.update.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan Actualizado',
        phone: null,
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        role: 'USER',
      });
      tenantsServiceMock.findByUserId.mockResolvedValue(null);

      const result = await service.updateMe('user-1', {
        name: 'Juan Actualizado',
      });

      expect(usersServiceMock.update).toHaveBeenCalledWith('user-1', {
        name: 'Juan Actualizado',
      });
      expect(result.name).toBe('Juan Actualizado');
      expect(result.tenant).toBeNull();
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('register', () => {
    it('should create the user and send a verification email without issuing an access token', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      prismaTxMock.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
        role: 'USER',
        emailVerifiedAt: null,
      });
      tenantsServiceMock.createForUser.mockResolvedValue({ id: 'tenant-1' });
      credentialsStrategyMock.create.mockResolvedValue({
        id: 'auth-method-1',
        provider: CREDENTIALS_PROVIDER,
      });
      jwtServiceMock.signAsync.mockResolvedValue('verification-token');
      mailServiceMock.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register({
        email: 'juan@example.com',
        password: 'password123',
        name: 'Juan',
      });

      expect(result).not.toHaveProperty('accessToken');
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaTxMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'juan@example.com',
          name: 'Juan',
          phone: undefined,
          role: 'USER',
          emailVerifiedAt: null,
        },
      });
      expect(tenantsServiceMock.createForUser).toHaveBeenCalledWith(
        'user-1',
        { name: "Juan's home" },
        prismaTxMock,
      );
      expect(credentialsStrategyMock.create).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          providerAccountId: 'juan@example.com',
          password: 'password123',
        },
        prismaTxMock,
      );
      await new Promise((resolve) => setImmediate(resolve));
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1', purpose: 'email-verification' },
        expect.objectContaining({ expiresIn: '24h' }),
      );
      expect(mailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        'juan@example.com',
        'Juan',
        expect.stringContaining(
          'http://localhost:5173/auth/verify?token=verification-token',
        ),
      );
    });

    it('auto-verifies the email when the mailer is not configured', async () => {
      mailServiceMock.enabled = false;
      usersServiceMock.findByEmail.mockResolvedValue(null);
      prismaTxMock.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
        role: 'USER',
        emailVerifiedAt: new Date(),
      });
      tenantsServiceMock.createForUser.mockResolvedValue({ id: 'tenant-1' });
      credentialsStrategyMock.create.mockResolvedValue({
        id: 'auth-method-1',
        provider: CREDENTIALS_PROVIDER,
      });

      const result = await service.register({
        email: 'juan@example.com',
        password: 'password123',
        name: 'Juan',
      });

      expect(result).not.toHaveProperty('accessToken');
      expect(prismaTxMock.user.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          emailVerifiedAt: expect.any(Date),
        }),
      });
      mailServiceMock.enabled = true;
    });

    it('assigns the admin role to configured admin emails', async () => {
      configMock.adminEmails = ['admin@example.com'];
      usersServiceMock.findByEmail.mockResolvedValue(null);
      prismaTxMock.user.create.mockResolvedValue({
        id: 'user-9',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'ADMIN',
        emailVerifiedAt: null,
      });
      tenantsServiceMock.createForUser.mockResolvedValue({ id: 'tenant-9' });
      credentialsStrategyMock.create.mockResolvedValue({
        id: 'auth-method-9',
        provider: CREDENTIALS_PROVIDER,
      });

      await service.register({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin',
      });

      expect(prismaTxMock.user.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({ role: 'ADMIN' }),
      });
    });
  });

  describe('verifyEmail', () => {
    it('should throw if the token is invalid', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('bad token'));

      await expect(service.verifyEmail('invalid')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should throw if the token has an unknown purpose', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'other',
      });

      await expect(service.verifyEmail('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should mark the email verified and return a session', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'email-verification',
      });
      usersServiceMock.update.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        emailVerifiedAt: new Date(),
      });
      tenantsServiceMock.findByUserId.mockResolvedValue({ id: 'tenant-1' });
      jwtServiceMock.signAsync.mockResolvedValue('access-token');
      refreshTokensServiceMock.generate.mockResolvedValue('refresh-token');

      const result = await service.verifyEmail('token');

      expect(usersServiceMock.update).toHaveBeenCalledWith(
        'user-1',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ emailVerifiedAt: expect.any(Date) }),
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(ACCESS_TOKEN);
      expect(refreshTokensServiceMock.generate).toHaveBeenCalledWith(
        'user-1',
        CREDENTIALS_PROVIDER,
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('login', () => {
    it('should reject unverified users', async () => {
      credentialsStrategyMock.authenticate.mockResolvedValue({
        userId: 'user-1',
        provider: CREDENTIALS_PROVIDER,
      });
      usersServiceMock.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        emailVerifiedAt: null,
      });

      await expect(
        service.login({ email: 'juan@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return a session for verified users', async () => {
      credentialsStrategyMock.authenticate.mockResolvedValue({
        userId: 'user-1',
        provider: CREDENTIALS_PROVIDER,
      });
      usersServiceMock.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        emailVerifiedAt: new Date(),
      });
      tenantsServiceMock.findByUserId.mockResolvedValue({ id: 'tenant-1' });
      jwtServiceMock.signAsync.mockResolvedValue('access-token');
      refreshTokensServiceMock.generate.mockResolvedValue('refresh-token');

      const result = await service.login({
        email: 'juan@example.com',
        password: 'password123',
      });

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(ACCESS_TOKEN);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('promotes allow-listed emails to the admin role', async () => {
      configMock.adminEmails = ['admin@example.com'];
      credentialsStrategyMock.authenticate.mockResolvedValue({
        userId: 'user-9',
        provider: CREDENTIALS_PROVIDER,
      });
      usersServiceMock.findOne.mockResolvedValue({
        id: 'user-9',
        email: 'admin@example.com',
        name: 'Admin',
        emailVerifiedAt: new Date(),
        role: 'USER',
      });
      usersServiceMock.update.mockResolvedValue({
        id: 'user-9',
        email: 'admin@example.com',
        name: 'Admin',
        emailVerifiedAt: new Date(),
        role: 'ADMIN',
      });
      tenantsServiceMock.findByUserId.mockResolvedValue({ id: 'tenant-1' });
      jwtServiceMock.signAsync.mockResolvedValue('access-token');
      refreshTokensServiceMock.generate.mockResolvedValue('refresh-token');

      const result = await service.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(usersServiceMock.update).toHaveBeenCalledWith('user-9', {
        role: 'ADMIN',
      });
      expect(result.user.role).toBe('ADMIN');
    });
  });

  describe('password reset', () => {
    const validResetNonce = 'reset-nonce-1';

    const seedResetRequest = () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
      });
      credentialsStrategyMock.findMethod.mockResolvedValue({
        id: 'method-1',
        userId: 'user-1',
      });
      usersServiceMock.update.mockResolvedValue({ id: 'user-1' });
      jwtServiceMock.signAsync.mockResolvedValue('reset-token');
      mailServiceMock.sendPasswordResetEmail.mockResolvedValue(undefined);
    };

    const seedValidResetToken = () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'password-reset',
        jti: validResetNonce,
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordResetTokenHash: hashNonce(validResetNonce),
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });
      prismaMock.user.updateMany.mockResolvedValue({ count: 1 });
      credentialsStrategyMock.resetPassword.mockResolvedValue(undefined);
    };

    it('should send a reset email when the user has a credentials method', async () => {
      seedResetRequest();

      await service.requestPasswordReset('juan@example.com');
      await new Promise((resolve) => setImmediate(resolve));

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        {
          sub: 'user-1',
          purpose: 'password-reset',
          jti: expect.any(String) as string,
        },
        expect.objectContaining({ expiresIn: '1h' }),
      );
      expect(usersServiceMock.update).toHaveBeenCalledWith('user-1', {
        passwordResetTokenHash: expect.any(String) as string,
        passwordResetExpiresAt: expect.any(Date) as Date,
      });
      expect(mailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
        'juan@example.com',
        'Juan',
        expect.stringContaining(
          'http://localhost:5173/auth/reset-password?token=reset-token',
        ),
      );
    });

    it('should not send an email when the user has no credentials method', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
      });
      credentialsStrategyMock.findMethod.mockResolvedValue(null);

      await service.requestPasswordReset('juan@example.com');
      await new Promise((resolve) => setImmediate(resolve));

      expect(mailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(usersServiceMock.update).not.toHaveBeenCalled();
    });

    it('should not send an email when the user does not exist', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await service.requestPasswordReset('unknown@example.com');

      expect(mailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(usersServiceMock.update).not.toHaveBeenCalled();
    });

    it('should reset the password when the token is valid', async () => {
      seedValidResetToken();

      const result = await service.resetPassword('token', 'new-password-123');

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
          passwordResetTokenHash: hashNonce(validResetNonce),
        },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });
      expect(credentialsStrategyMock.resetPassword).toHaveBeenCalledWith(
        'user-1',
        'new-password-123',
      );
      expect(refreshTokensServiceMock.revokeAllForUser).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('should throw when the reset token is invalid', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('bad token'));

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when the reset token has an unknown purpose', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'email-verification',
        jti: validResetNonce,
      });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw when the reset token has no nonce', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'password-reset',
      });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw when the token was already used', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'password-reset',
        jti: validResetNonce,
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(credentialsStrategyMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should throw when the reset token has expired in the database', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'password-reset',
        jti: validResetNonce,
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordResetTokenHash: hashNonce(validResetNonce),
        passwordResetExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(credentialsStrategyMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should throw when the nonce does not match the stored hash', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'password-reset',
        jti: 'another-nonce',
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordResetTokenHash: hashNonce(validResetNonce),
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(credentialsStrategyMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should throw when the token was consumed concurrently', async () => {
      seedValidResetToken();
      prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(credentialsStrategyMock.resetPassword).not.toHaveBeenCalled();
      expect(refreshTokensServiceMock.revokeAllForUser).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate the refresh token and issue a new access token with the fresh tenant', async () => {
      refreshTokensServiceMock.rotate.mockResolvedValue({
        userId: 'user-1',
        provider: CREDENTIALS_PROVIDER,
        token: 'new-refresh-token',
      });
      usersServiceMock.findOne.mockResolvedValue({ id: 'user-1' });
      tenantsServiceMock.findByUserId.mockResolvedValue({ id: 'tenant-1' });
      jwtServiceMock.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refresh('old-refresh-token');

      expect(refreshTokensServiceMock.rotate).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(usersServiceMock.findOne).toHaveBeenCalledWith('user-1');
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(ACCESS_TOKEN);
      expect(result.user).toEqual({ id: 'user-1' });
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw when the refresh token is invalid or expired', async () => {
      refreshTokensServiceMock.rotate.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      refreshTokensServiceMock.revoke.mockResolvedValue(undefined);

      const result = await service.logout('refresh-token');

      expect(refreshTokensServiceMock.revoke).toHaveBeenCalledWith(
        'refresh-token',
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('oauthLogin', () => {
    it('should throw when linking an unverified email to an existing account', async () => {
      credentialsStrategyMock.findMethod.mockResolvedValue(null);
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
      });

      await expect(
        service.oauthLogin({
          provider: CREDENTIALS_PROVIDER,
          providerAccountId: 'google-sub-1',
          email: 'juan@example.com',
          emailVerified: false,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should link an existing user when the provider email is verified', async () => {
      credentialsStrategyMock.findMethod.mockResolvedValue(null);
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        emailVerifiedAt: null,
      });
      usersServiceMock.update.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        emailVerifiedAt: new Date(),
      });
      tenantsServiceMock.findByUserId.mockResolvedValue({ id: 'tenant-1' });
      jwtServiceMock.signAsync.mockResolvedValue('access-token');
      credentialsStrategyMock.create.mockResolvedValue({
        id: 'method-9',
        provider: CREDENTIALS_PROVIDER,
      });

      const result = await service.oauthLogin({
        provider: CREDENTIALS_PROVIDER,
        providerAccountId: 'google-sub-1',
        email: 'juan@example.com',
        emailVerified: true,
      });

      expect(result.isNew).toBe(false);
      expect(result.accessToken).toBe('access-token');
    });
  });
});
