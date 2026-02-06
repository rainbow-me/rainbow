import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { shouldShowNotificationPermissionScreen } from '@/notifications/permissions';

export const navigateAfterOnboarding = async (): Promise<void> => {
  const shouldShowNotifications = await shouldShowNotificationPermissionScreen();
  if (shouldShowNotifications) {
    Navigation.handleAction(Routes.NOTIFICATION_PERMISSION_SCREEN);
    return;
  }

  Navigation.handleAction(Routes.SWIPE_LAYOUT, {
    screen: Routes.WALLET_SCREEN,
  });
};
