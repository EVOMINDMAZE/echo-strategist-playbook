
import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'rgb(226 232 240)',
				input: 'rgb(255 255 255)',
				ring: 'rgb(59 130 246)',
				background: 'rgb(248 250 252)',
				foreground: 'rgb(30 41 59)',
				primary: {
					DEFAULT: 'rgb(59 130 246)',
					foreground: 'rgb(255 255 255)'
				},
				secondary: {
					DEFAULT: 'rgb(241 245 249)',
					foreground: 'rgb(30 41 59)'
				},
				destructive: {
					DEFAULT: 'rgb(239 68 68)',
					foreground: 'rgb(255 255 255)'
				},
				muted: {
					DEFAULT: 'rgb(241 245 249)',
					foreground: 'rgb(100 116 139)'
				},
				accent: {
					DEFAULT: 'rgb(240 249 255)',
					foreground: 'rgb(30 41 59)'
				},
				popover: {
					DEFAULT: 'rgb(255 255 255)',
					foreground: 'rgb(30 41 59)'
				},
				card: {
					DEFAULT: 'rgb(255 255 255)',
					foreground: 'rgb(30 41 59)'
				},
				success: {
					DEFAULT: 'rgb(34 197 94)',
					foreground: 'rgb(255 255 255)'
				},
				warning: {
					DEFAULT: 'rgb(245 158 11)',
					foreground: 'rgb(255 255 255)'
				},
			},
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-in-out',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
