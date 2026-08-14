import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../../config/app.config';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { BcryptService } from './services/bcrypt.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { AUTH_STRATEGIES } from './strategies/auth-strategy.interface';
import { CredentialsStrategy } from './strategies/credentials.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    TenantsModule,
    PassportModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    JwtModule.registerAsync({
      global: true,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtExpiresIn,
        } as JwtSignOptions,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    BcryptService,
    RefreshTokensService,
    CredentialsStrategy,
    {
      provide: GoogleStrategy,
      useFactory: (prisma: PrismaService, config: AppConfig) =>
        config.googleClientId && config.googleClientSecret
          ? new GoogleStrategy(prisma, config)
          : null,
      inject: [PrismaService, AppConfig],
    },
    {
      provide: AUTH_STRATEGIES,
      useFactory: (
        credentials: CredentialsStrategy,
        google: GoogleStrategy | null,
      ) => [credentials, ...(google ? [google] : [])],
      inject: [CredentialsStrategy, GoogleStrategy],
    },
  ],
  exports: [AuthGuard, AUTH_STRATEGIES],
})
export class AuthModule {}
