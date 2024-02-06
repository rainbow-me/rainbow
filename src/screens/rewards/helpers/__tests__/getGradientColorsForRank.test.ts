import {
  DARK_RANK_1_GRADIENT_COLORS,
  DARK_RANK_2_GRADIENT_COLORS,
  DARK_RANK_3_GRADIENT_COLORS,
  LIGHT_RANK_1_GRADIENT_COLORS,
  LIGHT_RANK_2_GRADIENT_COLORS,
  LIGHT_RANK_3_GRADIENT_COLORS,
} from '@/screens/rewards/constants';
import { getGradientColorsForRank } from '@/screens/rewards/helpers/getGradientColorsForRank';

test('returns gradient color for no. 1 rank properly', () => {
  expect(getGradientColorsForRank(1, false)).toEqual(LIGHT_RANK_1_GRADIENT_COLORS);
  expect(getGradientColorsForRank(1, true)).toEqual(DARK_RANK_1_GRADIENT_COLORS);
});

test('returns gradient color for no. 2 rank properly', () => {
  expect(getGradientColorsForRank(2, false)).toEqual(LIGHT_RANK_2_GRADIENT_COLORS);
  expect(getGradientColorsForRank(2, true)).toEqual(DARK_RANK_2_GRADIENT_COLORS);
});

test('returns gradient color for no. 3 rank properly', () => {
  expect(getGradientColorsForRank(3, false)).toEqual(LIGHT_RANK_3_GRADIENT_COLORS);
  expect(getGradientColorsForRank(3, true)).toEqual(DARK_RANK_3_GRADIENT_COLORS);
});

test('returns empty array for other ranks', () => {
  expect(getGradientColorsForRank(4, false)).toEqual([]);
  expect(getGradientColorsForRank(4, true)).toEqual([]);
});
