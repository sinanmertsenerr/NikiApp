import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneCodeDto {
    @ApiProperty({ example: '+905551234567', description: 'Phone number with country code' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'Geçerli bir telefon numarası giriniz' })
    phone: string;
}

export class VerifyPhoneCodeDto {
    @ApiProperty({ example: '+905551234567', description: 'Phone number with country code' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: '123456', description: '6-digit verification code' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/, { message: 'Geçerli bir 6 haneli kod giriniz' })
    code: string;
}
