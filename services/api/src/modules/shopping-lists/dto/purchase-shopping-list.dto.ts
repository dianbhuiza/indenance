import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PurchaseShoppingListDto {
  @ApiProperty({ example: '0d2b3b28-0a3a-4f6b-9b9e-4b6d0f1a2b3c' })
  @IsString()
  accountId!: string;

  @ApiPropertyOptional({ example: 'c1d9d0e3-2f0a-4b2c-8a4e-9f3e2d1a0b0c' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
