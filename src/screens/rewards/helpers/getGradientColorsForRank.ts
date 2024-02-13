import {
  DARK_RANK_1_GRADIENT_COLORS,
  DARK_RANK_2_GRADIENT_COLORS,
  DARK_RANK_3_GRADIENT_COLORS,
  LIGHT_RANK_1_GRADIENT_COLORS,
  LIGHT_RANK_2_GRADIENT_COLORS,
  LIGHT_RANK_3_GRADIENT_COLORS,
} from '@/screens/rewards/constants';

export const getGradientColorsForRank = (rank: number, isDarkTheme: boolean) => {
  if (rank === 1) {
    return isDarkTheme ? DARK_RANK_1_GRADIENT_COLORS : LIGHT_RANK_1_GRADIENT_COLORS;
  } else if (rank === 2) {
    return isDarkTheme ? DARK_RANK_2_GRADIENT_COLORS : LIGHT_RANK_2_GRADIENT_COLORS;
  } else if (rank === 3) {
    return isDarkTheme ? DARK_RANK_3_GRADIENT_COLORS : LIGHT_RANK_3_GRADIENT_COLORS;
  }
  return [];
};
