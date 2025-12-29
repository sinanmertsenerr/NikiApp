// Brand Configuration

export type BrandType = 'coffee' | 'sandwich';

export interface BrandConfig {
  id: BrandType;
  name: string;
  tagline: string;
  logo: any;
  logoLight: any; // For dark mode (white/light colored logo)
  primaryColor: string;
  secondaryColor: string;
}

export const BRANDS: Record<BrandType, BrandConfig> = {
  coffee: {
    id: 'coffee',
    name: 'Niki Coffee',
    tagline: 'The Cat Coffee',
    logo: require('../../assets/images/brands/niki-logo.png'),
    logoLight: require('../../assets/images/brands/niki-logo.png'), // Same image, will use tintColor
    primaryColor: '#000000',
    secondaryColor: '#6B4423',
  },
  sandwich: {
    id: 'sandwich',
    name: 'Niki Sandwich',
    tagline: 'The Cat Sandwich',
    logo: require('../../assets/images/brands/niki-logo.png'),
    logoLight: require('../../assets/images/brands/niki-logo.png'),
    primaryColor: '#000000',
    secondaryColor: '#2E7D32',
  },
};

export const DEFAULT_BRAND: BrandType = 'coffee';
