import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { HapticFeedbackType } from '@/utils/haptics';
import { safeAreaInsetValues } from '@/utils';

export const enum RainbowPointsFlowSteps {
  Initialize = 0,
  SignIn = 1,
  CalculatePoints = 2,
  Share = 3,
  Done = 4,
}

export const CHARACTER_WIDTH = 9.2725;
export const POINTS_TWEET_INTENT_ID = '3ttGOpIsbJg3aa00FScp3I';
export const SCREEN_BOTTOM_INSET = safeAreaInsetValues.bottom + 20;

export const rainbowColors = {
  blue: { text: '#31BCC4', shadow: 'rgba(49, 188, 196, 0.8)' },
  green: { text: '#57EA5F', shadow: 'rgba(87, 234, 95, 0.8)' },
  yellow: { text: '#F0D83F', shadow: 'rgba(240, 216, 63, 0.8)' },
  red: { text: '#DF5337', shadow: 'rgba(223, 83, 55, 0.8)' },
  purple: { text: '#B756A7', shadow: 'rgba(183, 86, 167, 0.8)' },
};

export const textColors = {
  account: { text: '#FEC101', shadow: 'rgba(254, 193, 1, 0.8)' },
  gray: { text: '#94969B', shadow: 'rgba(148, 150, 155, 0.8)' },
  green: { text: '#3ECF5B', shadow: 'rgba(62, 207, 91, 0.8)' },
  white: { text: '#FFFFFF', shadow: 'rgba(255, 255, 255, 0.8)' },
};

export const rainbowText = {
  row1: '\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row2: ' \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row3: '  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row4: '   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row5: '    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row6: '     \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row7: '      \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row8: '       \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\',
  row9: ' WELCOME TO POINTS ',
};

export const generateRainbowColors = (
  text: string
): Array<{ text: string; shadow: string }> | undefined => {
  let colorIndex = 0;
  let repeatCount = 0;
  const colorKeys: string[] = Object.keys(rainbowColors);
  const colors: Array<{ text: string; shadow: string }> = [];
  const repeatLength: number = Math.floor(text.length / (colorKeys.length * 2));

  text.split('').forEach(() => {
    if (repeatCount >= repeatLength + Math.round(Math.random())) {
      repeatCount = 0;
      colorIndex = (colorIndex + 1) % colorKeys.length;
    }
    colors.push(
      rainbowColors[colorKeys[colorIndex] as keyof typeof rainbowColors]
    );
    repeatCount += 1;
  });

  return colors;
};

export const triggerHapticFeedback = (hapticType: HapticFeedbackType) =>
  ReactNativeHapticFeedback.trigger(hapticType);
