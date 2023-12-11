import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { POINTS_ROUTES } from '@/screens/points/PointsScreen';

export const handlePointsReferralCodeDeeplink = (code: string) => {
  Navigation.handleAction(Routes.POINTS_SCREEN, {
    externalReferralCode: code,
    deeplinkId: Math.random().toString(36).slice(2),
    screen: POINTS_ROUTES.REFERRAL_CONTENT,
    params: {
      externalReferralCode: code,
    },
  });
};
