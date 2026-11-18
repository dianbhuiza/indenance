import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description:
      'Refresh token. Solo se acepta cuando la petición viaja con el header X-Client-Platform: native; los clientes web lo envían en la cookie httpOnly.',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  refreshToken?: string;
}
