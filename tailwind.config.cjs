/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#080B14',
        surface: '#11182B',
        elevated: '#171E33',
        'surface-2': '#202943',
        border: '#2A3555',
        brand: '#6D5DFC',
        accent: '#B5ACFF',
        info: '#70D7FF',
        event: '#F6D47A',
        ink: '#F5F7FB',
        muted: '#98A2B3',
      },
      borderRadius: {
        sm: '10px',
        control: '14px',
        card: '18px',
        panel: '24px',
        pill: '40px',
      },
      fontFamily: {
        body: ['Inter_400Regular'],
        label: ['Inter_600SemiBold'],
        display: ['SpaceGrotesk_700Bold'],
      },
    },
  },
  plugins: [],
};
