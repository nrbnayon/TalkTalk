// const defaultTheme = require("tailwindcss/defaultTheme");
// const colors = require("tailwindcss/colors");
// const {
//   default: flattenColorPalette,
// } = require("tailwindcss/lib/util/flattenColorPalette");

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./pages/**/*.{js,ts,jsx,tsx,mdx}",
//     "./components/**/*.{js,ts,jsx,tsx,mdx}",
//     "./app/**/*.{js,ts,jsx,tsx,mdx}",
//     "./src/**/*.{js,ts,jsx,tsx,mdx}",
//   ],
//   darkMode: "class",
//   theme: {
//     container: {
//       center: true,
//       padding: "2rem",
//       screens: {
//         "2xl": "1400px",
//       },
//     },
//     extend: {
//       boxShadow: {
//         input: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
//       },
//       screens: {
//         xss: "300px",
//         xs: "360px",
//         xsm: "400px",
//         mobile: "280px",
//         "mobile-lg": "450px",
//         ...defaultTheme.screens,
//       },
//       colors: {
//         ...colors,
//         background: "#F8FAF9",
//         slateHeader: "#454545",
//         "slateHeader-2": "#5D5D5D",
//         lineColor: "#4EA8E9",
//         foreground: "hsl(var(--foreground))",
//         primaryColor: "#1A7865",
//         "primary-green": "#486a45",
//         "primary-purple": "#a45cf9",
//         "primary-gray": "#b8b8ba",
//         "event-primary-green": "#16a87b",
//         "scroll-bar-color": "#E7E7F1",
//         "landing-page-background": "#EAF5FF",
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//         border: "hsl(var(--border) / <alpha-value>)",
//         input: "hsl(var(--input) / <alpha-value>)",
//         ring: "hsl(var(--ring) / <alpha-value>)",
//         background: "hsl(var(--background) / <alpha-value>)",
//         foreground: "hsl(var(--foreground) / <alpha-value>)",
//         primary: {
//           DEFAULT: "hsl(var(--primary) / <alpha-value>)",
//           foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
//           foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
//           foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted) / <alpha-value>)",
//           foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent) / <alpha-value>)",
//           foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover) / <alpha-value>)",
//           foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card) / <alpha-value>)",
//           foreground: "hsl(var(--card-foreground) / <alpha-value>)",
//         },
//         "primary-green": "#486a45",
//         "primary-purple": "#a45cf9",
//         "primary-gray": "#b8b8ba",
//         "event-primary-green": "#16a87b",
//         "scroll-bar-color": "#E7E7F1",
//         "landing-page-background": "#EAF5FF",
//         chart: {
//           1: "hsl(var(--chart-1) / <alpha-value>)",
//           2: "hsl(var(--chart-2) / <alpha-value>)",
//           3: "hsl(var(--chart-3) / <alpha-value>)",
//           4: "hsl(var(--chart-4) / <alpha-value>)",
//           5: "hsl(var(--chart-5) / <alpha-value>)",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: `calc(var(--radius) - 2px)`,
//         sm: `calc(var(--radius) - 4px)`,
//       },
//       fontFamily: {
//         sans: [...defaultTheme.fontFamily.sans],
//       },
//       fontSize: {
//         xss: ["0.625rem", { lineHeight: "1rem" }],
//       },
//       backgroundImage: {
//         "text-gradient": "linear-gradient(to right, #C7253E, #8f3d77)",
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: "0" },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: "0" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//       },
//     },
//   },
//   plugins: [
//     addVariablesForColors,
//     require("tailwindcss-animate"),
//     require("@tailwindcss/forms"),
//     require("@tailwindcss/typography"),
//   ],
// };

// /**
//  * Custom Tailwind CSS Plugin: Adds CSS variables for all theme colors.
//  *
//  * @param {Object} helpers - Tailwind plugin helpers
//  */

// function addVariablesForColors({ addBase, theme }) {
//   const allColors = flattenColorPalette(theme("colors"));
//   const newVars = Object.fromEntries(
//     Object.entries(allColors).map(([key, value]) => [`--${key}`, value])
//   );

//   addBase({
//     ":root": newVars,
//   });
// }

const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "class"],
  theme: {
  	extend: {
  		minHeight: {
  			'screen-200px': 'calc(100vh - 200px)'
  		},
  		boxShadow: {
  			input: '`0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`'
  		},
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [addVariablesForColors],
};

/**
 * Custom Tailwind CSS Plugin: Adds CSS variables for all theme colors.
 *
 * @param {Object} helpers - Tailwind plugin helpers
 */
function addVariablesForColors({ addBase, theme }) {
  const allColors = flattenColorPalette(theme("colors")); // Flatten color palette
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, value]) => [`--${key}`, value])
  );

  addBase({
    ":root": newVars, // Add CSS variables to the root selector
  });
}
