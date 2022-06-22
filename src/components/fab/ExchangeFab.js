import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { delayNext } from '../../hooks/useMagicAutofocus';
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { Text } from '../text';
import FloatingActionButton from './FloatingActionButton';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import {
  CurrencySelectionTypes,
  ExchangeModalTypes,
} from '@rainbow-me/helpers';
import { useSwapCurrencyHandlers } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { magicMemo, watchingAlert } from '@rainbow-me/utils';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.8],
  [0, 5, 15, lightModeThemeColors.swapPurple, 1],
];

const FabIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 'zero',
  size: 24,
  weight: 'semibold',
}))({});

const ExchangeFab = ({ disabled, isReadOnlyWallet, ...props }) => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: false,
    type: ExchangeModalTypes.swap,
  });

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      android && delayNext();
      navigate(Routes.EXCHANGE_MODAL, {
        fromDiscover: true,
        params: {
          fromDiscover: true,
          onSelectCurrency: updateInputCurrency,
          title: lang.t('swap.modal_types.swap'),
          type: CurrencySelectionTypes.input,
        },
        screen: Routes.CURRENCY_SELECT_SCREEN,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate, updateInputCurrency]);

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.swapPurple}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="exchange-fab"
    >
      <FabIcon>􀖅</FabIcon>
    </FloatingActionButton>
  );
};

export default magicMemo(ExchangeFab, ['disabled', 'isReadOnlyWallet']);
