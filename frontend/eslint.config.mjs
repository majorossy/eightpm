import js from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

export default [
    // Ignores (must be first)
    {
        ignores: [
            '**/.next/**',
            '**/node_modules/**',
            '**/out/**',
            '**/public/**',
            '**/*.config.js',
            '**/*.config.mjs',
            '**/*.spec.tsx',
            '**/*.spec.ts',
            '**/*.js',
            '.storybook/**',
        ],
    },

    // Base configs
    js.configs.recommended,
    ...typescriptEslint.configs.recommended,

    // Plugins
    {
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'jsx-a11y': jsxA11yPlugin,
            '@next/next': nextPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // Browser globals
    {
        languageOptions: {
            globals: { ...globals.browser },
        },
    },

    // React rules
    {
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooksPlugin.configs.recommended.rules,
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/refs': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'warn',
            'react/no-unknown-property': ['error', { ignore: ['jsx', 'global'] }],
        },
    },

    // Next.js rules
    {
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,
        },
    },

    // TypeScript specific (type-aware)
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'warn',
            '@typescript-eslint/no-require-imports': 'warn',
            '@typescript-eslint/no-misused-promises': [
                'warn',
                {
                    checksVoidReturn: {
                        attributes: false,
                    },
                },
            ],
        },
    },

    // Project-specific overrides
    {
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'error',
            'react/display-name': 'warn',
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['../../../*'],
                            message: 'Use @/ alias instead of deep relative imports',
                        },
                    ],
                },
            ],
        },
    },
];
