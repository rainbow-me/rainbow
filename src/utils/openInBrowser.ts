import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Linking } from 'react-native';

export const openInBrowser = (url: string, internal = true) => {
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

  if (internal) {
    return Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, { url });
  }

  return Linking.openURL(url);
};
