import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateShoppingListDto {
  @ApiProperty({ example: 'Supermercado de la semana' })
  @IsString()
  name!: string;
}
