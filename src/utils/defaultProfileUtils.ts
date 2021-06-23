/* eslint-disable sort-keys */

// popularEmojisToColorIndex matches emojis to the index of their
// color backgrounds in the `avatarBackgrounds` object in colors.js
export const popularEmojisToColorIndex = {
  '🌶': 0,
  '🤑': 1,
  '🐙': 2,
  '🫐': 3,
  '🐳': 4,
  '🤶': 0,
  '🌲': 5,
  '🌞': 6,
  '🐒': 7,
  '🐵': 8,
  '🦊': 9,
  '🐼': 10,
  '🦄': 11,
  '🐷': 12,
  '🐧': 13,
  '🦩': 8,
  '👽': 14,
  '🎈': 0,
  '🍉': 8,
  '🎉': 1,
  '🐲': 15,
  '🌎': 16,
  '🍊': 17,
  '🐭': 18,
  '🍣': 19,
  '🐥': 1,
  '👾': 20,
  '🥦': 15,
  '👹': 0,
  '🙀': 17,
  '⛱': 4,
  '⛵️': 21,
  '🥳': 17,
  '🤯': 8,
  '🤠': 22,
};

export const popularEmojis = Object.keys(popularEmojisToColorIndex);
export const emojiColorIndexes = Object.values(popularEmojisToColorIndex);
const emojiCount = Object.keys(popularEmojis).length;

export function hashCode(text: string) {
  let hash = 0,
    i,
    chr;
  if (text.length === 0) return hash;
  for (i = 0; i < text.length; i++) {
    chr = text.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

export function addressHashedIndex(address: string) {
  if (address === null || address === undefined) return null;
  return Math.abs(hashCode(address.toLowerCase()) % emojiCount);
}

export function addressHashedColorIndex(address: string) {
  if (address === null || address === undefined) return null;
  return emojiColorIndexes[
    Math.abs(hashCode(address.toLowerCase()) % emojiCount)
  ];
}

export function addressHashedEmoji(address: string) {
  const index = addressHashedIndex(address);
  if (index === null || index === undefined) return null;
  return popularEmojis[index];
}

export function isEthAddress(address: string | null) {
  return address?.match(/^(0x)?[0-9a-fA-F]{40}$/);
}
