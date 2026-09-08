import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateShoppingListDto {
  @ApiProperty({ example: 'Supermercado de la semana' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}
