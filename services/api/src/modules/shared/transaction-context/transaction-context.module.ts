import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransactionContextService } from './transaction-context.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TransactionContextService],
  exports: [TransactionContextService],
})
export class TransactionContextModule {}
