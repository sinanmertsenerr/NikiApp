export interface Country {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
}

export const COUNTRIES: Country[] = [
    { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '🇹🇷' },
    { code: 'AZ', name: 'Azerbaycan', dialCode: '+994', flag: '🇦🇿' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
    { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
    // Add more common countries as needed
];

export const DEFAULT_COUNTRY = COUNTRIES.find(c => c.code === 'TR')!;
