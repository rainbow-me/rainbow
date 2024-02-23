import { shadowColors, ShadowColor, ForegroundColor } from './../color/palettes';
import { CustomColor } from '../color/useForegroundColor';

type ShadowSize = '12px' | '18px' | '24px' | '30px';
type ShadowColorMode = 'light' | 'dark';
type ShadowColorValue = ForegroundColor | 'accent' | CustomColor;

type ShadowSpec = {
  ios: {
    color: ShadowColorValue;
    x: number;
    y: number;
    opacity: number;
    blur: number;
  }[];
  android: {
    color: ShadowColorValue;
    elevation: number;
    opacity: number;
  };
};

type ShadowValue = ShadowSpec | Record<ShadowColorMode, ShadowSpec>;

function coloredShadows<Size extends ShadowSize>(
  size: Size,
  getShadowForColor: (color: ShadowColor) => ShadowValue
): Record<`${Size} ${ShadowColor}`, ShadowValue> {
  return Object.assign(
    {},
    ...shadowColors.map(color => ({
      [`${size} ${color}`]: getShadowForColor(color),
    }))
  );
}

const shadowHierarchy: Record<ShadowSize | `${ShadowSize} ${ShadowColor}`, ShadowValue> = {
  '12px': {
    light: {
      ios: [
        { x: 0, y: 4, blur: 12, color: 'shadowFar', opacity: 0.08 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 16, color: 'shadowFar', opacity: 0.55 },
    },
    dark: {
      ios: [
        { x: 0, y: 4, blur: 12, color: 'shadowFar', opacity: 0.24 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 16, color: 'shadowFar', opacity: 1 },
    },
  },
  ...coloredShadows('12px', color => ({
    light: {
      ios: [
        { x: 0, y: 4, blur: 12, color, opacity: 0.24 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 16, color, opacity: 1 },
    },
    dark: {
      ios: [
        { x: 0, y: 4, blur: 12, color: 'shadowFar', opacity: 0.24 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 16, color: 'shadowFar', opacity: 1 },
    },
  })),

  '18px': {
    light: {
      ios: [
        { x: 0, y: 6, blur: 18, color: 'shadowFar', opacity: 0.08 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 24, color: 'shadowFar', opacity: 0.6 },
    },
    dark: {
      ios: [
        { x: 0, y: 6, blur: 18, color: 'shadowFar', opacity: 0.24 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 24, color: 'shadowFar', opacity: 1 },
    },
  },
  ...coloredShadows('18px', color => ({
    light: {
      ios: [
        { x: 0, y: 6, blur: 18, color, opacity: 0.24 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 44, color, opacity: 1 },
    },
    dark: {
      ios: [
        { x: 0, y: 6, blur: 18, color: 'shadowFar', opacity: 0.24 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 24, color: 'shadowFar', opacity: 1 },
    },
  })),

  '24px': {
    light: {
      ios: [
        { x: 0, y: 8, blur: 24, color: 'shadowFar', opacity: 0.12 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 32, color: 'shadowFar', opacity: 0.7 },
    },
    dark: {
      ios: [
        { x: 0, y: 8, blur: 24, color: 'shadowFar', opacity: 0.32 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 32, color: 'shadowFar', opacity: 1 },
    },
  },
  ...coloredShadows('24px', color => ({
    light: {
      ios: [
        { x: 0, y: 8, blur: 24, color, opacity: 0.32 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 54, color, opacity: 1 },
    },
    dark: {
      ios: [
        { x: 0, y: 8, blur: 24, color: 'shadowFar', opacity: 0.32 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 32, color: 'shadowFar', opacity: 1 },
    },
  })),

  '30px': {
    light: {
      ios: [
        { x: 0, y: 10, blur: 30, color: 'shadowFar', opacity: 0.16 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.2 },
      ],
      android: { elevation: 24, color: 'shadowFar', opacity: 1 },
    },
    dark: {
      ios: [
        { x: 0, y: 10, blur: 30, color: 'shadowFar', opacity: 0.4 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 24, color: 'shadowFar', opacity: 1 },
    },
  },
  ...coloredShadows('30px', color => ({
    light: {
      ios: [
        { x: 0, y: 10, blur: 30, color, opacity: 0.4 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 54, color, opacity: 1 },
    },
    dark: {
      ios: [
        { x: 0, y: 10, blur: 30, color: 'shadowFar', opacity: 0.4 },
        { x: 0, y: 2, blur: 6, color: 'shadowNear', opacity: 0.02 },
      ],
      android: { elevation: 24, color: 'shadowFar', opacity: 1 },
    },
  })),
};

interface DeprecatedShadowValue {
  ios: {
    color?: ShadowColorValue;
    x: number;
    y: number;
    opacity: number;
    blur: number;
  }[];
  android: {
    color?: ShadowColorValue;
    elevation: number;
    opacity: number;
  };
}

type DeprecatedShadowName =
  | '9px medium'
  | '12px light'
  | '12px medium'
  | '12px heavy'
  | '15px light'
  | '15px medium'
  | '21px light'
  | '21px heavy'
  | '30px light'
  | '30px medium'
  | '30px heavy';

const deprecatedShadowHierarchy: Record<DeprecatedShadowName, DeprecatedShadowValue> = {
  '9px medium': {
    ios: [
      { x: 0, y: 1, blur: 3, opacity: 0.12 },
      { x: 0, y: 3, blur: 9, opacity: 0.04 },
    ],
    android: { elevation: 9, opacity: 0.8 },
  },
  '12px light': {
    ios: [{ x: 0, y: 4, blur: 12, opacity: 0.1 }],
    android: { elevation: 12, opacity: 0.6 },
  },
  '12px medium': {
    ios: [{ x: 0, y: 4, blur: 12, opacity: 0.15 }],
    android: { elevation: 12, opacity: 0.8 },
  },
  '12px heavy': {
    ios: [
      { x: 0, y: 2, blur: 4, opacity: 0.3 },
      { x: 0, y: 6, blur: 12, opacity: 0.1 },
    ],
    android: { elevation: 12, opacity: 1 },
  },
  '15px light': {
    ios: [{ x: 0, y: 5, blur: 15, opacity: 0.15 }],
    android: { elevation: 15, opacity: 0.5 },
  },
  '15px medium': {
    ios: [{ x: 0, y: 5, blur: 15, opacity: 0.2 }],
    android: { elevation: 15, opacity: 0.5 },
  },
  '21px light': {
    ios: [
      { x: 0, y: 3.5, blur: 10.5, opacity: 0.06 },
      { x: 0, y: 7, blur: 21, opacity: 0.04 },
    ],
    android: { elevation: 21, opacity: 0.5 },
  },
  '21px heavy': {
    ios: [
      { x: 0, y: 3.5, blur: 10.5, opacity: 0.35 },
      { x: 0, y: 7, blur: 21, opacity: 0.25 },
    ],
    android: { elevation: 21, opacity: 1 },
  },
  '30px light': {
    ios: [
      { x: 0, y: 5, blur: 15, opacity: 0.2 },
      { x: 0, y: 10, blur: 30, opacity: 0.15 },
    ],
    android: { elevation: 30, opacity: 0.5 },
  },
  '30px medium': {
    ios: [
      { x: 0, y: 5, blur: 15, opacity: 0.3 },
      { x: 0, y: 10, blur: 30, opacity: 0.15 },
    ],
    android: { elevation: 30, opacity: 0.8 },
  },
  '30px heavy': {
    ios: [
      { x: 0, y: 5, blur: 15, opacity: 0.4 },
      { x: 0, y: 10, blur: 30, opacity: 0.2 },
    ],
    android: { elevation: 30, opacity: 1 },
  },
};

function defineValuesForColorModes<Value>(defineValue: (colorMode: ShadowColorMode) => Value) {
  return {
    light: defineValue('light'),
    dark: defineValue('dark'),
  };
}

export const shadows = {
  ...shadowHierarchy,

  ...(Object.entries(deprecatedShadowHierarchy).reduce((currentShadows, [key, hierarchy]) => {
    const nextShadows = shadowColors.reduce(
      (currentShadows, color) => ({
        ...currentShadows,
        [`${key} ${color} (Deprecated)`]: defineValuesForColorModes(() => ({
          ios: hierarchy.ios.map((attrs, i) => ({
            ...attrs,
            color: i === hierarchy.ios.length - 1 ? 'shadowFar' : color,
          })),
          android: {
            ...hierarchy.android,
            color: color || 'shadowFar',
          },
        })),
      }),
      {}
    );

    return {
      ...currentShadows,
      [`${key} (Deprecated)`]: defineValuesForColorModes(() => ({
        ios: hierarchy.ios.map(attrs => ({
          ...attrs,
          color: 'shadowFar',
        })),
        android: {
          ...hierarchy.android,
          color: 'shadowFar',
        },
      })),
      ...nextShadows,
    };
  }, {}) as { [key in DeprecatedShadowKey]: ShadowValue }),
};

type DeprecatedShadowKey = `${DeprecatedShadowName} (Deprecated)` | `${DeprecatedShadowName} ${ShadowColor} (Deprecated)`;

export type CustomShadow = { custom: ShadowValue };
export type Shadow = keyof typeof shadows | CustomShadow;
