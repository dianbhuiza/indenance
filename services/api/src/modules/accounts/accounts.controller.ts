import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { Account } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateAccountDto,
  ): Promise<Account> {
    return this.accountsService.create(
      request.user.userId,
      request.user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(@Request() request: AuthenticatedRequest): Promise<Account[]> {
    return this.accountsService.findAll(
      request.user.userId,
      request.user.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Account> {
    return this.accountsService.findOne(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<Account> {
    return this.accountsService.update(
      request.user.userId,
      request.user.tenantId,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Account> {
    return this.accountsService.remove(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }
}
