export const popularEmojis = [
  '🌶',
  '🤑',
  '🐙',
  '🫐',
  '🐳',
  '🤶',
  '🌲',
  '🌞',
  '🐒',
  '🐵',
  '🦊',
  '🐼',
  '🦄',
  '🐷',
  '🐧',
  '🦩',
  '👽',
  '🎈',
  '🍉',
  '🎉',
  '🐲',
  '🌎',
  '🍊',
  '🐭',
  '🍣',
  '🐥',
  '👾',
  '🥦',
  '👹',
  '🙀',
  '⛱',
  '⛵️',
  '🥳',
  '🤯',
  '🤠',
];

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
  return Math.abs(hashCode(address.toLowerCase()) % 35);
}

export function addressHashedEmoji(address: string) {
  const index = addressHashedIndex(address);
  return popularEmojis[index];
}

export function isEthAddress(address: string | null) {
  return address?.match(/^(0x)?[0-9a-fA-F]{40}$/);
}

export default {
  hashCode,
  popularEmojis,
};
