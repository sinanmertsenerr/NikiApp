import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language, Theme, Brand } from '@prisma/client';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: Language, example: 'tr', description: 'Preferred language' })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({ enum: Theme, example: 'dark', description: 'Preferred theme' })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({ enum: Brand, example: 'coffee', description: 'Selected brand' })
  @IsOptional()
  @IsEnum(Brand)
  selectedBrand?: Brand;
}
