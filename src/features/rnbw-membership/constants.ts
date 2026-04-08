import { globalColors } from '@/design-system/color/palettes';
import type { Tier, TierId } from '@/features/rnbw-membership/types';
import { opacity } from '@/framework/ui/utils/opacity';
import type { LinearGradientProps } from 'expo-linear-gradient';

type Themed<T> = { light: T; dark: T };

type ShadowConfig = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
};

type GradientConfig = {
  colors: LinearGradientProps['colors'];
  locations?: LinearGradientProps['locations'];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

type TextShadowConfig = {
  textShadowColor: string;
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
};

type TierVisuals = {
  backgroundGradient: Themed<GradientConfig>;
  textGradient: Themed<GradientConfig>;
  badgeTextGradient: Themed<GradientConfig>;
  badgeGradient: Themed<GradientConfig>;
  badgeBorderGradient: Themed<GradientConfig>;
  badgeShadow: Themed<ShadowConfig>;
  badgeTextShadow: Themed<TextShadowConfig>;
};

const BADGE_BORDER_GRADIENT_LIGHT = [opacity(globalColors.grey100, 0.02), opacity(globalColors.grey100, 0.05)] as const;
const BADGE_SHADOW_LIGHT = { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 9 } as const;

const sameForModes = <T>(value: T): Themed<T> => ({ light: value, dark: value });

export const TIER_VISUALS: Record<TierId, TierVisuals> = {
  STAKING_TIER_LEVEL_BASIC: {
    backgroundGradient: {
      light: { colors: [opacity('#0086FF', 0.4), opacity('#0086FF', 0)] },
      dark: { colors: [opacity('#0086FF', 0.16), opacity('#0086FF', 0)] },
    },
    textGradient: { light: { colors: ['#000000', '#000000'] }, dark: { colors: ['#FFFFFF', '#FFFFFF'] } },
    badgeTextGradient: sameForModes({ colors: ['#FFFFFF', '#FFFFFF'] }),
    badgeGradient: sameForModes({ colors: ['#2B80F4', '#1661C9'] }),
    badgeBorderGradient: {
      light: { colors: BADGE_BORDER_GRADIENT_LIGHT },
      dark: { colors: [opacity('#69A8FF', 0.5), opacity('#69A8FF', 0.3)] },
    },
    badgeShadow: {
      light: BADGE_SHADOW_LIGHT,
      dark: BADGE_SHADOW_LIGHT,
    },
    badgeTextShadow: sameForModes({
      textShadowColor: 'rgba(0, 0, 0, 0.14)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    }),
  },
  STAKING_TIER_LEVEL_SILVER: {
    backgroundGradient: {
      light: { colors: [opacity('#E6E6E6', 0.4), opacity('#E6E6E6', 0)] },
      dark: { colors: [opacity('#CFCFCF', 0.16), opacity('#CFCFCF', 0)] },
    },
    textGradient: sameForModes({ colors: ['#313131', '#888888'] }),
    badgeTextGradient: { light: { colors: ['#313131', '#888888'] }, dark: { colors: ['#111111', '#585858'] } },
    badgeGradient: { light: { colors: ['#EFEFEF', '#CDCDCD'] }, dark: { colors: ['#D6D6D6', '#828282'] } },
    badgeBorderGradient: {
      light: { colors: BADGE_BORDER_GRADIENT_LIGHT },
      dark: { colors: [opacity('#EBEBEB', 0.5), opacity('#EBEBEB', 0.3)] },
    },
    badgeShadow: {
      light: BADGE_SHADOW_LIGHT,
      dark: { shadowColor: '#B2B2B2', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
    },
    badgeTextShadow: sameForModes({
      textShadowColor: 'rgba(255, 255, 255, 0.46)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 0,
    }),
  },
  STAKING_TIER_LEVEL_GOLD: {
    backgroundGradient: {
      light: { colors: [opacity('#FADB71', 0.4), opacity('#FADB71', 0)] },
      dark: { colors: [opacity('#FADB71', 0.16), opacity('#FADB71', 0)] },
    },
    textGradient: sameForModes({ colors: ['#4F3605', '#90630E'] }),
    badgeTextGradient: sameForModes({ colors: ['#4F3605', '#90630E'] }),
    badgeGradient: sameForModes({ colors: ['#FFE380', '#E3A700'] }),
    badgeBorderGradient: {
      light: { colors: BADGE_BORDER_GRADIENT_LIGHT },
      dark: { colors: [opacity('#FFF4CC', 0.5), opacity('#FFF4CC', 0.3)] },
    },
    badgeShadow: {
      light: BADGE_SHADOW_LIGHT,
      dark: { shadowColor: '#FFDD20', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
    },
    badgeTextShadow: sameForModes({
      textShadowColor: 'rgba(255, 255, 255, 0.26)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 0,
    }),
  },
  STAKING_TIER_LEVEL_DIAMOND: {
    backgroundGradient: {
      light: { colors: [opacity('#D1E9F0', 0.4), opacity('#D1E9F0', 0)] },
      dark: { colors: [opacity('#42D2EB', 0.16), opacity('#42D2EB', 0)] },
    },
    textGradient: sameForModes({ colors: ['#424749', '#7CADB4'] }),
    badgeTextGradient: { light: { colors: ['#424749', '#7CADB4'] }, dark: { colors: ['#314145', '#1D5D67'] } },
    badgeGradient: { light: { colors: ['#ECF2F8', '#C8D1D7'] }, dark: { colors: ['#D5DCE3', '#9AA7B0'] } },
    badgeBorderGradient: {
      light: { colors: BADGE_BORDER_GRADIENT_LIGHT },
      dark: { colors: [opacity('#D5DCE3', 0.5), opacity('#D5DCE3', 0.3)] },
    },
    badgeShadow: {
      light: BADGE_SHADOW_LIGHT,
      dark: { shadowColor: '#42D2EB', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
    },
    badgeTextShadow: sameForModes({
      textShadowColor: opacity('#CBF6FF', 0.46),
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 0,
    }),
  },
  STAKING_TIER_LEVEL_BLACK: {
    backgroundGradient: sameForModes({ colors: [opacity('#FFFFFF', 0), opacity('#FFFFFF', 0)] }),
    textGradient: { light: { colors: ['#000000', '#000000'] }, dark: { colors: ['#FFFFFF', '#FFFFFF'] } },
    badgeTextGradient: sameForModes({ colors: ['#FFFFFF', '#FFFFFF'] }),
    badgeGradient: sameForModes({ colors: ['#444444', '#000000'] }),
    badgeBorderGradient: sameForModes({ colors: BADGE_BORDER_GRADIENT_LIGHT }),
    badgeShadow: {
      light: BADGE_SHADOW_LIGHT,
      dark: { shadowColor: '#1A1C22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    },
    badgeTextShadow: sameForModes({ textShadowColor: 'rgba(0, 0, 0, 0)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 }),
  },
};

export const FALLBACK_TIERS: Tier[] = [
  {
    level: 'STAKING_TIER_LEVEL_BASIC',
    name: 'Basic',
    minStakeAmount: '0',
    cashbackBps: 1000,
  },
  {
    level: 'STAKING_TIER_LEVEL_SILVER',
    name: 'Silver',
    minStakeAmount: '5000000000000000000000',
    cashbackBps: 2500,
  },
  {
    level: 'STAKING_TIER_LEVEL_GOLD',
    name: 'Gold',
    minStakeAmount: '10000000000000000000000',
    cashbackBps: 5000,
  },
  {
    level: 'STAKING_TIER_LEVEL_DIAMOND',
    name: 'Diamond',
    minStakeAmount: '15000000000000000000000',
    cashbackBps: 7500,
  },
  {
    level: 'STAKING_TIER_LEVEL_BLACK',
    name: 'Black',
    minStakeAmount: '20000000000000000000000',
    cashbackBps: 10000,
  },
];
