import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BcryptService } from '../services/bcrypt.service';
import {
  AuthStrategy,
  CredentialsInput,
  CreateAuthMethodInput,
  ValidatedAuthResult,
} from './auth-strategy.interface';

export const CREDENTIALS_PROVIDER = 'credentials';

@Injectable()
export class CredentialsStrategy implements AuthStrategy {
  readonly provider = CREDENTIALS_PROVIDER;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
  ) {}

  async create(input: CreateAuthMethodInput) {
    const password = await this.bcrypt.hash(input.password);

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

  async validate(input: CredentialsInput): Promise<ValidatedAuthResult | null> {
    const method = await this.prisma.authMethod.findUnique({
      where: {
        provider_providerAccountId: {
          provider: this.provider,
          providerAccountId: input.email,
        },
      },
    });

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
}
