import React from 'react';
import { StyleSheet, View } from 'react-native';
import { toast } from 'sonner-native';
import { globalColors } from '@/design-system';
import { typeHierarchy } from '@/design-system/typography/typeHierarchy';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { fontWithWidth } from '@/styles';
import font from '@/styles/fonts';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { isDarkTheme } from '@/theme/ThemeContext';

const WALLETCONNECT_TOAST_ID = 'walletConnect';
const HIDE_BUFFER_MS = 750;

let lastHideTime = 0;

export const hideWalletConnectToast = () => {
  lastHideTime = Date.now();
  toast.dismiss(WALLETCONNECT_TOAST_ID);
};

export const showWalletConnectToast = async ({ isTransactionRequest = false }: { isTransactionRequest?: boolean } = {}) => {
  if (Date.now() - lastHideTime <= HIDE_BUFFER_MS) {
    // If the transaction request loads and hide is called before the toast is shown, skip showing it
    return;
  }

  const isDarkMode = await isDarkTheme();

  toast(i18n.t(i18n.l.walletconnect[isTransactionRequest ? 'loading' : 'connecting']), {
    dismissible: false,
    duration: 10000, // Auto hide after 10 seconds
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

const TOAST_HEIGHT = 48;

const TEXT_LINE_HEIGHT = typeHierarchy.text['17pt'].lineHeight;
const TEXT_PADDING_VERTICAL = 16;
const TOTAL_TEXT_HEIGHT = TEXT_LINE_HEIGHT + TEXT_PADDING_VERTICAL * 2;
const TEXT_Y_OFFSET = (TOAST_HEIGHT - TOTAL_TEXT_HEIGHT) / 2;

const conditionalStyles = StyleSheet.create({
  title: {
    alignSelf: 'center',
    color: globalColors.white100,
    fontSize: typeHierarchy.text['17pt'].fontSize,
    ...fontWithWidth(font.weight.bold),
    letterSpacing: typeHierarchy.text['17pt'].letterSpacing,
    lineHeight: TEXT_LINE_HEIGHT,
    marginTop: TEXT_Y_OFFSET,
    paddingHorizontal: 20,
    paddingVertical: TEXT_PADDING_VERTICAL,
    textAlign: 'center',
  },
  titleShadow: {
    textShadowColor: opacity(globalColors.white100, 0.7),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  toast: {
    alignItems: 'center',
    backgroundColor: globalColors.grey100,
    borderCurve: 'continuous',
    borderRadius: TOAST_HEIGHT / 2,
    gap: 0,
    height: TOAST_HEIGHT,
    justifyContent: 'center',
    marginHorizontal: 'auto',
    overflow: 'hidden',
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
