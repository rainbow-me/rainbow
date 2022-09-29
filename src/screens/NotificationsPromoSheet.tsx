import React, { useCallback } from 'react';
import { useNavigation } from '../navigation/Navigation';
import { CampaignKey } from '@/campaigns/campaignChecks';
import { PromoSheet } from '@/components/promos';
import SwapsPromoBackground from '@/assets/swapsPromoBackground.png';
import SwapsPromoHeader from '@/assets/swapsPromoHeader.png';
import { delay } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';

const HEADER_HEIGHT = 285;
const HEADER_WIDTH = 390;

export default function NotificationsPromoSheet() {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();

  const navigateToNotifications = useCallback(() => {
    goBack();
    delay(300).then(() => {
      navigate(Routes.SETTINGS_SHEET);
      delay(300).then(() =>
        navigate(Routes.SETTINGS_SHEET, {
          screen: 'NotificationsSection',
        })
      );
    });
  }, [goBack, navigate]);

  return (
    <PromoSheet
      accentColor={colors.whiteLabel}
      backgroundColor={colors.trueBlack}
      backgroundImage={SwapsPromoBackground}
      campaignKey={CampaignKey.notificationsLaunch}
      headerImage={SwapsPromoHeader}
      headerImageAspectRatio={HEADER_WIDTH / HEADER_HEIGHT}
      icon1="􀖅"
      icon2="􀯮"
      icon3="􀙨"
      iconGradient={colors.gradients.swapPurpleTintToSwapPurple}
      onPress={navigateToNotifications}
      sheetHandleColor={colors.whiteLabel}
    />
  );
}
