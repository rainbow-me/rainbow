// For a given string, will always return same item from an array.
export default function pseudoRandomArrayItemFromString(string, array) {
  const numberFromString = [...string]
    .map(char => char.toLowerCase().charCodeAt(0) - 97)
    .reduce((acc, v) => acc + v);

  const pseudoRandomIndex = Math.round(numberFromString / array.length);

  return array[pseudoRandomIndex];
}
