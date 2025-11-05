import { device } from '@/storage';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';

export function navigateToPerps(params?: RootStackParamList[typeof Routes.PERPS_NAVIGATOR]) {
  // TODO: Not sure this is the best place to store this
  const hasSeenExplainSheet = device.get(['hasSeenPerpsExplainSheet']);

  if (!hasSeenExplainSheet) {
    Navigation.handleAction(Routes.PERPS_EXPLAIN_SHEET, {
      onDismiss: () => {
        device.set(['hasSeenPerpsExplainSheet'], true);
        Navigation.handleAction(Routes.PERPS_NAVIGATOR, params);
      },
    });
  } else {
    Navigation.handleAction(Routes.PERPS_NAVIGATOR, params);
  }
}
