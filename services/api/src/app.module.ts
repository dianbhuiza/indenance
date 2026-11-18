import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/app-config.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { PrismaExceptionFilter } from './modules/prisma/prisma-exception.filter';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { HealthModule } from './modules/health/health.module';
import { LoansModule } from './modules/loans/loans.module';
import { MailModule } from './modules/mail/mail.module';
import { PlannedTransactionsModule } from './modules/planned-transactions/planned-transactions.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ShoppingListsModule } from './modules/shopping-lists/shopping-lists.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TransactionContextModule } from './modules/shared/transaction-context/transaction-context.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    AccountsModule,
    BudgetsModule,
    CategoriesModule,
    HealthModule,
    LoansModule,
    MailModule,
    PlannedTransactionsModule,
    PrismaModule,
    ShoppingListsModule,
    TenantsModule,
    TransactionContextModule,
    TransactionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
