import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Request,
} from '@nestjs/common';
import { Tenant } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  async findMyTenant(
    @Request() request: AuthenticatedRequest,
  ): Promise<Tenant> {
    const tenant = await this.tenantsService.findByUserId(request.user.userId);
    if (!tenant) throw new NotFoundException('User has no tenant');
    return tenant;
  }

  @Patch(':id')
  async update(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    if (request.user.tenantId !== id)
      throw new ForbiddenException('You can only update your own tenant');
    return this.tenantsService.update(id, updateTenantDto);
  }
}
