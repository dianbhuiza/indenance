import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/app-config.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { MailModule } from './modules/mail/mail.module';
import { PlannedTransactionsModule } from './modules/planned-transactions/planned-transactions.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ShoppingListsModule } from './modules/shopping-lists/shopping-lists.module';
import { TransactionContextModule } from './modules/shared/transaction-context/transaction-context.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AccountsModule,
    BudgetsModule,
    MailModule,
    PlannedTransactionsModule,
    PrismaModule,
    AuthModule,
    ShoppingListsModule,
    TransactionContextModule,
    TenantsModule,
    TransactionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}