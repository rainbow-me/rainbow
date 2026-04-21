import type { LinearGradientProps } from 'expo-linear-gradient';

import { globalColors } from '@/design-system/color/palettes';
import { RNBW_BUTTON_CONFIG } from '@/features/rnbw-membership/rnbwButtonTheme';
import type { TierId } from '@/features/rnbw-membership/types';
import { opacity } from '@/framework/ui/utils/opacity';

// ============ Types ========================================================== //

type Point = { x: number; y: number };
type Themed<T> = { light: T; dark: T };

type Gradient = {
  colors: LinearGradientProps['colors'];
  locations?: LinearGradientProps['locations'];
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

type GradientTextTheme = {
  gradient: Themed<Gradient>;
  shadow: Themed<TextShadow>;
};

type BadgeTheme = {
  fill: Themed<Gradient>;
  border: Themed<Gradient>;
  shadows: Themed<readonly Shadow[]>;
  text: GradientTextTheme;
};

type ButtonSurfaceTheme = {
  fill: Themed<Gradient>;
  border: Themed<Gradient>;
  shadows: Themed<readonly Shadow[]>;
  highlight?: Themed<Gradient>;
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
  text?: {
    gradient?: Themed<Gradient>;
    shadow?: Themed<TextShadow>;
  };
};

type SecondaryButtonConfig = {
  fill: Themed<Gradient>;
  border?: Themed<Gradient>;
  shadows?: Themed<readonly Shadow[]>;
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

function toShadowArray(value: Shadow | readonly Shadow[]): readonly Shadow[] {
  if (Array.isArray(value)) {
    return value as readonly Shadow[];
  }

  return [value as Shadow];
}

const themedShadows = (light: Shadow | readonly Shadow[], dark?: Shadow | readonly Shadow[]): Themed<readonly Shadow[]> =>
  themed(toShadowArray(light), toShadowArray(dark ?? light));

const background = (lightColor: string, darkColor = lightColor): Themed<Gradient> =>
  themed(gradient([opacity(lightColor, 0.4), opacity(lightColor, 0)]), gradient([opacity(darkColor, 0.16), opacity(darkColor, 0)]));

const badgePrimaryButton = (badge: BadgeTheme, config: PrimaryButtonConfig = {}): PrimaryButtonTheme => ({
  surface: {
    fill: config.fill ?? badge.fill,
    border: config.border ?? badge.border,
    shadows: config.shadows ?? badge.shadows,
    ...(config.highlight ? { highlight: config.highlight } : {}),
  },
  text: {
    gradient: config.text?.gradient ?? badge.text.gradient,
    shadow: config.text?.shadow ?? badge.text.shadow,
  },
});

const secondaryButton = (badge: BadgeTheme, config: SecondaryButtonConfig): SecondaryButtonTheme => ({
  surface: {
    fill: config.fill,
    border: config.border ?? badge.border,
    shadows: config.shadows ?? badge.shadows,
  },
  textColor: config.textColor,
});

// ============ Shared Tokens ================================================== //

const LIGHT_BADGE_BORDER_COLORS: Gradient['colors'] = [opacity(globalColors.grey100, 0.02), opacity(globalColors.grey100, 0.05)];
const DEFAULT_BADGE_SHADOW = shadow('#000000', { width: 0, height: 4 }, 0.06, 6);
const DEFAULT_PROGRESS_HIGHLIGHT = themed(solid('#FFFFFF'));
const MONO_LABEL_GRADIENT = themed(solid('#000000'), solid('#FFFFFF'));

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
  border: themed(gradient(LIGHT_BADGE_BORDER_COLORS)),
  shadows: themedShadows(DEFAULT_BADGE_SHADOW),
  text: {
    gradient: themed(solid('#FFFFFF')),
    shadow: themed(textShadow('rgba(0, 0, 0, 0)', { width: 0, height: 0 }, 0)),
  },
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
    primaryButton: badgePrimaryButton(SILVER_BADGE),
    secondaryButton: secondaryButton(SILVER_BADGE, {
      fill: themed(
        gradient([opacity('#EFEFEF', 0.5), opacity('#CDCDCD', 0.5)]),
        gradient([opacity('#EFEFEF', 0.1), opacity('#CDCDCD', 0.1)])
      ),
      border: themed(gradient([opacity('#959595', 0.15), opacity('#3B3B3B', 0.045)])),
      textColor: themed('#6A6A6A', '#CBCBCB'),
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
      shadows: themedShadows(DEFAULT_BADGE_SHADOW, shadow('#42D2EB', { width: 0, height: 0 }, 0.3, 30)),
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
      fill: themed(solid('#1A1716')),
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

function resolveTierTheme(level: TierId | string): TierTheme {
  return TIER_THEMES[level as TierId] ?? FALLBACK_TIER_THEME;
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
