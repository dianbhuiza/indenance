import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Request as ExpressRequest, Response } from 'express';
import { AppConfig } from '../../config/app.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  CLIENT_PLATFORM_HEADER,
  NATIVE_CLIENT_PLATFORM,
} from './client-platform';
import type { LoginDto, VerifyEmailDto } from './dto/register.dto';

const authServiceMock = {
  register: jest.fn(),
  verifyEmail: jest.fn(),
  login: jest.fn(),
  oauthLogin: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
};

const makeRequest = (
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
): ExpressRequest => ({ headers, cookies }) as unknown as ExpressRequest;

const makeNativeRequest = (cookies: Record<string, string> = {}) =>
  makeRequest({ [CLIENT_PLATFORM_HEADER]: NATIVE_CLIENT_PLATFORM }, cookies);

const makeResponse = () => {
  const cookie = jest.fn();
  const clearCookie = jest.fn();
  const res = { cookie, clearCookie } as unknown as Response;
  return { res, cookie, clearCookie };
};

const loginDto: LoginDto = {
  email: 'juan@example.com',
  password: 'password-123',
};

const verifyEmailDto: VerifyEmailDto = { token: 'verification-token' };

const session = {
  user: { id: 'user-1', email: 'juan@example.com' },
  tenant: { id: 'tenant-1', name: 'Mi hogar' },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

const webSession = {
  user: session.user,
  tenant: session.tenant,
  accessToken: session.accessToken,
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: AppConfig,
          useValue: {
            frontendUrl: undefined,
            nodeEnv: 'development',
            jwtRefreshExpiresIn: '7d',
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('hides the refresh token from web clients', async () => {
      authServiceMock.login.mockResolvedValue(session);
      const { res, cookie } = makeResponse();

      const result = await controller.login(loginDto, makeRequest(), res);

      expect(result).toEqual(webSession);
      expect(result).not.toHaveProperty('refreshToken');
      expect(cookie).toHaveBeenCalledWith(
        'refresh_token',
        session.refreshToken,
        expect.any(Object),
      );
    });

    it('returns the refresh token to native clients', async () => {
      authServiceMock.login.mockResolvedValue(session);
      const { res } = makeResponse();

      const result = await controller.login(loginDto, makeNativeRequest(), res);

      expect(result).toEqual(session);
    });

    it('is case-insensitive on the platform header', async () => {
      authServiceMock.login.mockResolvedValue(session);
      const { res } = makeResponse();

      const result = await controller.login(
        loginDto,
        makeRequest({ [CLIENT_PLATFORM_HEADER]: 'Native' }),
        res,
      );

      expect(result).toEqual(session);
    });
  });

  describe('verify-email', () => {
    it('returns the refresh token to native clients', async () => {
      authServiceMock.verifyEmail.mockResolvedValue(session);
      const { res } = makeResponse();

      const result = await controller.verifyEmail(
        verifyEmailDto,
        makeNativeRequest(),
        res,
      );

      expect(result).toEqual(session);
    });

    it('hides the refresh token from web clients', async () => {
      authServiceMock.verifyEmail.mockResolvedValue(session);
      const { res } = makeResponse();

      const result = await controller.verifyEmail(
        verifyEmailDto,
        makeRequest(),
        res,
      );

      expect(result).toEqual(webSession);
      expect(result).not.toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      authServiceMock.refresh.mockResolvedValue(session);
    });

    it('reads the refresh token from the cookie for web clients', async () => {
      const { res } = makeResponse();

      const result = await controller.refresh(
        makeRequest({}, { refresh_token: 'cookie-token' }),
        {},
        res,
      );

      expect(authServiceMock.refresh).toHaveBeenCalledWith('cookie-token');
      expect(result).toEqual(webSession);
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('reads the refresh token from the body for native clients', async () => {
      const { res } = makeResponse();

      const result = await controller.refresh(
        makeNativeRequest(),
        { refreshToken: 'body-token' },
        res,
      );

      expect(authServiceMock.refresh).toHaveBeenCalledWith('body-token');
      expect(result).toEqual(session);
    });

    it('falls back to the cookie for native clients without a body token', async () => {
      const { res } = makeResponse();

      await controller.refresh(
        makeNativeRequest({ refresh_token: 'cookie-token' }),
        {},
        res,
      );

      expect(authServiceMock.refresh).toHaveBeenCalledWith('cookie-token');
    });

    it('rejects when the request carries no refresh token', async () => {
      const { res } = makeResponse();

      await expect(
        controller.refresh(makeRequest(), {}, res),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authServiceMock.refresh).not.toHaveBeenCalled();
    });

    it('ignores a body token coming from a web client', async () => {
      const { res } = makeResponse();

      await expect(
        controller.refresh(makeRequest(), { refreshToken: 'body-token' }, res),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authServiceMock.refresh).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      authServiceMock.logout.mockResolvedValue({
        message: 'Logged out successfully',
      });
    });

    it('revokes the token from the cookie for web clients', async () => {
      const { res, clearCookie } = makeResponse();

      const result = await controller.logout(
        makeRequest({}, { refresh_token: 'cookie-token' }),
        {},
        res,
      );

      expect(authServiceMock.logout).toHaveBeenCalledWith('cookie-token');
      expect(clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('revokes the token from the body for native clients', async () => {
      const { res, clearCookie } = makeResponse();

      await controller.logout(
        makeNativeRequest(),
        { refreshToken: 'body-token' },
        res,
      );

      expect(authServiceMock.logout).toHaveBeenCalledWith('body-token');
      expect(clearCookie).toHaveBeenCalled();
    });

    it('ignores a body token coming from a web client', async () => {
      const { res, clearCookie } = makeResponse();

      await controller.logout(
        makeRequest(),
        { refreshToken: 'body-token' },
        res,
      );

      expect(authServiceMock.logout).not.toHaveBeenCalled();
      expect(clearCookie).toHaveBeenCalled();
    });
  });
});
