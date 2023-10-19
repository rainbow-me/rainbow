import React, { useCallback } from 'react';

import { useNavigation } from '@/navigation/Navigation';
import { CampaignKey } from '@/campaigns/campaignChecks';
import { PromoSheet } from '@/components/PromoSheet';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import { useSwapCurrencyHandlers } from '@/hooks';
import SwapsPromoBackground from '@/assets/swapsPromoBackground.png';
import SwapsPromoHeader from '@/assets/swapsPromoHeader.png';
import { delay } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';

const HEADER_HEIGHT = 285;
const HEADER_WIDTH = 390;

export default function RemotePromoSheet() {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();
  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: false,
    type: ExchangeModalTypes.swap,
  });
  const translations = i18n.l.promos.swaps_launch;

  const navigateToSwaps = useCallback(() => {
    goBack();
    delay(300).then(() =>
      navigate(Routes.EXCHANGE_MODAL, {
        fromDiscover: true,
        params: {
          fromDiscover: true,
          onSelectCurrency: updateInputCurrency,
          title: i18n.t(i18n.l.swap.modal_types.swap),
          type: CurrencySelectionTypes.input,
        },
        screen: Routes.CURRENCY_SELECT_SCREEN,
      })
    );
  }, [goBack, navigate, updateInputCurrency]);

  return (
    <PromoSheet
      accentColor={colors.whiteLabel}
      backgroundColor={colors.trueBlack}
      backgroundImage={SwapsPromoBackground}
      campaignKey={CampaignKey.swapsLaunch}
      headerImage={SwapsPromoHeader}
      headerImageAspectRatio={HEADER_WIDTH / HEADER_HEIGHT}
      sheetHandleColor={colors.whiteLabel}
      header={i18n.t(translations.header)}
      subHeader={i18n.t(translations.subheader)}
      primaryButtonProps={{
        label: i18n.t(translations.primary_button),
        onPress: navigateToSwaps,
      }}
      secondaryButtonProps={{
        label: i18n.t(translations.secondary_button),
        onPress: goBack,
      }}
      items={[
        {
          title: i18n.t(translations.info_row_1.title),
          description: i18n.t(translations.info_row_1.description),
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
