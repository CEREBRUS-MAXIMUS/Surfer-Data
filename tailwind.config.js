const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      xs: '480px', // Extra small devices
      sm: '640px', // Small devices (mobile phones)
      md: '768px', // Medium devices (tablets)
      lg: '1024px', // Large devices (desktops)
      xl: '1280px', // Extra large devices (large desktops)
      '2xl': '1536px', // 2X large devices
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: {
          DEFAULT: 'hsl(var(--border))',
          light: 'hsl(var(--border-light))',
        },
        input: {
          DEFAULT: 'hsl(var(--input))',
          light: 'hsl(var(--input-light))',
        },
        ring: 'hsl(var(--ring))',
        background: {
          DEFAULT: 'hsl(var(--background))',
          light: 'hsl(var(--background-light))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          light: 'hsl(var(--foreground-light))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light: 'hsl(var(--primary-light))',
          'foreground-light': 'hsl(var(--primary-foreground-light))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          light: 'hsl(var(--secondary-light))',
          'foreground-light': 'hsl(var(--secondary-foreground-light))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        niramit: ['var(--font-niramit)', ...fontFamily.sans],
        bricolage: ['var(--font-bricolage)', ...fontFamily.sans],
        gurajada: ['var(--font-gurajada)', ...fontFamily.serif],
        averia: ['var(--font-averia)', ...fontFamily.sans],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.1s ease-out',
        'accordion-up': 'accordion-up 0.1s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
