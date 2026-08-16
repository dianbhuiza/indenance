import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV') ?? 'development';
  }

  get port(): number {
    return this.config.get<number>('PORT') ?? 3000;
  }

  get jwtSecret(): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (secret) return secret;
    if (this.nodeEnv === 'production')
      throw new Error('JWT_SECRET is required in production');
    return 'dev-secret';
  }

  get jwtExpiresIn(): string {
    return this.config.get<string>('JWT_EXPIRES_IN') ?? '30m';
  }

  get jwtRefreshExpiresIn(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
  }

  get googleClientId(): string | undefined {
    return this.config.get<string>('GOOGLE_CLIENT_ID');
  }

  get googleClientSecret(): string | undefined {
    return this.config.get<string>('GOOGLE_CLIENT_SECRET');
  }

  get googleCallbackUrl(): string | undefined {
    return this.config.get<string>('GOOGLE_CALLBACK_URL');
  }

  get frontendUrl(): string | undefined {
    return this.config.get<string>('FRONTEND_URL');
  }

  get resendApiKey(): string | undefined {
    return this.config.get<string>('RESEND_API_KEY');
  }

  get emailFrom(): string {
    return (
      this.config.get<string>('EMAIL_FROM') ??
      'Indenance <onboarding@resend.dev>'
    );
  }

  get plannedTxCron(): string {
    return this.config.get<string>('PLANNED_TX_CRON') ?? '0 * * * *';
  }
}
