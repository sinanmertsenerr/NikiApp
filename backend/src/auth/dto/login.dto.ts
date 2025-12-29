import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com or 5551234567',
    description: 'User email or phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email veya Telefon numarası gereklidir' })
  identifier: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Şifre gereklidir' })
  password: string;
}
