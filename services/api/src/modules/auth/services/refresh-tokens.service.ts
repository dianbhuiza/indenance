import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { AppConfig } from '../../../config/app.config';
import { PrismaService } from '../../prisma/prisma.service';

export interface RotatedToken {
  userId: string;
  provider: string;
  token: string;
}

export function parseDurationToMs(value: string, fallbackMs: number): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  const units: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return match ? Number(match[1]) * units[match[2]] : fallbackMs;
}

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private issueToken(): string {
    return randomBytes(32).toString('hex');
  }

  private toExpiry(): Date {
    return new Date(
      Date.now() +
        parseDurationToMs(this.config.jwtRefreshExpiresIn, 7 * 86_400_000),
    );
  }

  async generate(userId: string, provider: string): Promise<string> {
    const token = this.issueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        provider,
        tokenHash: this.hash(token),
        expiresAt: this.toExpiry(),
      },
    });
    return token;
  }

  async rotate(refreshToken: string): Promise<RotatedToken> {
    const tokenHash = this.hash(refreshToken);
    const newToken = this.issueToken();
    const newHash = this.hash(newToken);

    const result = await this.prisma.$transaction(async (tx) => {
      const stored = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (
        !stored ||
        stored.revokedAt ||
        stored.expiresAt.getTime() < Date.now()
      ) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date(), replacedByTokenHash: newHash },
      });

      await tx.refreshToken.create({
        data: {
          userId: stored.userId,
          provider: stored.provider,
          tokenHash: newHash,
          expiresAt: this.toExpiry(),
        },
      });

      return stored;
    });

    return {
      userId: result.userId,
      provider: result.provider,
      token: newToken,
    };
  }

  async revoke(refreshToken: string): Promise<void> {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
