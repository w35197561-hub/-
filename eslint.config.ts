import { globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import skipFormatting from 'eslint-config-prettier/flat'

export default tseslint.config(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/*.cjs', 'server/**']),

  ...tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  skipFormatting,
)
