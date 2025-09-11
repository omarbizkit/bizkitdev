import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import astro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: [
      '.astro/**',
      'dist/**',
      'node_modules/**',
      'build/**',
      '*.config.js',
      '*.config.mjs',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        window: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'off'
    }
  },
  ...astro.configs.recommended,
  {
    files: ['**/*.{test,spec}.{js,ts,tsx}', 'tests/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },
  prettier
]
