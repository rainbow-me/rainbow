import React, { useCallback } from 'react';
import { delayNext } from '../../hooks/useMagicAutofocus';
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useEth } from '../../utils/ethereumUtils';
import { Text } from '../text';
import FloatingActionButton from './FloatingActionButton';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
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
  const eth = useEth();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      android && delayNext();
      navigate(Routes.EXCHANGE_MODAL, {
        params: {
          params: {
            inputAsset: eth,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate, eth]);

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
