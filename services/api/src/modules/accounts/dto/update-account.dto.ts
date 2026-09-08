import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Tarjeta de crédito' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'MXN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a 3-letter ISO 4217 code (e.g. MXN)',
  })
  currency?: string;
}
