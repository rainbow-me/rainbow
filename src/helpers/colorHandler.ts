import { colors } from '@rainbow-me/styles';

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
  if (typeof hexOrColorIndex === 'string') {
    const colorIndex = colors.avatarBackgrounds.indexOf(hexOrColorIndex);
    return colorIndex !== -1 ? colorIndex : 0;
  } else {
    return hexOrColorIndex;
  }
};
