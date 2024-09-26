const cache: { [key: string]: number } = {};

// For a given string, will always return same item from an array.
export default function pseudoRandomArrayItemFromString<T>(string: string, array: T[]): T | null {
  if (!string) return null;

  if (!cache[string]) {
    cache[string] = [...string].map(char => char.toLowerCase().charCodeAt(0)).reduce((acc, v) => acc + v, 0);
  }

  const pseudoRandomIndex = cache[string] % array.length;

  return array[pseudoRandomIndex];
}
