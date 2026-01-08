// Theme Store - Zustand (Dark Mode Control)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ColorMode = 'light' | 'dark';

interface ThemeStore {
    colorMode: ColorMode;
    toggleColorMode: () => void;
    setColorMode: (mode: ColorMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            colorMode: 'dark', // Default to dark mode

            toggleColorMode: () =>
                set((state) => ({
                    colorMode: state.colorMode === 'light' ? 'dark' : 'light',
                })),

            setColorMode: (mode) => set({ colorMode: mode }),
        }),
        {
            name: 'theme-storage',
        }
    )
);

export default useThemeStore;
