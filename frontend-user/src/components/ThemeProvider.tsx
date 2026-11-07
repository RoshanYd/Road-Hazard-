'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => {},
    isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Default mode is strictly Light mode
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Default is always Light mode. Only use dark if the user explicitly selected and saved 'dark'.
        const saved = localStorage.getItem('MargRakshak-theme') as Theme | null;
        if (saved === 'dark') {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('MargRakshak-theme', theme);
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}
