import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../../config/app.config';
import { MailService } from '../mail/mail.service';
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
};

const mailServiceMock = {
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

const configMock: AppConfig = {
  frontendUrl: 'http://localhost:5173',
} as unknown as AppConfig;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: TenantsService, useValue: tenantsServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: AppConfig, useValue: configMock },
        { provide: MailService, useValue: mailServiceMock },
        { provide: RefreshTokensService, useValue: refreshTokensServiceMock },
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

  describe('register', () => {
    it('should create the user and send a verification email without issuing an access token', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
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
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        provider: CREDENTIALS_PROVIDER,
        tenantId: 'tenant-1',
      });
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

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        provider: CREDENTIALS_PROVIDER,
        tenantId: 'tenant-1',
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('password reset', () => {
    it('should send a reset email when the user has a credentials method', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'juan@example.com',
        name: 'Juan',
      });
      credentialsStrategyMock.findMethod.mockResolvedValue({
        id: 'method-1',
        userId: 'user-1',
      });
      jwtServiceMock.signAsync.mockResolvedValue('reset-token');
      mailServiceMock.sendPasswordResetEmail.mockResolvedValue(undefined);

      await service.requestPasswordReset('juan@example.com');
      await new Promise((resolve) => setImmediate(resolve));

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1', purpose: 'password-reset' },
        expect.objectContaining({ expiresIn: '1h' }),
      );
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
    });

    it('should not send an email when the user does not exist', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await service.requestPasswordReset('unknown@example.com');

      expect(mailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should reset the password when the token is valid', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        purpose: 'password-reset',
      });
      credentialsStrategyMock.resetPassword.mockResolvedValue(undefined);

      const result = await service.resetPassword('token', 'new-password-123');

      expect(credentialsStrategyMock.resetPassword).toHaveBeenCalledWith(
        'user-1',
        'new-password-123',
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
      });

      await expect(
        service.resetPassword('token', 'new-password-123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate the refresh token and issue a new access token with the fresh tenant', async () => {
      refreshTokensServiceMock.rotate.mockResolvedValue({
        userId: 'user-1',
        provider: CREDENTIALS_PROVIDER,
        token: 'new-refresh-token',
      });
      tenantsServiceMock.findByUserId.mockResolvedValue({ id: 'tenant-1' });
      jwtServiceMock.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refresh('old-refresh-token');

      expect(refreshTokensServiceMock.rotate).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        provider: CREDENTIALS_PROVIDER,
        tenantId: 'tenant-1',
      });
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
