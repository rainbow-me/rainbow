import colors from '../styles/colors';
import { EthereumAddress } from '@/entities/wallet';
import { fetchReverseRecord } from '@/handlers/ens';

// avatars groups emojis with their respective color backgrounds in the `avatarBackgrounds` object in colors.js
export const avatars = [
  { emoji: '🌶', colorIndex: 0 },
  { emoji: '🤑', colorIndex: 1 },
  { emoji: '🐙', colorIndex: 2 },
  { emoji: '🫐', colorIndex: 3 },
  { emoji: '🐳', colorIndex: 4 },
  { emoji: '🤶', colorIndex: 0 },
  { emoji: '🌲', colorIndex: 5 },
  { emoji: '🌞', colorIndex: 6 },
  { emoji: '🐒', colorIndex: 7 },
  { emoji: '🐵', colorIndex: 8 },
  { emoji: '🦊', colorIndex: 9 },
  { emoji: '🐼', colorIndex: 10 },
  { emoji: '🦄', colorIndex: 11 },
  { emoji: '🐷', colorIndex: 12 },
  { emoji: '🐧', colorIndex: 13 },
  { emoji: '🦩', colorIndex: 8 },
  { emoji: '👽', colorIndex: 14 },
  { emoji: '🎈', colorIndex: 0 },
  { emoji: '🍉', colorIndex: 8 },
  { emoji: '🎉', colorIndex: 1 },
  { emoji: '🐲', colorIndex: 15 },
  { emoji: '🌎', colorIndex: 16 },
  { emoji: '🍊', colorIndex: 17 },
  { emoji: '🐭', colorIndex: 18 },
  { emoji: '🍣', colorIndex: 19 },
  { emoji: '🐥', colorIndex: 1 },
  { emoji: '👾', colorIndex: 20 },
  { emoji: '🥦', colorIndex: 15 },
  { emoji: '👹', colorIndex: 0 },
  { emoji: '🙀', colorIndex: 17 },
  { emoji: '⛱', colorIndex: 4 },
  { emoji: '⛵️', colorIndex: 21 },
  { emoji: '🥳', colorIndex: 17 },
  { emoji: '🤯', colorIndex: 8 },
  { emoji: '🤠', colorIndex: 22 },
];

// oldAvatarColorToAvatarBackgroundIndex maps old hex colors from showcase of webProfiles
// to new colors in colors.avatarBackgrounds (index)
const oldAvatarColorToAvatarBackgroundIndex: { [hex: string]: number } = {
  '#FF494A': 0,
  '#01D3FF': 4,
  '#FB60C4': 12,
  '#3F6AFF': 21,
  '#FFD963': 1,
  '#B140FF': 20,
  '#41EBC1': 4,
  '#F46E38': 9,
  '#6D7E8F': 10,
};
// function to support showcase of webProfiles that stored the old avatarColor hexes
export function getOldAvatarColorToAvatarBackgroundIndex(colorHex: string) {
  if (!colorHex) return null;
  return oldAvatarColorToAvatarBackgroundIndex[colorHex] || 0;
}
export const popularEmojis = avatars.map(avatar => avatar.emoji);
export const emojiColorIndexes = avatars.map(avatar => avatar.colorIndex);
const emojiCount = avatars.length;

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

export function getNextEmojiWithColor(prevEmoji: string): { emoji: string; colorIndex: number } {
  const prevIndex = avatars.findIndex(({ emoji }) => emoji === prevEmoji); // if not matched, we get -1, what's fine
  return avatars[(prevIndex + 1) % avatars.length];
}

export function addressHashedIndex(address: string) {
  if (address == null) return null;
  return Math.abs(hashCode(address.toLowerCase()) % emojiCount);
}

export function addressHashedColorIndex(address: string) {
  if (address == null) return null;
  return emojiColorIndexes[Math.abs(hashCode(address.toLowerCase()) % emojiCount)];
}

export function addressHashedEmoji(address: string) {
  const index = addressHashedIndex(address);
  if (index == null) return null;
  return popularEmojis[index];
}

export function colorHexToIndex(colorHex: string | null) {
  if (!colorHex) return 0;
  if (colors.avatarBackgrounds.includes(colorHex)) {
    return colors.avatarBackgrounds.indexOf(colorHex);
  } else if (colors.avatarColor.includes(colorHex)) {
    return getOldAvatarColorToAvatarBackgroundIndex(colorHex);
  }
  return 0;
}

export function isEthAddress(address: string | null) {
  return address?.match(/^(0x)?[0-9a-fA-F]{40}$/);
}

export function isValidImagePath(path: string | null) {
  return path !== '~undefined';
}

export async function fetchReverseRecordWithRetry(address: EthereumAddress) {
  for (let i = 0; i < 3; i++) {
    try {
      return await fetchReverseRecord(address);
      // eslint-disable-next-line no-empty
    } catch {}
  }
  return null;
}

export default {
  avatars,
  addressHashedIndex,
  addressHashedColorIndex,
  addressHashedEmoji,
  colorHexToIndex,
  emojiColorIndexes,
  emojiCount,
  getOldAvatarColorToAvatarBackgroundIndex,
  getNextEmojiWithColor,
  hashCode,
  fetchReverseRecordWithRetry,
  popularEmojis,
  isEthAddress,
  isValidImagePath,
};
