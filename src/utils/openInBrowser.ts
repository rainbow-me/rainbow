import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export const openInBrowser = (url: string, internal = true, SafariContext = false) => {
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

  if (SafariContext) {
    const handleOpenInSafariContext = async (url: string) => {
      try {
        await WebBrowser.openBrowserAsync(url, {
          createTask: true,
          // iOS
          dismissButtonStyle: 'done',
          controlsColor: '#007AFF',
          readerMode: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
          // Android
          showTitle: false,
          toolbarColor: 'white',
          secondaryToolbarColor: 'gray',
          enableDefaultShareMenuItem: true,
        });
      } catch (error) {
        // This error is thrown when the user closes the browser, so we can safely ignore it.
        logger.debug('[AddCash]: Expo WebBrowser closed by user', { message: (error as Error).message });
      }
    };
    return handleOpenInSafariContext(url);
  }

  return Linking.openURL(url);
};
