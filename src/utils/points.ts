import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { POINTS_ROUTES } from '@/screens/points/PointsScreen';
import { delay } from '@/utils/delay';

export const handlePointsReferralCodeDeeplink = (code: string) => {
  delay(3000).then(() => {
    Navigation.handleAction(Routes.POINTS_SCREEN, {
      externalReferralCode: code,
      deeplinkId: Math.random().toString(36).slice(2),
      screen: POINTS_ROUTES.REFERRAL_CONTENT,
      params: {
        externalReferralCode: code,
      },
    });
  });
};
