
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
				border: 'rgb(229 231 235)',
				input: 'rgb(255 255 255)',
				ring: 'rgb(59 130 246)',
				background: 'rgb(255 255 255)',
				foreground: 'rgb(51 51 51)',
				primary: {
					DEFAULT: 'rgb(59 130 246)',
					foreground: 'rgb(255 255 255)'
				},
				secondary: {
					DEFAULT: 'rgb(248 250 252)',
					foreground: 'rgb(51 51 51)'
				},
				destructive: {
					DEFAULT: 'rgb(239 68 68)',
					foreground: 'rgb(255 255 255)'
				},
				muted: {
					DEFAULT: 'rgb(248 250 252)',
					foreground: 'rgb(107 114 128)'
				},
				accent: {
					DEFAULT: 'rgb(239 246 255)',
					foreground: 'rgb(51 51 51)'
				},
				popover: {
					DEFAULT: 'rgb(255 255 255)',
					foreground: 'rgb(51 51 51)'
				},
				card: {
					DEFAULT: 'rgb(255 255 255)',
					foreground: 'rgb(51 51 51)'
				},
			},
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
