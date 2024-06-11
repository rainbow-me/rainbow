module.exports = {
  '*.{js,jsx}': ['prettier --write .', 'eslint --cache . --quiet'],
  '*.{ts,tsx}': [() => 'tsc --skipLibCheck --noEmit'],
};
