import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from '../../common/validators';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email gereklidir' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (min 8 chars, 1 uppercase, 1 number)',
  })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @MaxLength(50, { message: 'Şifre en fazla 50 karakter olabilir' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
  })
  password: string;

  @ApiProperty({
    example: 'Ahmet',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Ad gereklidir' })
  @MinLength(2, { message: 'Ad en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Ad en fazla 50 karakter olabilir' })
  firstName: string;

  @ApiProperty({
    example: 'Yılmaz',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Soyad gereklidir' })
  @MinLength(2, { message: 'Soyad en az 2 karakter olmalıdır' })
  @MaxLength(50, { message: 'Soyad en fazla 50 karakter olabilir' })
  lastName: string;

  @ApiProperty({
    example: '+905551234567',
    description: 'User phone number in E.164 format (e.g., +905551234567)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Telefon numarası gereklidir' })
  @IsPhoneNumber({ message: 'Geçerli bir telefon numarası giriniz (örn: +905551234567)' })
  phone: string;
}
