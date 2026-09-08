import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/app-config.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { HealthModule } from './modules/health/health.module';
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
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    AccountsModule,
    BudgetsModule,
    CategoriesModule,
    HealthModule,
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
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}