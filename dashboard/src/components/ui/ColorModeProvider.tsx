'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useThemeStore } from '../../store';

type ColorMode = 'light' | 'dark';

interface ColorModeContextValue {
    colorMode: ColorMode;
    toggleColorMode: () => void;
    setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined);

export function ColorModeProvider({ children }: { children: ReactNode }) {
    const { colorMode, toggleColorMode, setColorMode } = useThemeStore();

    // Sync with HTML data-theme attribute for CSS
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorMode);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(colorMode);
    }, [colorMode]);

    return (
        <ColorModeContext.Provider value={{ colorMode, toggleColorMode, setColorMode }}>
            {children}
        </ColorModeContext.Provider>
    );
}

export function useColorMode() {
    const context = useContext(ColorModeContext);
    if (!context) {
        throw new Error('useColorMode must be used within a ColorModeProvider');
    }
    return context;
}

export default ColorModeProvider;
