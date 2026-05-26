import { PerpsNavigation } from '@/features/perps/screens/PerpsNavigator';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { device } from '@/storage';

export const HAS_SEEN_PERPS_EXPLAIN_KEY = 'hasSeenPerpsExplainSheet';

export function maybeNavigateToPerpsExplainSheet(navigationAction: () => void): void {
  const hasSeenExplainSheet = device.get([HAS_SEEN_PERPS_EXPLAIN_KEY]);
  if (hasSeenExplainSheet) {
    navigationAction();
    return;
  }
  Navigation.handleAction(Routes.PERPS_EXPLAIN_SHEET, {
    onDismiss: () => {
      device.set([HAS_SEEN_PERPS_EXPLAIN_KEY], true);
      navigationAction();
    },
  });
}

export function navigateToPerps(params?: RootStackParamList[typeof Routes.PERPS_NAVIGATOR]) {
  maybeNavigateToPerpsExplainSheet(() => Navigation.handleAction(Routes.PERPS_NAVIGATOR, params));
}

export function navigateToPerpsDestination(segments: string[]): void {
  if (segments.length) {
    navigateToPerpsSearch();
    return;
  }

  navigateToPerps();
}

export function navigateToPerpsSearch() {
  PerpsNavigation.navigate(Routes.PERPS_SEARCH_SCREEN, { type: 'search' });
  navigateToPerps({ initialPerpsPage: Routes.PERPS_SEARCH_SCREEN });
}
