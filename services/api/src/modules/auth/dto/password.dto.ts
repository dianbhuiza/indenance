import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
