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
  return typeof hexOrColorIndex === 'string'
    ? colors.avatarBackgrounds.indexOf(hexOrColorIndex)
    : hexOrColorIndex;
};
