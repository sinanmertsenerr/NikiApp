import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPhoneNumber } from '../../common/validators';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John', description: 'User first name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'User last name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Coffee enthusiast', description: 'User bio' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @ApiPropertyOptional({ example: '+905551234567', description: 'User phone number in E.164 format' })
  @IsOptional()
  @IsString()
  @IsPhoneNumber({ message: 'Geçerli bir telefon numarası giriniz (örn: +905551234567)' })
  phone?: string;
}
