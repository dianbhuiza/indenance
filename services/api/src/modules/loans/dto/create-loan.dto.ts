import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Interval } from '../../../generated/prisma/client';

export class RecurringLoanPaymentDto {
  @ApiPropertyOptional({
    enum: Interval,
    example: Interval.MONTHLY,
    description: 'Cadencia del pago recurrente; por defecto la del préstamo',
  })
  @IsOptional()
  @IsEnum(Interval)
  interval?: Interval;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description:
      'false = la cuota se ejecuta automáticamente; true = genera una alerta que debe aprobarse',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    example: '2026-11-05T15:00:00.000Z',
    description: 'Fecha de la primera cuota; por defecto startDate',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @ApiPropertyOptional({
    example: 'c1d9d0e3-2f0a-4b2c-8a4e-9f3e2d1a0b0c',
    description: 'Categoría de los pagos de las cuotas',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class CreateLoanDto {
  @ApiPropertyOptional({ example: 'Préstamo personal' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '0d2b3b28-0a3a-4f6b-9b9e-4b6d0f1a2b3c' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 10000, description: 'Cantidad recibida' })
  @IsInt()
  @Min(1)
  principal!: number;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Porcentaje de interés; alternativo a totalRepayment',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  interestPercent?: number;

  @ApiPropertyOptional({
    example: 11200,
    description: 'Cantidad total a devolver; alternativo a interestPercent',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalRepayment?: number;

  @ApiProperty({ example: 12, description: 'Cantidad de cuotas' })
  @IsInt()
  @Min(1)
  installments!: number;

  @ApiProperty({ enum: Interval, example: Interval.MONTHLY })
  @IsEnum(Interval)
  interval!: Interval;

  @ApiPropertyOptional({
    example: '2026-10-05T15:00:00.000Z',
    description: 'Fecha de la primera cuota; por defecto hoy',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Registrar la transacción de ingreso del capital recibido',
  })
  @IsOptional()
  @IsBoolean()
  disburseNow?: boolean;

  @ApiPropertyOptional({
    example: 'c1d9d0e3-2f0a-4b2c-8a4e-9f3e2d1a0b0c',
    description: 'Categoría de las cuotas',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    type: RecurringLoanPaymentDto,
    description: 'Crea un pago recurrente para las cuotas del préstamo',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringLoanPaymentDto)
  recurring?: RecurringLoanPaymentDto;
}
