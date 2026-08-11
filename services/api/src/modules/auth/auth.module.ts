import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { BcryptService } from './services/bcrypt.service';
import { AUTH_STRATEGIES } from './strategies/auth-strategy.interface';
import { CredentialsStrategy } from './strategies/credentials.strategy';

@Module({
  imports: [PrismaModule, UsersModule, TenantsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    BcryptService,
    CredentialsStrategy,
    {
      provide: AUTH_STRATEGIES,
      useFactory: (credentials: CredentialsStrategy) => [credentials],
      inject: [CredentialsStrategy],
    },
  ],
  exports: [AuthGuard, AUTH_STRATEGIES],
})
export class AuthModule {}
