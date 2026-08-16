import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateShoppingListItemDto {
  @ApiProperty({ example: 'Leche' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'c1d9d0e3-2f0a-4b2c-8a4e-9f3e2d1a0b0c' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
