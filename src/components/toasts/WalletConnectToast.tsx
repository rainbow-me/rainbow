import React from 'react';
import { StyleSheet, View } from 'react-native';
import { toast } from 'sonner-native';
import { globalColors } from '@/design-system';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { fontWithWidth } from '@/styles';
import font from '@/styles/fonts';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { isDarkTheme } from '@/theme/ThemeContext';

const WALLETCONNECT_TOAST_ID = 'walletConnect';

export const hideWalletConnectToast = () => {
  toast.dismiss(WALLETCONNECT_TOAST_ID);
};

export const showWalletConnectToast = async () => {
  const isDarkMode = await isDarkTheme();

  toast(i18n.t(i18n.l.walletconnect.connecting), {
    dismissible: false,
    duration: 10000, // Hide after 10 seconds
    icon: <EmptyComponent />,
    id: WALLETCONNECT_TOAST_ID,
    position: 'top-center',
    styles: {
      title: styles.title,
      toast: isDarkMode ? styles.toastDark : styles.toastLight,
      toastContainer: isDarkMode ? styles.toastContainerDark : styles.toastContainerLight,
      toastContent: styles.toastContent,
    },
    unstyled: true,
  });
};

const EmptyComponent = () => {
  return <View style={styles.zeroDimensions} />;
};

const conditionalStyles = StyleSheet.create({
  title: {
    alignSelf: 'center',
    color: globalColors.white100,
    fontSize: 17,
    ...fontWithWidth(font.weight.bold),
    letterSpacing: 0.37,
    paddingHorizontal: 20,
    paddingVertical: 16,
    textAlign: 'center',
  },
  titleShadow: {
    textShadowColor: opacity(globalColors.white100, 0.7),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  toast: {
    backgroundColor: globalColors.grey100,
    borderCurve: 'continuous',
    borderRadius: 40,
    gap: 0,
    marginHorizontal: 'auto',
    overflow: 'hidden',
    padding: 0,
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
    justifyContent: 'center',
    marginVertical: -2,
  },
  toastDark: {
    ...conditionalStyles.toast,
    ...conditionalStyles.toastBorderDark,
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
