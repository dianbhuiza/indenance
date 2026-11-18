import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import type { Loan, LoanInstallment } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateLoanDto,
  ): Promise<Loan> {
    return this.loansService.create(
      request.user.userId,
      request.user.tenantId,
      dto,
    );
  }

  @Get()
  findAll(
    @Request() request: AuthenticatedRequest,
    @Query('status') status?: string,
  ): Promise<Loan[]> {
    return this.loansService.findAll(
      request.user.userId,
      request.user.tenantId,
      status,
    );
  }

  @Get(':id')
  findOne(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Loan> {
    return this.loansService.findOne(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }

  @Patch(':id')
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanDto,
  ): Promise<Loan> {
    return this.loansService.update(
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
  ): Promise<Loan> {
    return this.loansService.remove(
      request.user.userId,
      request.user.tenantId,
      id,
    );
  }

  @Post(':id/installments/:installmentId/pay')
  payInstallment(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('installmentId', ParseUUIDPipe) installmentId: string,
  ): Promise<LoanInstallment> {
    return this.loansService.payInstallment(
      request.user.userId,
      request.user.tenantId,
      id,
      installmentId,
    );
  }
}
