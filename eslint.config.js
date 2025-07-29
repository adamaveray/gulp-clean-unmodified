/* eslint sort-keys: "error" -- Organise rules */

import { globals, makeEslintConfig } from '@averay/codeformat';

export default [
  {
    ignores: ['dist/**/*'],
  },
  ...makeEslintConfig({ tsconfigPath: './tsconfig.json' }),
  {
    files: ['src/**/*', 'test/**/*'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
