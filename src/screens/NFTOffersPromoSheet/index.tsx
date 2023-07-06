import React from 'react';

import useAppState from '@/hooks/useAppState';
import { useNavigation } from '@/navigation/Navigation';
import { CampaignKey } from '@/campaigns/campaignChecks';
import { PromoSheet } from '@/components/PromoSheet';
import headerImage from '@/assets/nftOffersPromoHeader.png';
import { delay } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { IS_IOS } from '@/env';
import { logger, RainbowError } from '@/logger';
import { analyticsV2 } from '@/analytics';

const HEADER_WIDTH = 380;
const HEADER_HEIGHT = 250;
const TRANSLATIONS = i18n.l.promos.nft_offers_launch;

export function NFTOffersPromoSheetInner() {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();

  React.useEffect(() => {
    analyticsV2.track(analyticsV2.event.nftOffersPromoShown);
    return () => {
      analyticsV2.track(analyticsV2.event.nftOffersPromoDismissed);
    };
  }, []);

  const navigateToNFTOffers = React.useCallback(() => {
    goBack();
    delay(300).then(() => {
      navigate(Routes.NFT_OFFERS_SHEET);
    });
  }, [goBack, navigate]);

  const primaryButtonOnPress = React.useCallback(async () => {}, [
    goBack,
    navigateToNFTOffers,
  ]);

  return (
    <PromoSheet
      accentColor={colors.whiteLabel}
      backgroundColor={colors.white}
      campaignKey={CampaignKey.nftOffersLaunch}
      headerImage={headerImage}
      headerImageAspectRatio={HEADER_WIDTH / HEADER_HEIGHT}
      sheetHandleColor={colors.whiteLabel}
      header={i18n.t(TRANSLATIONS.header)}
      subHeader={i18n.t(TRANSLATIONS.subheader)}
      primaryButtonProps={{
        label: i18n.t(TRANSLATIONS.primary_button.has_offers, { count: 65 }),
        onPress: primaryButtonOnPress,
      }}
      secondaryButtonProps={{
        label: i18n.t(TRANSLATIONS.secondary_button),
        onPress: goBack,
      }}
      items={[
        {
          title: i18n.t(TRANSLATIONS.info_row_1.title),
          description: i18n.t(TRANSLATIONS.info_row_1.title),
          icon: '􀖅',
          gradient: colors.gradients.appleBlueTintToAppleBlue,
        },
        {
          title: i18n.t(TRANSLATIONS.info_row_2.title),
          description: i18n.t(TRANSLATIONS.info_row_2.description),
          icon: '􀯮',
          gradient: colors.gradients.appleBlueTintToAppleBlue,
        },
        {
          title: i18n.t(TRANSLATIONS.info_row_3.title),
          description: i18n.t(TRANSLATIONS.info_row_3.description),
          icon: '􀙨',
          gradient: colors.gradients.appleBlueTintToAppleBlue,
        },
      ]}
    />
  );
}

export default function NFTOffersPromoSheet() {
  // const { justBecameActive } = useAppState();

  return <NFTOffersPromoSheetInner />;
}
