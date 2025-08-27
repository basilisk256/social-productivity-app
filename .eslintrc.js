module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  rules: {
    // Prevent const reassignment
    'no-const-assign': 'error',
    
    // Prevent parameter reassignment (but allow props modification)
    'no-param-reassign': ['error', { 'props': false }],
    
    // Prevent reassignment of function parameters
    'no-func-assign': 'error',
    
    // Prevent reassignment of imported bindings
    'no-import-assign': 'error',
    
    // React specific rules
    'react/prop-types': 'off', // We're using TypeScript-like props
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    
    // Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General code quality
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console for debugging
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
