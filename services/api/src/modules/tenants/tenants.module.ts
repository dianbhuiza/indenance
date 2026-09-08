import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
