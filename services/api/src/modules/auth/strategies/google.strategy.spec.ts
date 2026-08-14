import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../../../config/app.config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleStrategy, GOOGLE_PROVIDER } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  const prismaMock = {
    authMethod: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const configMock = {
    googleClientId: 'test-client-id',
    googleClientSecret: 'test-client-secret',
    googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
  } as AppConfig;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AppConfig, useValue: configMock },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
    expect(strategy.provider).toBe(GOOGLE_PROVIDER);
  });

  it('validate() maps the google profile to an OAuthProfile', () => {
    const profile = {
      id: 'google-sub-1',
      displayName: 'Juan Pérez',
      emails: [{ value: 'juan@example.com' }],
      photos: [{ value: 'https://example.com/avatar.jpg' }],
    } as never;

    const result = strategy.validate('', '', profile);

    expect(result).toEqual({
      provider: 'google',
      providerAccountId: 'google-sub-1',
      email: 'juan@example.com',
      name: 'Juan Pérez',
      picture: 'https://example.com/avatar.jpg',
      emailVerified: false,
    });
  });

  it('validate() throws when the google account has no email', () => {
    const profile = {
      id: 'google-sub-1',
      displayName: 'Juan',
      emails: [],
    } as never;

    expect(() => strategy.validate('', '', profile)).toThrow();
  });

  it('create() stores an auth method without password', async () => {
    prismaMock.authMethod.create.mockResolvedValue({
      id: 'method-1',
      provider: 'google',
    });

    const result = await strategy.create({
      userId: 'user-1',
      providerAccountId: 'google-sub-1',
    });

    expect(prismaMock.authMethod.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-1',
      },
      select: { id: true, provider: true },
    });
    expect(result).toEqual({ id: 'method-1', provider: 'google' });
  });

  it('findMethod() looks up the provider account link', async () => {
    prismaMock.authMethod.findFirst.mockResolvedValue({
      id: 'method-1',
      userId: 'user-1',
    });

    const result = await strategy.findMethod('google-sub-1');

    expect(prismaMock.authMethod.findFirst).toHaveBeenCalledWith({
      where: { provider: 'google', providerAccountId: 'google-sub-1' },
      select: { id: true, userId: true },
    });
    expect(result).toEqual({ id: 'method-1', userId: 'user-1' });
  });
});
