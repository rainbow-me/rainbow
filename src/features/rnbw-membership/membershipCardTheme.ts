import { MEMBERSHIP_SCREEN_BACKGROUND_COLOR } from '@/features/rnbw-membership/constants';
import { getSolidColorEquivalent } from '@/worklets/colors';

type MembershipCardFill = {
  foreground: string;
  opacity: number;
};

const MEMBERSHIP_CARD_FILL: { light: MembershipCardFill; dark: MembershipCardFill } = {
  light: { foreground: '#FFFFFF', opacity: 1 },
  dark: { foreground: '#202429', opacity: 0.4 },
};

export const MEMBERSHIP_CARD_BACKGROUND_COLOR = {
  light: getSolidColorEquivalent({
    background: MEMBERSHIP_SCREEN_BACKGROUND_COLOR.light,
    foreground: MEMBERSHIP_CARD_FILL.light.foreground,
    opacity: MEMBERSHIP_CARD_FILL.light.opacity,
  }),
  dark: getSolidColorEquivalent({
    background: MEMBERSHIP_SCREEN_BACKGROUND_COLOR.dark,
    foreground: MEMBERSHIP_CARD_FILL.dark.foreground,
    opacity: MEMBERSHIP_CARD_FILL.dark.opacity,
  }),
} as const;
