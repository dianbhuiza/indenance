import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../../../config/app.config';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokensService } from './refresh-tokens.service';

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  const prismaMock = {
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const configMock = {
    jwtRefreshExpiresIn: '7d',
  } as unknown as AppConfig;

  const storedTokenMock = {
    id: 'rt-1',
    userId: 'user-1',
    provider: 'credentials',
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AppConfig, useValue: configMock },
      ],
    }).compile();

    service = module.get<RefreshTokensService>(RefreshTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('persists a hashed token bound to the user and provider', async () => {
      prismaMock.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const token = await service.generate('user-1', 'credentials');

      expect(token).toEqual(expect.any(String));
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: 'credentials',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('rotate', () => {
    it('revokes the old token and issues a new one', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(storedTokenMock);
      prismaMock.$transaction.mockResolvedValue([]);

      const result = await service.rotate('refresh-token');

      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
          replacedByTokenHash: expect.any(String),
        }),
      });
      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          provider: 'credentials',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.userId).toBe('user-1');
      expect(result.provider).toBe('credentials');
      expect(result.token).toEqual(expect.any(String));
    });

    it('throws when the token does not exist', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotate('unknown')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when the token was already revoked', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...storedTokenMock,
        revokedAt: new Date(),
      });

      await expect(service.rotate('revoked')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when the token has expired', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...storedTokenMock,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(service.rotate('expired')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('revoke', () => {
    it('marks the token as revoked', async () => {
      prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.revoke('refresh-token');

      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String), revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });
  });
});
