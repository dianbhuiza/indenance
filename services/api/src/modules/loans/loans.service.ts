import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  Loan,
  LoanInstallment,
  PlannedTransaction,
  Transaction,
} from '../../generated/prisma/client';
import { assertTenant } from '../shared/assert-tenant';
import { assertCategoryBelongsToTenant } from '../shared/assert-category';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionContextService } from '../shared/transaction-context/transaction-context.service';
import {
  TRANSACTION_REQUESTED_EVENT,
  type TransactionRequestedPayload,
} from '../transactions/events/transaction-requested.event';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { buildInstallmentSchedule, resolveInterest } from './loan-calc';

const LOAN_INCLUDE = {
  account: true,
  category: true,
  plannedTransaction: true,
  installmentRecords: { orderBy: { number: 'asc' as const } },
} as const;

type LoanWithRelations = Loan & {
  account?: unknown;
  category?: unknown;
  installmentRecords: LoanInstallment[];
  plannedTransaction: PlannedTransaction | null;
};

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly txContext: TransactionContextService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    userId: string,
    tenantId: string | null,
    dto: CreateLoanDto,
  ): Promise<LoanWithRelations> {
    assertTenant(tenantId);
    if (this.txContext.isActive()) {
      return this.createWith(userId, tenantId, dto);
    }
    return this.txContext.run(() => this.createWith(userId, tenantId, dto));
  }

  private async createWith(
    userId: string,
    tenantId: string,
    dto: CreateLoanDto,
  ): Promise<LoanWithRelations> {
    const tx = this.txContext.client();
    await this.assertAccountBelongsToUser(tx, userId, tenantId, dto.accountId);
    await assertCategoryBelongsToTenant(tx, tenantId, dto.categoryId);
    await assertCategoryBelongsToTenant(
      tx,
      tenantId,
      dto.recurring?.categoryId,
    );

    const interest = resolveInterest({
      principal: dto.principal,
      interestPercent: dto.interestPercent,
      totalRepayment: dto.totalRepayment,
    });
    const startDate = dto.startDate ?? new Date();
    const schedule = buildInstallmentSchedule({
      totalRepayment: interest.totalRepayment,
      installments: dto.installments,
      interval: dto.interval,
      startDate,
    });
    const baseAmount = Math.floor(interest.totalRepayment / dto.installments);

    const loan = await tx.loan.create({
      data: {
        name: dto.name ?? null,
        accountId: dto.accountId,
        tenantId,
        principal: dto.principal,
        interestPercent: interest.interestPercent,
        totalRepayment: interest.totalRepayment,
        interestAmount: interest.interestAmount,
        installments: dto.installments,
        installmentAmount: baseAmount,
        interval: dto.interval,
        startDate,
        categoryId: dto.categoryId ?? null,
      },
    });

    await tx.loanInstallment.createMany({
      data: schedule.map((entry) => ({
        loanId: loan.id,
        number: entry.number,
        dueAt: entry.dueAt,
        amount: entry.amount,
      })),
    });

    if (dto.disburseNow ?? true) {
      await this.requestTransaction({
        userId,
        tenantId,
        accountId: dto.accountId,
        amount: dto.principal,
        type: 'INCOME',
      });
    }

    if (dto.recurring) {
      await this.createRecurringPayment(tx, loan.id, {
        tenantId,
        accountId: dto.accountId,
        amount: baseAmount,
        interval: dto.recurring.interval ?? dto.interval,
        scheduledAt: dto.recurring.scheduledAt ?? schedule[0].dueAt,
        requiresApproval: dto.recurring.requiresApproval ?? true,
        occurrences: dto.installments,
        categoryId: dto.recurring.categoryId ?? dto.categoryId ?? null,
      });
    }

    return tx.loan.findUniqueOrThrow({
      where: { id: loan.id },
      include: LOAN_INCLUDE,
    });
  }

  /**
   * The loan's recurring payment reuses the whole planned transaction feature
   * (interval, approval, automatic execution) with its occurrence count
   * pinned to the number of installments.
   */
  private async createRecurringPayment(
    tx: ReturnType<TransactionContextService['client']>,
    loanId: string,
    args: {
      tenantId: string;
      accountId: string;
      amount: number;
      interval: CreateLoanDto['interval'];
      scheduledAt: Date;
      requiresApproval: boolean;
      occurrences: number;
      categoryId: string | null;
    },
  ): Promise<void> {
    await tx.plannedTransaction.create({
      data: {
        accountId: args.accountId,
        tenantId: args.tenantId,
        amount: args.amount,
        type: 'EXPENSE',
        scheduledAt: args.scheduledAt,
        isRecurring: true,
        interval: args.interval,
        requiresApproval: args.requiresApproval,
        occurrences: args.occurrences,
        categoryId: args.categoryId,
        loanId,
      },
    });
  }

  async findAll(
    userId: string,
    tenantId: string | null,
    status?: string,
  ): Promise<LoanWithRelations[]> {
    assertTenant(tenantId);
    const validStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException(
        `status must be one of ${validStatuses.join(', ')}`,
      );
    }
    return this.prisma.loan.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: status as Loan['status'] | undefined,
        account: { userId },
      },
      include: LOAN_INCLUDE,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<LoanWithRelations> {
    assertTenant(tenantId);
    const loan = await this.prisma.loan.findFirst({
      where: { id, tenantId, deletedAt: null, account: { userId } },
      include: LOAN_INCLUDE,
    });
    if (!loan) throw new NotFoundException(`Loan with id ${id} not found`);
    return loan;
  }

  async update(
    userId: string,
    tenantId: string | null,
    id: string,
    dto: UpdateLoanDto,
  ): Promise<LoanWithRelations> {
    assertTenant(tenantId);
    await this.findOne(userId, tenantId, id);
    await this.prisma.loan.update({
      where: { id },
      data: { ...(dto.name !== undefined && { name: dto.name }) },
    });
    return this.findOne(userId, tenantId, id);
  }

  async payInstallment(
    userId: string,
    tenantId: string | null,
    loanId: string,
    installmentId: string,
  ): Promise<LoanInstallment> {
    assertTenant(tenantId);
    const loan = await this.findOne(userId, tenantId, loanId);
    if (loan.status !== 'ACTIVE')
      throw new BadRequestException('Loan is not active');

    const installment = await this.prisma.loanInstallment.findFirst({
      where: { id: installmentId, loanId },
    });
    if (!installment)
      throw new NotFoundException(
        `Installment with id ${installmentId} not found`,
      );
    if (installment.status !== 'PENDING')
      throw new BadRequestException(
        `Installment #${installment.number} is already paid`,
      );

    if (this.txContext.isActive()) {
      return this.payWith(userId, tenantId, loan, installment);
    }
    return this.txContext.run(() =>
      this.payWith(userId, tenantId, loan, installment),
    );
  }

  private async payWith(
    userId: string,
    tenantId: string,
    loan: LoanWithRelations,
    installment: LoanInstallment,
  ): Promise<LoanInstallment> {
    const tx = this.txContext.client();

    const claimed = await tx.loanInstallment.updateMany({
      where: { id: installment.id, status: 'PENDING' },
      data: { status: 'PAID', paidAt: new Date() },
    });
    if (claimed.count === 0)
      throw new BadRequestException(
        `Installment #${installment.number} is already paid`,
      );

    const transaction = await this.requestTransaction({
      userId,
      tenantId,
      accountId: loan.accountId,
      amount: installment.amount,
      type: 'EXPENSE',
      categoryId: loan.categoryId ?? undefined,
    });

    await tx.loanInstallment.update({
      where: { id: installment.id },
      data: { transactionId: transaction.id },
    });

    await this.completeIfFullyPaid(tx, loan.id);

    return tx.loanInstallment.findUniqueOrThrow({
      where: { id: installment.id },
    });
  }

  async remove(
    userId: string,
    tenantId: string | null,
    id: string,
  ): Promise<LoanWithRelations> {
    assertTenant(tenantId);
    const loan = await this.findOne(userId, tenantId, id);

    if (this.txContext.isActive()) {
      return this.removeWith(userId, tenantId, loan);
    }
    return this.txContext.run(() => this.removeWith(userId, tenantId, loan));
  }

  private async removeWith(
    userId: string,
    tenantId: string,
    loan: LoanWithRelations,
  ): Promise<LoanWithRelations> {
    const tx = this.txContext.client();

    await tx.loan.update({
      where: { id: loan.id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });

    if (loan.plannedTransaction) {
      await tx.plannedTransaction.updateMany({
        where: {
          id: loan.plannedTransaction.id,
          deletedAt: null,
          status: 'ACTIVE',
        },
        data: { deletedAt: new Date() },
      });
      await tx.plannedTransactionAlert.updateMany({
        where: {
          plannedTransactionId: loan.plannedTransaction.id,
          status: 'PENDING',
        },
        data: { status: 'REJECTED', resolvedAt: new Date() },
      });
    }

    return tx.loan.findUniqueOrThrow({
      where: { id: loan.id },
      include: LOAN_INCLUDE,
    });
  }

  private async completeIfFullyPaid(
    tx: ReturnType<TransactionContextService['client']>,
    loanId: string,
  ): Promise<void> {
    const pending = await tx.loanInstallment.count({
      where: { loanId, status: 'PENDING' },
    });
    if (pending > 0) return;
    await tx.loan.updateMany({
      where: { id: loanId, status: 'ACTIVE' },
      data: { status: 'COMPLETED' },
    });
  }

  private async requestTransaction(
    payload: TransactionRequestedPayload,
  ): Promise<Transaction> {
    const results = await this.eventEmitter.emitAsync(
      TRANSACTION_REQUESTED_EVENT,
      payload,
    );
    const transaction = results[0] as Transaction | undefined;
    if (!transaction)
      throw new Error('No handler processed the transaction request');
    return transaction;
  }

  private async assertAccountBelongsToUser(
    tx: ReturnType<TransactionContextService['client']>,
    userId: string,
    tenantId: string,
    accountId: string,
  ): Promise<void> {
    const account = await tx.account.findFirst({
      where: { id: accountId, userId, tenantId },
    });
    if (!account)
      throw new NotFoundException(`Account with id ${accountId} not found`);
  }
}
