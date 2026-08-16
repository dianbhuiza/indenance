import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateShoppingListItemDto } from './create-shopping-list-item.dto';

export class UpdateShoppingListItemDto extends PartialType(
  CreateShoppingListItemDto,
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;
}
