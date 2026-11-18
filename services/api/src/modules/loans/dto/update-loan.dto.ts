import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateLoanDto {
  @ApiPropertyOptional({ example: 'Préstamo personal' })
  @IsOptional()
  @IsString()
  name?: string;
}
