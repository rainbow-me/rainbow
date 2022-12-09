export const ChainBadgeSizeConfigs = {
  large: {
    containerSize: 64,
    iconSize: 40,
  },
  medium: {
    containerSize: 44,
    iconSize: 20,
  },
  small: {
    containerSize: 44,
    iconSize: 20,
  },
  tiny: {
    containerSize: 30,
    iconSize: 14,
  },
} as const;

export type ChainBadgeType = keyof typeof ChainBadgeSizeConfigs;
