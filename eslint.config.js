/* eslint sort-keys: "error" -- Organise rules */

import { globals, makeEslintConfig } from '@averay/codeformat';

export default [
  {
    ignores: ['coverage/**/*', 'dist/**/*'],
  },
  ...makeEslintConfig({ tsconfigPath: './tsconfig.json' }),
  {
    files: ['src/**/*'],
    languageOptions: {
      globals: { ...globals.node, NodeJS: 'readonly' },
    },
  },
  {
    files: ['test/**/*'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, NodeJS: 'readonly' },
    },
    rules: {
      'unicorn/prefer-module': 'off',
    },
  },
];
