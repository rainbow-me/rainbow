import React from 'react';
import { StyleSheet, View } from 'react-native';
import { toast } from 'sonner-native';
import { getExperimetalFlag, PERFORMANCE_TOAST } from '@/config';
import { globalColors } from '@/design-system';
import { typeHierarchy } from '@/design-system/typography/typeHierarchy';
import { IS_IOS, IS_TEST } from '@/env';
import { fontWithWidth } from '@/styles';
import font from '@/styles/fonts';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { isDarkTheme } from '@/theme/ThemeContext';
import { time } from '@/utils';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { PerformanceMetricsType } from './types/PerformanceMetrics';

let shouldCollectStats = !IS_TEST && getExperimetalFlag(PERFORMANCE_TOAST);
let resultsMap: Map<PerformanceMetricsType, { duration: number }> | undefined = undefined;

export function collectResultForPerformanceToast(metric: PerformanceMetricsType, duration: number) {
  if (!shouldCollectStats) return;
  if (!resultsMap) resultsMap = new Map();

  const shouldStore = metric !== 'Performance Time To Load JS Bundle' && metric !== 'Performance Complete Startup Time';
  if (shouldStore) resultsMap.set(metric, { duration });
  if (resultsMap.size === 4) logResults();
}

async function logResults() {
  if (!shouldCollectStats || !resultsMap) return;
  shouldCollectStats = false;

  const isDarkMode = await isDarkTheme();

  const TEXT_LINE_HEIGHT = typeHierarchy.text['17pt'].lineHeight;
  const TEXT_PADDING_VERTICAL = 16;
  const TOTAL_TEXT_HEIGHT = TEXT_LINE_HEIGHT * resultsMap.size + TEXT_PADDING_VERTICAL * 2;
  const TOAST_HEIGHT = TOTAL_TEXT_HEIGHT + TEXT_PADDING_VERTICAL * 2;
  const TEXT_Y_OFFSET = (TOAST_HEIGHT - TOTAL_TEXT_HEIGHT) / 2;

  const conditionalStyles = StyleSheet.create({
    title: {
      alignSelf: 'center',
      color: globalColors.white100,
      fontSize: typeHierarchy.text['13pt'].fontSize,
      ...fontWithWidth(font.weight.bold),
      letterSpacing: typeHierarchy.text['13pt'].letterSpacing,
      lineHeight: TEXT_LINE_HEIGHT,
      marginTop: TEXT_Y_OFFSET,
      paddingHorizontal: 20,
      paddingVertical: TEXT_PADDING_VERTICAL,
      textAlign: 'left',
      width: '100%',
    },
    titleShadow: {
      textShadowColor: opacity(globalColors.white100, 0.48),
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 20,
    },
    toast: {
      alignItems: 'center',
      backgroundColor: globalColors.grey100,
      borderCurve: 'continuous',
      borderRadius: 42,
      gap: 0,
      height: TOAST_HEIGHT - 8,
      justifyContent: 'center',
      marginHorizontal: 'auto',
      overflow: 'hidden',
      width: DEVICE_WIDTH - 40,
    },
    toastBorderDark: {
      borderColor: 'rgba(245, 248, 255, 0.1)',
      borderWidth: THICK_BORDER_WIDTH,
    },
    toastContainer: {
      marginTop: 6,
    },
    toastContainerShadowDark: {
      shadowColor: globalColors.grey100,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.6,
      shadowRadius: 15,
    },
    toastContainerShadowLight: {
      shadowColor: globalColors.grey100,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
    },
  });

  const styles = StyleSheet.create({
    toastContainerDark: {
      ...conditionalStyles.toastContainer,
      ...(IS_IOS ? conditionalStyles.toastContainerShadowDark : {}),
    },
    toastContainerLight: {
      ...conditionalStyles.toastContainer,
      ...(IS_IOS ? conditionalStyles.toastContainerShadowLight : {}),
    },
    toastContent: {
      alignItems: 'center',
      gap: 0,
      height: TOAST_HEIGHT,
      justifyContent: 'center',
    },
    toastDark: {
      ...conditionalStyles.toast,
      ...(IS_IOS ? conditionalStyles.toastBorderDark : {}),
    },
    toastLight: conditionalStyles.toast,
    title: {
      ...conditionalStyles.title,
      ...(IS_IOS ? conditionalStyles.titleShadow : {}),
    },
    zeroDimensions: {
      height: 0,
      width: 0,
    },
  });

  const metricsString = Array.from(resultsMap.entries())
    .sort(([, a], [, b]) => b.duration - a.duration)
    .map(([metric, data], index) => {
      const duration = Math.round(data.duration);
      const emojiForIndex = index === 0 ? '🦦' : index === 1 ? '🥉' : index === 2 ? '🥈' : '🥇';
      return `${emojiForIndex}  ${metric.replace('Performance ', '').replace('To', 'to').replace('Root App', 'Root')}: ${duration.toLocaleString()}ms`;
    })
    .join('\n')
    .trim();

  toast(metricsString, {
    description: '',
    dismissible: true,
    duration: time.seconds(6),
    icon: <View style={styles.zeroDimensions} />,
    id: 'PERFORMANCE_TRACKING',
    position: 'top-center',
    styles: {
      title: styles.title,
      toast: isDarkMode ? styles.toastDark : styles.toastLight,
      toastContainer: isDarkMode ? styles.toastContainerDark : styles.toastContainerLight,
      toastContent: styles.toastContent,
    },
    unstyled: true,
  });

  resultsMap = undefined;
}
