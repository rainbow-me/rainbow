import { logger } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Linking, Platform } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

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
        console.log('[openInBrowser]: Opening URL in Safari context', { url });
        if (await InAppBrowser.isAvailable()) {
          await InAppBrowser.open(
            url,
            Platform.select({
              ios: {
                // iOS Properties
                dismissButtonStyle: 'done',
                preferredBarTintColor: 'white',
                preferredControlTintColor: '#007AFF',
                readerMode: false,
                animated: true,
                modalTransitionStyle: 'coverVertical',
                modalPresentationStyle: 'pageSheet',
                ephemeralWebSession: true,
              },
              android: {
                // Android Properties
                showTitle: false,
                toolbarColor: 'white',
                secondaryToolbarColor: 'gray',
                navigationBarColor: 'gray',
                navigationBarDividerColor: 'white',
                enableUrlBarHiding: true,
                enableDefaultShare: true,
                forceCloseOnRedirection: true,
              },
            })
          );
        } else {
          await Linking.openURL(url);
        }
      } catch (error) {
        // This error is thrown when the user closes the browser, so we can safely ignore it.
        logger.debug('[AddCash]: InAppBrowser closed by user', { message: (error as Error).message });
      }
    };
    return handleOpenInSafariContext(url);
  }

  return Linking.openURL(url);
};
