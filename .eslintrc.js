module.exports = {
  extends: [
    'next/core-web-vitals',
  ],
  rules: {
    // Disable the rule for unescaped entities to make development easier
    'react/no-unescaped-entities': 'off',
    
    // Warning instead of error for hooks exhaustive deps
    'react-hooks/exhaustive-deps': 'warn',
    
    // Warning for rules of hooks
    'react-hooks/rules-of-hooks': 'warn',
  },
};
