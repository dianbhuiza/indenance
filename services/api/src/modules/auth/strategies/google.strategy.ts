import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';
import { AppConfig } from '../../../config/app.config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthStrategy,
  CreateAuthMethodInput,
  OAuthProfile,
} from './auth-strategy.interface';

export const GOOGLE_PROVIDER = 'google';

@Injectable()
export class GoogleStrategy
  extends PassportStrategy(Strategy, GOOGLE_PROVIDER)
  implements AuthStrategy
{
  readonly provider = GOOGLE_PROVIDER;
  readonly flow = 'oauth' as const;

  constructor(
    private readonly prisma: PrismaService,
    config: AppConfig,
  ) {
    const options: StrategyOptions = {
      clientID: config.googleClientId!,
      clientSecret: config.googleClientSecret!,
      callbackURL: config.googleCallbackUrl,
      scope: ['email', 'profile'],
      state: true,
    };
    super(options);
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): OAuthProfile {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new UnauthorizedException('Google account has no email');

    return {
      provider: GOOGLE_PROVIDER,
      providerAccountId: profile.id,
      email,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      emailVerified: profile.emails?.[0]?.verified ?? false,
    };
  }

  async create(input: CreateAuthMethodInput) {
    return this.prisma.authMethod.create({
      data: {
        userId: input.userId,
        provider: this.provider,
        providerAccountId: input.providerAccountId,
      },
      select: { id: true, provider: true },
    });
  }

  findMethod(providerAccountId: string) {
    return this.prisma.authMethod.findFirst({
      where: { provider: this.provider, providerAccountId },
      select: { id: true, userId: true },
    });
  }
}
