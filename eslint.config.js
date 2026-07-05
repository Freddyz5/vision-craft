// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
	// Archivos/carpetas que ESLint nunca debe tocar
	{
		ignores: ["dist/**", ".astro/**", "node_modules/**", ".vercel/**", "**/*.bak"],
	},

	// Reglas base de JS + TS
	js.configs.recommended,
	...tseslint.configs.recommended,

	// Soporte para archivos .astro
	...eslintPluginAstro.configs.recommended,

	// Reglas específicas para componentes React (islas .tsx)
	{
		files: ["**/*.{jsx,tsx}"],
		plugins: {
			// eslint-plugin-react (última versión: 7.37.5) todavía no soporta la nueva
			// API de reglas de ESLint 10. fixupPluginRules() de @eslint/compat parcha
			// esa incompatibilidad. Cuando el plugin publique soporte nativo para v10,
			// este wrapper se puede quitar (ver eslint-plugin-react issue #3977).
			react: fixupPluginRules(reactPlugin),
			"react-hooks": reactHooksPlugin,
			"jsx-a11y": jsxA11y,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		settings: {
			// Versión fija en vez de "detect": evita que el plugin intente resolver
			// la versión vía context.getFilename(), que es justamente el método que
			// ESLint 10 eliminó y provoca el crash.
			react: { version: "19.2" },
		},
		rules: {
			...reactPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			...jsxA11y.configs.recommended.rules,
			// React 19 + Astro con jsx: "react-jsx" no necesita import React en scope
			"react/react-in-jsx-scope": "off",
			// Usamos TypeScript para tipar props, no prop-types
			"react/prop-types": "off",
		},
	},

	// Reglas generales de calidad (aplican a .ts/.tsx/.astro's <script>)
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"no-console": ["warn", { allow: ["warn", "error", "debug"] }],
		},
	},

	// Debe ir al final: apaga reglas de formato que chocan con Prettier
	eslintConfigPrettier,
);
