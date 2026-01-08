// NikiTheCat Dashboard Theme - Chakra UI v3
// Based on NikiApp mobile theme colors
import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Primary - Niki Brand (Black cat theme) - matches mobile
        brand: {
          50: { value: '#f5f5f5' },
          100: { value: '#e0e0e0' },
          200: { value: '#bdbdbd' },
          300: { value: '#9e9e9e' },
          400: { value: '#757575' },
          500: { value: '#000000' }, // Primary black
          600: { value: '#000000' },
          700: { value: '#000000' },
          800: { value: '#000000' },
          900: { value: '#000000' },
        },
        // Secondary - Coffee tones
        coffee: {
          50: { value: '#fdf8f6' },
          100: { value: '#f5e6df' },
          200: { value: '#e6c9b8' },
          300: { value: '#c9a088' },
          400: { value: '#a87856' },
          500: { value: '#6B4423' }, // Main coffee
          600: { value: '#5a3a1e' },
          700: { value: '#4A2F17' },
          800: { value: '#3a2411' },
          900: { value: '#2a1a0c' },
        },
        // IEU Card - Orange (15% discount)
        ieu: {
          50: { value: '#fff8e1' },
          100: { value: '#ffecb3' },
          200: { value: '#ffe082' },
          300: { value: '#ffd54f' },
          400: { value: '#ffca28' },
          500: { value: '#FF9800' },
          600: { value: '#fb8c00' },
          700: { value: '#f57c00' },
          800: { value: '#ef6c00' },
          900: { value: '#e65100' },
        },
        // NIKI Card - Black (10% discount)
        niki: {
          50: { value: '#fafafa' },
          100: { value: '#f5f5f5' },
          200: { value: '#eeeeee' },
          300: { value: '#e0e0e0' },
          400: { value: '#bdbdbd' },
          500: { value: '#000000' },
          600: { value: '#000000' },
          700: { value: '#000000' },
          800: { value: '#000000' },
          900: { value: '#000000' },
        },
      },
      fonts: {
        heading: { value: '"Inter", sans-serif' },
        body: { value: '"Inter", sans-serif' },
      },
    },
    semanticTokens: {
      colors: {
        // Background
        'bg.canvas': {
          value: { _light: '#FFFFFF', _dark: '#121212' },
        },
        'bg.surface': {
          value: { _light: '#FFFFFF', _dark: '#1E1E1E' },
        },
        'bg.muted': {
          value: { _light: '#F5F5F5', _dark: '#2D2D2D' },
        },
        // Text
        'text.primary': {
          value: { _light: '#1A1A1A', _dark: '#FFFFFF' },
        },
        'text.secondary': {
          value: { _light: '#666666', _dark: '#B0B0B0' },
        },
        'text.muted': {
          value: { _light: '#999999', _dark: '#808080' },
        },
        // Border
        'border.default': {
          value: { _light: '#E0E0E0', _dark: '#333333' },
        },
        'border.muted': {
          value: { _light: '#F0F0F0', _dark: '#2D2D2D' },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
export default system;
