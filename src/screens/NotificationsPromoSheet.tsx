import React, { useCallback } from 'react';

import { useNavigation } from '@/navigation/Navigation';
import { CampaignKey } from '@/campaigns/campaignChecks';
import { PromoSheet } from '@/components/PromoSheet';
import backgroundImage from '@/assets/notificationsPromoSheetBackground.png';
import headerImageIOS from '@/assets/notificationsPromoSheetHeaderIOS.png';
import headerImageAndroid from '@/assets/notificationsPromoSheetHeaderAndroid.png';
import { delay } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { IS_IOS } from '@/env';

const HEADER_HEIGHT = 255;
const HEADER_WIDTH = 390;

export default function NotificationsPromoSheet() {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();
  const translations = i18n.l.promos.notifications_launch;

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
      backgroundImage={backgroundImage}
      campaignKey={CampaignKey.notificationsLaunch}
      headerImage={IS_IOS ? headerImageIOS : headerImageAndroid}
      headerImageAspectRatio={HEADER_WIDTH / HEADER_HEIGHT}
      sheetHandleColor={colors.whiteLabel}
      header={i18n.t(translations.header)}
      subHeader={i18n.t(translations.subheader)}
      primaryButtonProps={{
        label: i18n.t(translations.primary_button),
        onPress: navigateToNotifications,
      }}
      secondaryButtonProps={{
        label: i18n.t(translations.secondary_button),
        onPress: goBack,
      }}
      items={[
        {
          title: i18n.t(translations.info_row_1.title),
          description: i18n.t(translations.info_row_1.title),
          icon: '􀖅',
          gradient: colors.gradients.swapPurpleTintToSwapPurple,
        },
        {
          title: i18n.t(translations.info_row_2.title),
          description: i18n.t(translations.info_row_2.description),
          icon: '􀯮',
          gradient: colors.gradients.swapPurpleTintToSwapPurple,
        },
        {
          title: i18n.t(translations.info_row_3.title),
          description: i18n.t(translations.info_row_3.description),
          icon: '􀙨',
          gradient: colors.gradients.swapPurpleTintToSwapPurple,
        },
      ]}
    />
  );
}
