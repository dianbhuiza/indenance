import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionContextService {
  private readonly als = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prisma: PrismaService) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => this.als.run(tx, () => fn()));
  }

  isActive(): boolean {
    return this.als.getStore() !== undefined;
  }

  client(): Prisma.TransactionClient {
    return this.als.getStore() ?? this.prisma;
  }
}
