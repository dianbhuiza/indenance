import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { BcryptService } from '../services/bcrypt.service';
import {
  CredentialsStrategy,
  CREDENTIALS_PROVIDER,
} from './credentials.strategy';

describe('CredentialsStrategy', () => {
  let strategy: CredentialsStrategy;
  const bcryptMock = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  const prismaMock = {
    authMethod: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsStrategy,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BcryptService, useValue: bcryptMock },
      ],
    }).compile();

    strategy = module.get<CredentialsStrategy>(CredentialsStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
    expect(strategy.provider).toBe(CREDENTIALS_PROVIDER);
  });

  it('create() hashes the password before storing the auth method', async () => {
    bcryptMock.hash.mockResolvedValue('hashed-password');
    prismaMock.authMethod.create.mockResolvedValue({
      id: 'method-1',
      provider: 'credentials',
    });

    const result = await strategy.create({
      userId: 'user-1',
      providerAccountId: 'juan@example.com',
      password: 'super-secret',
    });

    expect(bcryptMock.hash).toHaveBeenCalledWith('super-secret');
    expect(prismaMock.authMethod.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        provider: 'credentials',
        providerAccountId: 'juan@example.com',
        password: 'hashed-password',
      },
      select: { id: true, provider: true },
    });
    expect(result).toEqual({ id: 'method-1', provider: 'credentials' });
  });

  it('authenticate() returns the identity when credentials match', async () => {
    prismaMock.authMethod.findUnique.mockResolvedValue({
      id: 'method-1',
      userId: 'user-1',
      provider: 'credentials',
      providerAccountId: 'juan@example.com',
      password: 'hashed-password',
    });
    bcryptMock.compare.mockResolvedValue(true);

    const result = await strategy.authenticate({
      email: 'juan@example.com',
      password: 'super-secret',
    });

    expect(prismaMock.authMethod.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: 'juan@example.com',
        },
      },
    });
    expect(result).toEqual({
      authMethodId: 'method-1',
      userId: 'user-1',
      provider: 'credentials',
      providerAccountId: 'juan@example.com',
    });
  });

  it('authenticate() returns null when the password does not match', async () => {
    prismaMock.authMethod.findUnique.mockResolvedValue({
      id: 'method-1',
      userId: 'user-1',
      provider: 'credentials',
      providerAccountId: 'juan@example.com',
      password: 'hashed-password',
    });
    bcryptMock.compare.mockResolvedValue(false);

    const result = await strategy.authenticate({
      email: 'juan@example.com',
      password: 'wrong-password',
    });

    expect(result).toBeNull();
  });

  it('authenticate() returns null when no auth method exists', async () => {
    prismaMock.authMethod.findUnique.mockResolvedValue(null);

    const result = await strategy.authenticate({
      email: 'unknown@example.com',
      password: 'whatever',
    });

    expect(result).toBeNull();
  });

  it('findMethod() returns the raw auth method', async () => {
    prismaMock.authMethod.findUnique.mockResolvedValue({
      id: 'method-1',
      userId: 'user-1',
      provider: 'credentials',
      providerAccountId: 'juan@example.com',
      password: 'hashed-password',
    });

    const result = await strategy.findMethod('juan@example.com');

    expect(prismaMock.authMethod.findUnique).toHaveBeenCalledWith({
      where: {
        provider_providerAccountId: {
          provider: 'credentials',
          providerAccountId: 'juan@example.com',
        },
      },
    });
    expect(result?.id).toBe('method-1');
  });

  it('resetPassword() hashes the new password and updates the auth method', async () => {
    bcryptMock.hash.mockResolvedValue('new-hashed-password');
    prismaMock.authMethod.updateMany.mockResolvedValue({ count: 1 });

    await strategy.resetPassword('user-1', 'new-super-secret');

    expect(bcryptMock.hash).toHaveBeenCalledWith('new-super-secret');
    expect(prismaMock.authMethod.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', provider: 'credentials' },
      data: { password: 'new-hashed-password' },
    });
  });

  it('resetPassword() throws when no credentials method matches', async () => {
    bcryptMock.hash.mockResolvedValue('new-hashed-password');
    prismaMock.authMethod.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      strategy.resetPassword('user-x', 'new-super-secret'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
