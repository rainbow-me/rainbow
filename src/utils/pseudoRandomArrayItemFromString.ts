// For a given string, will always return same item from an array.
export default function pseudoRandomArrayItemFromString<T>(
  string: string,
  array: T[]
): T | null {
  if (!string) return null;

  const numberFromString = [...string]
    .map(char => char.toLowerCase().charCodeAt(0))
    .reduce((acc, v) => acc + v, 0);

  const pseudoRandomIndex = numberFromString % array.length;

  return array[pseudoRandomIndex];
}
