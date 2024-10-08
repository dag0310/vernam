module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-airbnb-with-typescript',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-underscore-dangle': 'off',
    'no-continue': 'off',
    'key-spacing': 'off',
    'object-curly-newline': 'off',
    'arrow-parens': 'off',
    'max-len': 'off',
    'no-restricted-syntax': 'off',
    'semi': ['error', 'never'],
    'quote-props': 'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/max-len': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/attributes-order': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/no-v-html': 'off',
    'vuejs-accessibility/click-events-have-key-events': 'off',
    'vuejs-accessibility/form-control-has-label': 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
  },
}
