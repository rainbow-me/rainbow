import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { Linking } from 'react-native';

export function useOpenInBrowser() {
  return async (url: string, internal = true) => {
    const isDeeplink = !url.startsWith('http');
    if (isDeeplink) {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        return Linking.openURL(url);
      }
      console.log('could not open url', url);
      return;
    }

    if (internal) {
      return Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, { url });
    }

    return Linking.openURL(url);
  };
}
