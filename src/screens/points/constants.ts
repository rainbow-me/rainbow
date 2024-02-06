import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { HapticFeedbackType } from '@/utils/haptics';
import { safeAreaInsetValues } from '@/utils';
import { OnboardPointsMutation, PointsOnboardingCategory } from '@/graphql/__generated__/metadata';
import * as i18n from '@/languages';
import { IS_IOS } from '@/env';

const ONE_WEEK_MS = 604_800_000;
const ONE_DAY_MS = ONE_WEEK_MS / 7;

export const enum RainbowPointsFlowSteps {
  Initialize = 0,
  CalculatePoints = 1,
  Share = 2,
  Review = 3,

  ViewWeeklyEarnings = 4,
  RequireWalletBalance = 5,
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
  red: { text: '#F24527', shadow: 'rgba(242, 69, 39, 0.80)' },
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

export const generateRainbowColors = (text: string): Array<{ text: string; shadow: string }> | undefined => {
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
    colors.push(rainbowColors[colorKeys[colorIndex] as keyof typeof rainbowColors]);
    repeatCount += 1;
  });

  return colors;
};

export const triggerHapticFeedback = (hapticType: HapticFeedbackType) => ReactNativeHapticFeedback?.trigger(hapticType);

const BASE_URL = `https://twitter.com/intent/tweet?text=`;
const NEWLINE_OR_SPACE = IS_IOS ? '\n\n' : ' ';
export const buildTwitterIntentMessage = (
  profile: OnboardPointsMutation | undefined,
  metamaskSwaps: PointsOnboardingCategory | undefined
) => {
  if (!profile?.onboardPoints) return;

  const ONBOARDING_TOTAL_POINTS = profile.onboardPoints.user.onboarding.earnings.total;
  const referralCode = profile.onboardPoints.user.referralCode;

  let text = `I just had ${ONBOARDING_TOTAL_POINTS.toLocaleString(
    'en-US'
  )} Rainbow Points dropped into my wallet — everybody has at least 100 points waiting for them, but you might have more!${NEWLINE_OR_SPACE}Claim your drop: https://rainbow.me/points?ref=${referralCode}`;

  if (metamaskSwaps && metamaskSwaps?.earnings?.total > 0) {
    const METAMASK_POINTS = metamaskSwaps.earnings.total;
    text = `I just had ${(ONBOARDING_TOTAL_POINTS - METAMASK_POINTS).toLocaleString(
      'en-US'
    )} Rainbow Points dropped into my wallet — plus an extra ${METAMASK_POINTS.toLocaleString(
      'en-US'
    )} Points as a bonus for migrating my MetaMask wallet into Rainbow 🦊 🔫.${NEWLINE_OR_SPACE}Everybody has at least 100 points waiting for them, but you might have more! Claim your drop: https://rainbow.me/points?ref=${referralCode}`;
  }

  return BASE_URL + text;
};

export const displayNextDistribution = (seconds: number) => {
  const days = [
    i18n.t(i18n.l.points.points.sunday),
    i18n.t(i18n.l.points.points.monday),
    i18n.t(i18n.l.points.points.tuesday),
    i18n.t(i18n.l.points.points.wednesday),
    i18n.t(i18n.l.points.points.thursday),
    i18n.t(i18n.l.points.points.friday),
    i18n.t(i18n.l.points.points.saturday),
  ];

  const ms = seconds * 1000;
  const date = new Date(ms);
  const minutes = date.getMinutes();
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  if (ms - Date.now() > ONE_WEEK_MS) {
    return `${hours}${ampm} ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  } else {
    let dayOfWeek = days[date.getDay()];
    const today = new Date().getDay();
    if (days[today] === dayOfWeek && ms - Date.now() < ONE_DAY_MS) {
      dayOfWeek = i18n.t(i18n.l.points.points.today);
    }

    return `${hours}:${minutes}${ampm} ${dayOfWeek}`;
  }
};
