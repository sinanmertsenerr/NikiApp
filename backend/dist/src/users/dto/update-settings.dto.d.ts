import { Language, Theme, Brand } from '@prisma/client';
export declare class UpdateSettingsDto {
    language?: Language;
    theme?: Theme;
    selectedBrand?: Brand;
}
