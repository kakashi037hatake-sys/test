/** @format */

// @ts-check
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
	{
		ignores: ["dist/", "node_modules/", "venv310/", "*.cjs"],
	},
	js.configs.recommended,
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				// Browser globals
				window: "readonly",
				document: "readonly",
				localStorage: "readonly",
				fetch: "readonly",
				console: "readonly",
				setTimeout: "readonly",
				setInterval: "readonly",
				clearTimeout: "readonly",
				clearInterval: "readonly",
				HTMLElement: "readonly",
				HTMLDivElement: "readonly",
				HTMLInputElement: "readonly",
				HTMLButtonElement: "readonly",
				HTMLTableElement: "readonly",
				HTMLAudioElement: "readonly",
				HTMLParagraphElement: "readonly",
				HTMLHeadingElement: "readonly",
				HTMLSpanElement: "readonly",
				HTMLUListElement: "readonly",
				HTMLLIElement: "readonly",
				HTMLAnchorElement: "readonly",
				HTMLTableSectionElement: "readonly",
				HTMLTableRowElement: "readonly",
				HTMLTableCellElement: "readonly",
				HTMLTableCaptionElement: "readonly",
				HTMLSelectElement: "readonly",
				File: "readonly",
				FormData: "readonly",
				AbortController: "readonly",
				Response: "readonly",
				KeyboardEvent: "readonly",
				// Node.js globals
				process: "readonly",
				__dirname: "readonly",
				require: "readonly",
				module: "readonly",
				exports: "readonly",
				Buffer: "readonly",
				NodeJS: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-vars": "warn",
		},
	},
];
