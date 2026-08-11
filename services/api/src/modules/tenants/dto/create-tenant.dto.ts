import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Mi hogar' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}