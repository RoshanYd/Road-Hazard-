/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Government Navy Blue — primary trust color
                primary: {
                    50:  '#eef3fb',
                    100: '#d5e3f5',
                    200: '#aec7eb',
                    300: '#7aa5dc',
                    400: '#4a83cc',
                    500: '#2563b8',
                    600: '#1a4d9e',
                    700: '#163d82',
                    800: '#122f66',
                    900: '#0e2450',
                    950: '#091838',
                },
                // Saffron / Indian Accent
                accent: {
                    50:  '#fff8ed',
                    100: '#ffefd3',
                    200: '#ffdba6',
                    300: '#ffc06e',
                    400: '#ff9a35',
                    500: '#f97316',
                    600: '#ea5a0b',
                    700: '#c2420b',
                    800: '#9a3510',
                    900: '#7c2d12',
                    950: '#431407',
                },
                // Government Green (success)
                success: {
                    50:  '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                // Warning Amber
                warning: {
                    50:  '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                // Danger Red
                danger: {
                    50:  '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
                // Neutral/Slate for government UI
                gov: {
                    50:  '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
            },
            fontFamily: {
                sans: ['Noto Sans', 'Inter', 'system-ui', 'sans-serif'],
                display: ['Noto Sans', 'Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'gov-gradient': 'linear-gradient(135deg, #0e2450 0%, #1a4d9e 50%, #2563b8 100%)',
                'saffron-gradient': 'linear-gradient(135deg, #f97316 0%, #ea5a0b 100%)',
                'tricolor': 'linear-gradient(to bottom, #f97316 33%, #ffffff 33%, #ffffff 66%, #138808 66%)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            boxShadow: {
                'gov': '0 4px 6px -1px rgba(14, 36, 80, 0.15), 0 2px 4px -1px rgba(14, 36, 80, 0.08)',
                'gov-lg': '0 10px 15px -3px rgba(14, 36, 80, 0.15), 0 4px 6px -2px rgba(14, 36, 80, 0.08)',
                'gov-xl': '0 20px 25px -5px rgba(14, 36, 80, 0.15), 0 10px 10px -5px rgba(14, 36, 80, 0.06)',
            },
        },
    },
    plugins: [],
}
