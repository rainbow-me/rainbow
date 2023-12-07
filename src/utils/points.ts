import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { delay } from '@/utils/delay';

export const handlePointsReferralCodeDeeplink = (code: string) => {
  delay(3000).then(() => {
    Navigation.handleAction(Routes.POINTS_SCREEN, {
      referralCode: code,
      deeplinkId: Math.random().toString(36).slice(2),
    });
  });
};
