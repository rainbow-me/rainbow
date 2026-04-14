import { opacity } from '@/framework/ui/utils/opacity';

export const MEMBERSHIP_CARD_BORDER_RADIUS = 32;

export const MEMBERSHIP_CARD_LIGHT_BORDER_GRADIENT = ['#FFFFFF', opacity('#FFFFFF', 0.3)] as const;
export const MEMBERSHIP_CARD_LIGHT_CUTOUT_BORDER = opacity('#FFFFFF', 0.65);
export const MEMBERSHIP_CARD_LIGHT_GRADIENT_START = { x: 0.5, y: 0 };
export const MEMBERSHIP_CARD_LIGHT_GRADIENT_END = { x: 0.5, y: 0.57 };
export const MEMBERSHIP_CARD_LIGHT_DROP_SHADOW = {
  dx: 0,
  dy: 6,
  blur: 9,
  color: 'rgba(0, 0, 0, 0.05)',
};

export const MEMBERSHIP_CARD_DARK_TOP_HIGHLIGHT = opacity('#D6D6D6', 0.02);
export const MEMBERSHIP_CARD_DARK_CUTOUT_BORDER = MEMBERSHIP_CARD_DARK_TOP_HIGHLIGHT;
export const MEMBERSHIP_CARD_DARK_INNER_SHADOW = {
  color: opacity('#FFFFFF', 0.06),
  blur: 2.5,
  dx: 0,
  dy: 1,
};
