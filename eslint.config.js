// @ts-nocheck
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'only-multiline'],
    },
  },
];