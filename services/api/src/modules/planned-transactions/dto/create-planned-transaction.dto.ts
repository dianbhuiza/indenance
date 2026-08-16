import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Interval, TransactionType } from '../../../../generated/prisma/client';

export class CreatePlannedTransactionDto {
  @ApiProperty({ example: '0d2b3b28-0a3a-4f6b-9b9e-4b6d0f1a2b3c' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiPropertyOptional({
    example: '2026-08-20T15:00:00.000Z',
    description: 'Fecha en que debe ejecutarse la transacción',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: Interval,
    example: Interval.MONTHLY,
    description: 'Obligatorio cuando isRecurring es true',
  })
  @IsOptional()
  @IsEnum(Interval)
  interval?: Interval;

  @ApiPropertyOptional({ example: 'c1d9d0e3-2f0a-4b2c-8a4e-9f3e2d1a0b0c' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
