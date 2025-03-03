import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export function useOpenInBrowser() {
  return (url: string) => {
    Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, { url });
  };
}
