import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { useNavigation } from '../navigation/Navigation';
import { CampaignKey } from '@/campaigns/campaignChecks';
import { PromoSheet } from '@/components/promos';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import { useSwapCurrencyHandlers } from '@/hooks';
import SwapsPromoBackground from '@rainbow-me/assets/swapsPromoBackground.png';
import SwapsPromoHeader from '@rainbow-me/assets/swapsPromoHeader.png';
import { delay } from '@rainbow-me/helpers/utilities';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';

const HEADER_HEIGHT = 285;
const HEADER_WIDTH = 390;

export default function SwapsPromoSheet() {
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();
  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: false,
    type: ExchangeModalTypes.swap,
  });

  const navigateToSwaps = useCallback(() => {
    goBack();
    delay(300).then(() =>
      navigate(Routes.EXCHANGE_MODAL, {
        fromDiscover: true,
        params: {
          fromDiscover: true,
          onSelectCurrency: updateInputCurrency,
          title: lang.t('swap.modal_types.swap'),
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
      icon1="􀖅"
      icon2="􀯮"
      icon3="􀙨"
      iconGradient={colors.gradients.swapPurpleTintToSwapPurple}
      onPress={navigateToSwaps}
      promoType="swaps"
      sheetHandleColor={colors.whiteLabel}
    />
  );
}
