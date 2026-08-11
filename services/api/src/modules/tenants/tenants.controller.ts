import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Tenant } from '../../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards(AuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  async findMyTenant(@Request() request: AuthenticatedRequest): Promise<Tenant> {
    const tenant = await this.tenantsService.findByUserId(request.user.userId);
    if (!tenant) throw new NotFoundException('User has no tenant');
    return tenant;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantsService.update(id, updateTenantDto);
  }
}