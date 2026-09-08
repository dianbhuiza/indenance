import { Controller, Get, Request } from '@nestjs/common';
import { Category } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() request: AuthenticatedRequest): Promise<Category[]> {
    return this.categoriesService.findAll(request.user.tenantId);
  }
}
