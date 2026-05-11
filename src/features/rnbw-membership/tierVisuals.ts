import { globalColors } from '@/design-system/color/palettes';
import { RNBW_BUTTON_CONFIG } from '@/features/rnbw-membership/rnbwButtonTheme';
import type { TierId } from '@/features/rnbw-membership/types';
import { opacity } from '@/framework/ui/utils/opacity';

// ============ Types ========================================================== //

type Point = { x: number; y: number };
type Themed<T> = { light: T; dark: T };
export type GradientColors = readonly [string, string, ...string[]];
export type GradientLocations = readonly [number, number, ...number[]];

type Gradient = {
  colors: GradientColors;
  locations?: GradientLocations;
  start?: Point;
  end?: Point;
};

type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
};

type TextShadow = {
  textShadowColor: string;
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
};

export type HardLightOverlay = {
  colors: GradientColors;
  locations: GradientLocations;
  maskShadow: {
    blur: number;
    dx: number;
    dy: number;
  };
};

export type GradientShadow = {
  colors: GradientColors;
  locations?: GradientLocations;
  start?: Point;
  end?: Point;
  opacity: number;
  blur: number;
  dx?: number;
  dy?: number;
};

type GradientTextTheme = {
  gradient: Themed<Gradient>;
  shadow: Themed<TextShadow>;
};

type BadgeTheme = {
  fill: Themed<Gradient>;
  border: Themed<Gradient>;
  shadows: Themed<readonly Shadow[]>;
  text: GradientTextTheme;
  overlay?: Themed<HardLightOverlay>;
  backgroundShadow?: Themed<GradientShadow>;
};

type ButtonSurfaceTheme = {
  fill: Themed<Gradient>;
  border: Themed<Gradient>;
  shadows: Themed<readonly Shadow[]>;
  highlight?: Themed<Gradient>;
  overlay?: Themed<HardLightOverlay>;
};

type PrimaryButtonTheme = {
  surface: ButtonSurfaceTheme;
  text: GradientTextTheme;
};

type SecondaryButtonTheme = {
  surface: ButtonSurfaceTheme;
  textColor: Themed<string>;
};

type ProgressBarTheme = {
  fill: Themed<Gradient>;
  border: Themed<Gradient>;
  shadow: Themed<Shadow>;
  highlight: Themed<Gradient>;
  backgroundShadow?: Themed<GradientShadow>;
};

type TierTheme = {
  background: Themed<Gradient>;
  labelGradient: Themed<Gradient>;
  badge: BadgeTheme;
  primaryButton: PrimaryButtonTheme;
  secondaryButton: SecondaryButtonTheme;
  progress: ProgressBarTheme;
};

type PrimaryButtonConfig = {
  fill?: Themed<Gradient>;
  border?: Themed<Gradient>;
  shadows?: Themed<readonly Shadow[]>;
  highlight?: Themed<Gradient>;
  overlay?: Themed<HardLightOverlay>;
  text?: {
    gradient?: Themed<Gradient>;
    shadow?: Themed<TextShadow>;
  };
};

type SecondaryButtonConfig = {
  fill: Themed<Gradient>;
  border?: Themed<Gradient>;
  shadows?: Themed<readonly Shadow[]>;
  overlay?: Themed<HardLightOverlay>;
  textColor: Themed<string>;
};

// ============ Helpers ======================================================== //

const themed = <T>(light: T, dark: T = light): Themed<T> => ({ light, dark });

const gradient = (colors: Gradient['colors'], options: Omit<Gradient, 'colors'> = {}): Gradient => ({
  colors,
  ...options,
});

const solid = (color: string): Gradient => gradient([color, color]);

const toGradient = ({ colors, locations, start, end }: Gradient): Gradient => gradient(colors, { locations, start, end });

const shadow = (shadowColor: string, shadowOffset: Shadow['shadowOffset'], shadowOpacity: number, shadowRadius: number): Shadow => ({
  shadowColor,
  shadowOffset,
  shadowOpacity,
  shadowRadius,
});

const textShadow = (textShadowColor: string, textShadowOffset: TextShadow['textShadowOffset'], textShadowRadius: number): TextShadow => ({
  textShadowColor,
  textShadowOffset,
  textShadowRadius,
});

function isShadowArray(value: Shadow | readonly Shadow[]): value is readonly Shadow[] {
  return Array.isArray(value);
}

function toShadowArray(value: Shadow | readonly Shadow[]): readonly Shadow[] {
  if (isShadowArray(value)) {
    return value;
  }

  return [value];
}

const themedShadows = (light: Shadow | readonly Shadow[], dark?: Shadow | readonly Shadow[]): Themed<readonly Shadow[]> =>
  themed(toShadowArray(light), toShadowArray(dark ?? light));

const background = (lightColor: string, darkColor = lightColor): Themed<Gradient> =>
  themed(gradient([opacity(lightColor, 0.4), opacity(lightColor, 0)]), gradient([opacity(darkColor, 0.16), opacity(darkColor, 0)]));

const badgePrimaryButton = (badge: BadgeTheme, config: PrimaryButtonConfig = {}): PrimaryButtonTheme => {
  const overlay = config.overlay ?? badge.overlay;
  return {
    surface: {
      fill: config.fill ?? badge.fill,
      border: config.border ?? badge.border,
      shadows: config.shadows ?? badge.shadows,
      ...(config.highlight ? { highlight: config.highlight } : {}),
      ...(overlay ? { overlay } : {}),
    },
    text: {
      gradient: config.text?.gradient ?? badge.text.gradient,
      shadow: config.text?.shadow ?? badge.text.shadow,
    },
  };
};

const secondaryButton = (badge: BadgeTheme, config: SecondaryButtonConfig): SecondaryButtonTheme => {
  return {
    surface: {
      fill: config.fill,
      border: config.border ?? badge.border,
      shadows: config.shadows ?? badge.shadows,
      ...(config.overlay ? { overlay: config.overlay } : {}),
    },
    textColor: config.textColor,
  };
};

// ============ Shared Tokens ================================================== //

const LIGHT_BADGE_BORDER_COLORS: Gradient['colors'] = [opacity(globalColors.grey100, 0.02), opacity(globalColors.grey100, 0.05)];
const DEFAULT_BADGE_SHADOW = shadow('#000000', { width: 0, height: 4 }, 0.06, 6);
const DEFAULT_PROGRESS_HIGHLIGHT = themed(solid('#FFFFFF'));
const MONO_LABEL_GRADIENT = themed(solid('#000000'), solid('#FFFFFF'));
const TRANSPARENT_BORDER_COLORS: Gradient['colors'] = ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'];

const BLACK_TIER_RAINBOW_OVERLAY_COLORS: HardLightOverlay['colors'] = ['#A78BFF', '#8AD7FF', '#70D59E', '#FADA5D', '#FF9C92', '#FBAFD0'];
const BLACK_TIER_RAINBOW_OVERLAY_LOCATIONS: HardLightOverlay['locations'] = [0, 0.147, 0.362, 0.566, 0.785, 1];

const BLACK_TIER_BADGE_RAINBOW_OVERLAY: Themed<HardLightOverlay> = themed({
  colors: BLACK_TIER_RAINBOW_OVERLAY_COLORS,
  locations: BLACK_TIER_RAINBOW_OVERLAY_LOCATIONS,
  maskShadow: {
    blur: 2,
    dx: 0,
    dy: 2,
  },
});

const BLACK_TIER_PRIMARY_BUTTON_RAINBOW_OVERLAY: Themed<HardLightOverlay> = themed({
  colors: BLACK_TIER_RAINBOW_OVERLAY_COLORS,
  locations: BLACK_TIER_RAINBOW_OVERLAY_LOCATIONS,
  maskShadow: {
    blur: 2.5,
    dx: 0,
    dy: 4,
  },
});

// ============ Badges ========================================================= //

const BASIC_BADGE: BadgeTheme = {
  fill: themed(gradient(['#2B80F4', '#1661C9'])),
  border: themed(gradient(LIGHT_BADGE_BORDER_COLORS), gradient([opacity('#69A8FF', 0.5), opacity('#69A8FF', 0.3)])),
  shadows: themedShadows(shadow('#000000', { width: 0, height: 8 }, 0.1, 9), DEFAULT_BADGE_SHADOW),
  text: {
    gradient: themed(solid('#FFFFFF')),
    shadow: themed(textShadow('rgba(0, 0, 0, 0.14)', { width: 0, height: 1 }, 1)),
  },
};

const SILVER_BADGE: BadgeTheme = {
  fill: themed(gradient(['#EFEFEF', '#CDCDCD']), gradient(['#D6D6D6', '#828282'])),
  border: themed(gradient(LIGHT_BADGE_BORDER_COLORS), gradient([opacity('#EBEBEB', 0.5), opacity('#EBEBEB', 0.3)])),
  shadows: themedShadows(
    [DEFAULT_BADGE_SHADOW, shadow('#D9D9D9', { width: 0, height: 0 }, 0.6, 30)],
    shadow('#B2B2B2', { width: 0, height: 0 }, 0.6, 30)
  ),
  text: {
    gradient: themed(gradient(['#313131', '#888888']), gradient(['#111111', '#585858'])),
    shadow: themed(textShadow('rgba(255, 255, 255, 0.46)', { width: 1, height: 1 }, 0)),
  },
};

const GOLD_BADGE: BadgeTheme = {
  fill: themed(gradient(['#FFE380', '#E3A700'])),
  border: themed(gradient(LIGHT_BADGE_BORDER_COLORS), gradient([opacity('#FFF4CC', 0.5), opacity('#FFF4CC', 0.3)])),
  shadows: themedShadows(
    [DEFAULT_BADGE_SHADOW, shadow('#FCDE76', { width: 0, height: 0 }, 0.4, 30)],
    shadow('#FFDD20', { width: 0, height: 0 }, 0.6, 30)
  ),
  text: {
    gradient: themed(gradient(['#4F3605', '#90630E'])),
    shadow: themed(textShadow('rgba(255, 255, 255, 0.26)', { width: 1, height: 1 }, 0)),
  },
};

const DIAMOND_BADGE: BadgeTheme = {
  fill: themed(gradient(['#ECF2F8', '#C8D1D7']), gradient(['#D5DCE3', '#9AA7B0'])),
  border: themed(gradient(LIGHT_BADGE_BORDER_COLORS), gradient([opacity('#D5DCE3', 0.5), opacity('#D5DCE3', 0.3)])),
  shadows: themedShadows(
    [DEFAULT_BADGE_SHADOW, shadow('#42D2EB', { width: 0, height: 0 }, 0.3, 30)],
    shadow('#42D2EB', { width: 0, height: 0 }, 0.6, 30)
  ),
  text: {
    gradient: themed(gradient(['#424749', '#7CADB4']), gradient(['#314145', '#1D5D67'])),
    shadow: themed(textShadow(opacity('#CBF6FF', 0.46), { width: 1, height: 1 }, 0)),
  },
};

const BLACK_BADGE: BadgeTheme = {
  fill: themed(gradient(['#444444', '#000000'])),
  border: themed(gradient(TRANSPARENT_BORDER_COLORS)),
  shadows: themedShadows(DEFAULT_BADGE_SHADOW),
  text: {
    gradient: themed(solid('#FFFFFF')),
    shadow: themed(textShadow('rgba(0, 0, 0, 0)', { width: 0, height: 0 }, 0)),
  },
  overlay: BLACK_TIER_BADGE_RAINBOW_OVERLAY,
  backgroundShadow: themed({
    colors: BLACK_TIER_RAINBOW_OVERLAY_COLORS,
    locations: BLACK_TIER_RAINBOW_OVERLAY_LOCATIONS,
    opacity: 0.5,
    blur: 16,
    dy: 0,
  }),
};

// ============ Buttons ======================================================== //

const RNBW_PRIMARY_BUTTON: PrimaryButtonTheme = {
  surface: {
    fill: themed(gradient(RNBW_BUTTON_CONFIG.primary.colors)),
    border: themed(gradient(RNBW_BUTTON_CONFIG.primary.border.light), gradient(RNBW_BUTTON_CONFIG.primary.border.dark)),
    shadows: themed(RNBW_BUTTON_CONFIG.primary.shadows.light, RNBW_BUTTON_CONFIG.primary.shadows.dark),
    highlight: themed(toGradient(RNBW_BUTTON_CONFIG.primary.highlight.light), toGradient(RNBW_BUTTON_CONFIG.primary.highlight.dark)),
  },
  text: {
    gradient: themed(toGradient(RNBW_BUTTON_CONFIG.primary.text)),
    shadow: themed(RNBW_BUTTON_CONFIG.primary.text.shadow),
  },
};

const RNBW_SECONDARY_BUTTON: SecondaryButtonTheme = {
  surface: {
    fill: themed(gradient(RNBW_BUTTON_CONFIG.secondary.colors.light), gradient(RNBW_BUTTON_CONFIG.secondary.colors.dark)),
    border: themed(gradient(RNBW_BUTTON_CONFIG.secondary.border.light), gradient(RNBW_BUTTON_CONFIG.secondary.border.dark)),
    shadows: themed(RNBW_BUTTON_CONFIG.secondary.shadows.light, RNBW_BUTTON_CONFIG.secondary.shadows.dark),
  },
  textColor: themed(RNBW_BUTTON_CONFIG.secondary.text.color.light, RNBW_BUTTON_CONFIG.secondary.text.color.dark),
};

// ============ Tier Themes ==================================================== //

const TIER_THEMES: Record<TierId, TierTheme> = {
  STAKING_TIER_LEVEL_BASIC: {
    background: background('#0086FF'),
    labelGradient: MONO_LABEL_GRADIENT,
    badge: BASIC_BADGE,
    primaryButton: RNBW_PRIMARY_BUTTON,
    secondaryButton: RNBW_SECONDARY_BUTTON,
    progress: {
      fill: themed(gradient(['#2B80F4', '#1F6FDC'])),
      border: themed(gradient(['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.06)']), gradient(['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)'])),
      shadow: themed(shadow('#2A99FA', { width: 0, height: 0 }, 0.5, 2.5)),
      highlight: DEFAULT_PROGRESS_HIGHLIGHT,
    },
  },
  STAKING_TIER_LEVEL_SILVER: {
    background: background('#E6E6E6', '#CFCFCF'),
    labelGradient: themed(gradient(['#313131', '#888888'])),
    badge: SILVER_BADGE,
    primaryButton: badgePrimaryButton(SILVER_BADGE, {
      shadows: themedShadows([DEFAULT_BADGE_SHADOW], shadow('#B2B2B2', { width: 0, height: 0 }, 0.3, 15)),
    }),
    secondaryButton: secondaryButton(SILVER_BADGE, {
      fill: themed(
        gradient([opacity('#EFEFEF', 0.5), opacity('#CDCDCD', 0.5)]),
        gradient([opacity('#EFEFEF', 0.1), opacity('#CDCDCD', 0.1)])
      ),
      border: themed(gradient([opacity('#959595', 0.15), opacity('#3B3B3B', 0.045)])),
      textColor: themed('#6A6A6A', '#CBCBCB'),
      shadows: themedShadows(DEFAULT_BADGE_SHADOW),
    }),
    progress: {
      fill: themed(gradient(['#EFEFEF', '#A2A2A2'])),
      border: themed(
        gradient([opacity('#959595', 0.15), opacity('#3B3B3B', 0.09)]),
        gradient(['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'])
      ),
      shadow: themed(shadow('#000000', { width: 0, height: 4 }, 0.06, 6), shadow('#B2B2B2', { width: 0, height: 0 }, 0.3, 15)),
      highlight: DEFAULT_PROGRESS_HIGHLIGHT,
    },
  },
  STAKING_TIER_LEVEL_GOLD: {
    background: background('#FADB71'),
    labelGradient: themed(gradient(['#4F3605', '#90630E'])),
    badge: GOLD_BADGE,
    primaryButton: RNBW_PRIMARY_BUTTON,
    secondaryButton: RNBW_SECONDARY_BUTTON,
    progress: {
      fill: themed(gradient(['#FAD96A', '#E7B114'])),
      border: themed(gradient(['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.06)']), gradient(['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'])),
      shadow: themed(shadow('#E5B92C', { width: 0, height: 0 }, 0.5, 2.5), shadow('#FFDD20', { width: 0, height: 0 }, 0.3, 15)),
      highlight: DEFAULT_PROGRESS_HIGHLIGHT,
    },
  },
  STAKING_TIER_LEVEL_DIAMOND: {
    background: background('#D1E9F0', '#42D2EB'),
    labelGradient: themed(gradient(['#424749', '#7CADB4'])),
    badge: DIAMOND_BADGE,
    primaryButton: badgePrimaryButton(DIAMOND_BADGE, {
      shadows: themedShadows(DEFAULT_BADGE_SHADOW, shadow('#42D2EB', { width: 0, height: 0 }, 0.3, 15)),
    }),
    secondaryButton: secondaryButton(DIAMOND_BADGE, {
      fill: themed(
        gradient([opacity('#ECF2F8', 0.5), opacity('#C8D1D7', 0.5)]),
        gradient([opacity('#87BDC6', 0.13), opacity('#87BDC6', 0.065)])
      ),
      border: themed(
        gradient([opacity('#959595', 0.1), opacity('#3B3B3B', 0.03)]),
        gradient([opacity('#A0B3B6', 0.1), opacity('#A0B3B6', 0.02)])
      ),
      textColor: themed('#516C71', '#CDD5DC'),
      shadows: themedShadows(shadow('#000000', { width: 0, height: 4 }, 0.06, 6)),
    }),
    progress: {
      fill: themed(gradient(['#ECF2F8', '#C8D1D7']), gradient(['#D5DCE3', '#9AA7B0'])),
      border: themed(
        gradient([opacity('#6C8CA8', 0.15), opacity('#404647', 0.09)]),
        gradient([opacity('#959595', 0.15), opacity('#3B3B3B', 0.06)])
      ),
      shadow: themed(shadow('#000000', { width: 0, height: 4 }, 0.06, 6), shadow('#42D2EB', { width: 0, height: 0 }, 0.3, 15)),
      highlight: DEFAULT_PROGRESS_HIGHLIGHT,
    },
  },
  STAKING_TIER_LEVEL_BLACK: {
    background: themed(solid('rgba(255,255,255,0)')),
    labelGradient: MONO_LABEL_GRADIENT,
    badge: BLACK_BADGE,
    primaryButton: badgePrimaryButton(BLACK_BADGE, {
      fill: themed(gradient(['#2A2A2A', '#141414']), gradient(['#272727', '#141414'])),
      overlay: BLACK_TIER_PRIMARY_BUTTON_RAINBOW_OVERLAY,
    }),
    secondaryButton: secondaryButton(BLACK_BADGE, {
      fill: themed(
        gradient([opacity('#B8B8B8', 0.1), opacity('#2E2E2E', 0.1)]),
        gradient([opacity('#3C3C3C', 0.5), opacity('#3C3C3C', 0.25)])
      ),
      border: themed(solid(opacity('#000000', 0.048)), gradient([opacity('#6F6F6F', 0.1), opacity('#696969', 0.02)])),
      shadows: themedShadows(DEFAULT_BADGE_SHADOW),
      textColor: themed('#454545', opacity('#F5F8FF', 0.76)),
    }),
    progress: {
      fill: themed(gradient(['#444444', '#000000'])),
      border: themed(solid('rgba(0,0,0,0)')),
      shadow: themed(shadow('#000000', { width: 0, height: 4 }, 0.06, 6)),
      backgroundShadow: themed({
        colors: BLACK_TIER_RAINBOW_OVERLAY_COLORS,
        locations: BLACK_TIER_RAINBOW_OVERLAY_LOCATIONS,
        opacity: 0.24,
        blur: 12,
        dy: 0,
      }),
      highlight: themed(
        gradient(['#7D53FF', '#3FBDFF', '#4BFF9D', '#FFD73A', '#FF5E4D', '#FF3C91'], {
          locations: [0, 0.15, 0.36, 0.57, 0.79, 1],
        })
      ),
    },
  },
};

// ============ Public API ===================================================== //

const FALLBACK_TIER_THEME = TIER_THEMES.STAKING_TIER_LEVEL_BASIC;

function isTierId(level: string): level is TierId {
  return level in TIER_THEMES;
}

function resolveTierTheme(level: TierId | string): TierTheme {
  return isTierId(level) ? TIER_THEMES[level] : FALLBACK_TIER_THEME;
}

export function getTierBackgroundTheme(level: TierId | string): { gradient: Themed<Gradient> } {
  return { gradient: resolveTierTheme(level).background };
}

export function getTierLabelTheme(level: TierId | string): { gradient: Themed<Gradient> } {
  return { gradient: resolveTierTheme(level).labelGradient };
}

export function getTierBadgeTheme(level: TierId | string): BadgeTheme {
  return resolveTierTheme(level).badge;
}

export function getTierPrimaryButtonTheme(level: TierId | string): PrimaryButtonTheme {
  return resolveTierTheme(level).primaryButton;
}

export function getTierSecondaryButtonTheme(level: TierId | string): SecondaryButtonTheme {
  return resolveTierTheme(level).secondaryButton;
}

export function getTierProgressBarTheme(level: TierId | string): ProgressBarTheme {
  return resolveTierTheme(level).progress;
}
