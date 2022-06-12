import { colors } from '@rainbow-me/styles';
import GraphemeSplitter from 'grapheme-splitter';
import { containsEmoji } from '@rainbow-me/helpers/strings';

export const getAvatarColorHex = (hexOrColorIndex: string | number | null) => {
  if (!hexOrColorIndex) return null;
  return typeof hexOrColorIndex === 'string'
    ? hexOrColorIndex
    : colors.avatarBackgrounds[hexOrColorIndex];
};

export const getAvatarColorIndex = (
  hexOrColorIndex: string | number | null
) => {
  if (!hexOrColorIndex) return null;
  return typeof hexOrColorIndex === 'string'
    ? colors.avatarBackgrounds.indexOf(hexOrColorIndex)
    : hexOrColorIndex;
};

export const getEmojiFromAccountName = (name: string | null) => {
  if (!name) return null;
  const characters = new GraphemeSplitter().splitGraphemes(name);
  if (characters.length !== 1) {
    return null;
  }
  return containsEmoji(name) ? name : null;
};
