/* eslint-disable sort-keys */

import colors from '../styles/colors';

// avatars groups emojis with their respective color backgrounds in the `avatarBackgrounds` object in colors.js
export const avatars = [
  { emoji: '🌶', color: colors.avatarBackgrounds[0] },
  { emoji: '🤑', color: colors.avatarBackgrounds[1] },
  { emoji: '🐙', color: colors.avatarBackgrounds[2] },
  { emoji: '🫐', color: colors.avatarBackgrounds[3] },
  { emoji: '🐳', color: colors.avatarBackgrounds[4] },
  { emoji: '🤶', color: colors.avatarBackgrounds[0] },
  { emoji: '🌲', color: colors.avatarBackgrounds[5] },
  { emoji: '🌞', color: colors.avatarBackgrounds[6] },
  { emoji: '🐒', color: colors.avatarBackgrounds[7] },
  { emoji: '🐵', color: colors.avatarBackgrounds[8] },
  { emoji: '🦊', color: colors.avatarBackgrounds[9] },
  { emoji: '🐼', color: colors.avatarBackgrounds[10] },
  { emoji: '🦄', color: colors.avatarBackgrounds[11] },
  { emoji: '🐷', color: colors.avatarBackgrounds[12] },
  { emoji: '🐧', color: colors.avatarBackgrounds[13] },
  { emoji: '🦩', color: colors.avatarBackgrounds[8] },
  { emoji: '👽', color: colors.avatarBackgrounds[14] },
  { emoji: '🎈', color: colors.avatarBackgrounds[0] },
  { emoji: '🍉', color: colors.avatarBackgrounds[8] },
  { emoji: '🎉', color: colors.avatarBackgrounds[1] },
  { emoji: '🐲', color: colors.avatarBackgrounds[15] },
  { emoji: '🌎', color: colors.avatarBackgrounds[16] },
  { emoji: '🍊', color: colors.avatarBackgrounds[17] },
  { emoji: '🐭', color: colors.avatarBackgrounds[18] },
  { emoji: '🍣', color: colors.avatarBackgrounds[19] },
  { emoji: '🐥', color: colors.avatarBackgrounds[1] },
  { emoji: '👾', color: colors.avatarBackgrounds[20] },
  { emoji: '🥦', color: colors.avatarBackgrounds[15] },
  { emoji: '👹', color: colors.avatarBackgrounds[0] },
  { emoji: '🙀', color: colors.avatarBackgrounds[17] },
  { emoji: '⛱', color: colors.avatarBackgrounds[4] },
  { emoji: '⛵️', color: colors.avatarBackgrounds[21] },
  { emoji: '🥳', color: colors.avatarBackgrounds[17] },
  { emoji: '🤯', color: colors.avatarBackgrounds[8] },
  { emoji: '🤠', color: colors.avatarBackgrounds[22] },
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
export const emojiColorIndexes = avatars.map(avatar =>
  colors.avatarBackgrounds.indexOf(avatar.color)
);
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

export function addressHashedIndex(address: string) {
  if (address == null) return null;
  return Math.abs(hashCode(address.toLowerCase()) % emojiCount);
}

export function addressHashedColorIndex(address: string) {
  if (address == null) return null;
  return emojiColorIndexes[
    Math.abs(hashCode(address.toLowerCase()) % emojiCount)
  ];
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

export default {
  avatars,
  addressHashedIndex,
  addressHashedColorIndex,
  addressHashedEmoji,
  colorHexToIndex,
  emojiColorIndexes,
  emojiCount,
  getOldAvatarColorToAvatarBackgroundIndex,
  hashCode,
  popularEmojis,
  isEthAddress,
};
