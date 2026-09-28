import { StyleSheet } from 'react-native';

import { globalColors } from '@/design-system/color/palettes';

export const badgeShadows = StyleSheet.create({
  soft: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  tight: {
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
});
