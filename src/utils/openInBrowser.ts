import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export const openInBrowser = (url: string, useDappBrowser = true, useInAppBrowser = false) => {
  if (!url) {
    logger.warn(`[openInBrowser] No url provided, returning early...`);
    return;
  }

  const isDeeplink = !url.startsWith('http');

  if (isDeeplink) {
    return Linking.openURL(url).catch(error => {
      logger.warn('Failed to open deeplink', { url, error });
    });
  }

  if (useDappBrowser) {
    return Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, { url });
  }

  if (useInAppBrowser) {
    return WebBrowser.openBrowserAsync(url);
  }

  return Linking.openURL(url);
};
