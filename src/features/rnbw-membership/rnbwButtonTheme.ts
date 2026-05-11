import type { LinearGradientProps } from 'expo-linear-gradient';

import { opacity } from '@/framework/ui/utils/opacity';

type Themed<T> = { light: T; dark: T };

type GradientStop = {
  colors: LinearGradientProps['colors'];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

type ShadowTheme = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
};

type TextShadowTheme = {
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
  textShadowColor: string;
};

export const RNBW_BUTTON_CONFIG = {
  gradient: {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  primary: {
    colors: ['#FFE380', '#E3A700'],
    border: {
      light: [opacity('#B5910D', 0.1125), opacity('#B5910D', 0.15)],
      dark: [opacity('#B5910D', 0.1125), opacity('#B5910D', 0.15)],
    },
    highlight: {
      light: {
        colors: [opacity('#FFE67E', 0), opacity('#FFE67E', 0.5), opacity('#FFE67E', 0)],
        start: { x: 0.25, y: 0.5 },
        end: { x: 0.75, y: 0.5 },
      },
      dark: {
        colors: [opacity('#FFE67E', 0), opacity('#FFE67E', 0.5), opacity('#FFE67E', 0)],
        start: { x: 0.25, y: 0.5 },
        end: { x: 0.75, y: 0.5 },
      },
    } satisfies Themed<GradientStop>,
    text: {
      colors: ['#4F3605', '#90630E'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      shadow: {
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
        textShadowColor: 'rgba(255, 255, 255, 0.26)',
      } satisfies TextShadowTheme,
    },
    shadows: {
      light: [
        { shadowColor: '#8A6216', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
        { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 2.5 },
      ],
      dark: [{ shadowColor: '#FFDD20', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 }],
    } satisfies Themed<readonly ShadowTheme[]>,
  },
  secondary: {
    colors: {
      light: [opacity('#F8DE7D', 0.4), opacity('#D9B550', 0.4)],
      dark: [opacity('#FFE380', 0.1), opacity('#E3A700', 0.1)],
    },
    border: {
      light: [opacity('#B5910D', 0.08), opacity('#B5910D', 0.08)],
      dark: [opacity('#B5910D', 0.049), opacity('#B5910D', 0.07)],
    },
    text: {
      color: { light: '#6F4D0A', dark: '#FAD96B' },
    },
    shadows: {
      light: [
        { shadowColor: '#8A6216', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
        { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 2.5 },
      ],
      dark: [{ shadowColor: '#F8DE7D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 }],
    } satisfies Themed<readonly ShadowTheme[]>,
  },
} as const;
