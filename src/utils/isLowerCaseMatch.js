export default function isLowerCaseMatch(a, b) {
  const _a = a || '';
  const _b = b || '';
  return _a.toLowerCase() === _b.toLowerCase();
}
