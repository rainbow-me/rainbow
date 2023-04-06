export function getCircularReferenceReplacer() {
  const seen = new WeakMap();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        let path = seen.get(value);
        if (path === '') {
          path = 'the root object';
        }
        return 'circular reference which points to ' + path + '.';
      }
      seen.set(value, key);
    }
    return value;
  };
}
