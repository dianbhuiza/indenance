import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BcryptService } from '../services/bcrypt.service';
import {
  CreateAuthMethodInput,
  CredentialStrategy,
  ValidatedAuthResult,
} from './auth-strategy.interface';

export const CREDENTIALS_PROVIDER = 'credentials';

@Injectable()
export class CredentialsStrategy implements CredentialStrategy {
  readonly provider = CREDENTIALS_PROVIDER;
  readonly flow = 'credentials' as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
  ) {}

  async create(input: CreateAuthMethodInput) {
    const password = await this.bcrypt.hash(input.password ?? '');

    return this.prisma.authMethod.create({
      data: {
        userId: input.userId,
        provider: this.provider,
        providerAccountId: input.providerAccountId,
        password,
      },
      select: { id: true, provider: true },
    });
  }

  async authenticate(input: {
    email: string;
    password: string;
  }): Promise<ValidatedAuthResult | null> {
    const method = await this.findMethod(input.email);
    if (!method?.password) return null;

    const matches = await this.bcrypt.compare(input.password, method.password);
    if (!matches) return null;

    return {
      authMethodId: method.id,
      userId: method.userId,
      provider: method.provider,
      providerAccountId: method.providerAccountId,
    };
  }

  async findMethod(providerAccountId: string) {
    return this.prisma.authMethod.findUnique({
      where: {
        provider_providerAccountId: {
          provider: this.provider,
          providerAccountId,
        },
      },
    });
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const password = await this.bcrypt.hash(newPassword);

    const { count } = await this.prisma.authMethod.updateMany({
      where: { userId, provider: this.provider },
      data: { password },
    });

    if (count === 0)
      throw new NotFoundException('No credentials method found for this user');
  }
}
