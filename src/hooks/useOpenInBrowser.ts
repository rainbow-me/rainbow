import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export function useOpenInBrowser() {
  const { navigate } = useNavigation();

  return (url: string) => {
    navigate(Routes.DAPP_BROWSER_SCREEN, { url });
  };
}
