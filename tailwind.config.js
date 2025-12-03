/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Light mode colors
                paper: '#f5f5f5',
                ink: '#1a1a1a',
                'ink-light': '#666',
                accent: '#ff6b35',
                // Dark mode colors
                'dark-bg': '#0a0a0a',
                'dark-paper': '#1a1a1a',
                'dark-ink': '#e5e5e5',
                'dark-ink-dim': '#999',
                'dark-accent': '#ff8c61',
            },
            fontFamily: {
                mono: ['Courier Prime', 'monospace'],
                serif: ['Georgia', 'serif'],
            },
            boxShadow: {
                'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
                'brutal-lg': '8px 8px 0px 0px rgba(0,0,0,0.2)',
                'brutal-dark': '4px 4px 0px 0px rgba(255,255,255,0.1)',
                'brutal-dark-lg': '8px 8px 0px 0px rgba(255,255,255,0.05)',
            },
        },
    },
    plugins: [],
}
