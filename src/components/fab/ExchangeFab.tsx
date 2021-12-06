// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/debug' or i... Remove this comment to see the full error message
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import React, { useCallback } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { delayNext } from '../../hooks/useMagicAutofocus';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { useEth } from '../../utils/ethereumUtils';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingActionButton' was resolved to '/... Remove this comment to see the full error message
import FloatingActionButton from './FloatingActionButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
}))``;

const ExchangeFab = ({ disabled, isReadOnlyWallet, ...props }: any) => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const eth = useEth();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingActionButton
      {...props}
      backgroundColor={colors.swapPurple}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="exchange-fab"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FabIcon>􀖅</FabIcon>
    </FloatingActionButton>
  );
};

export default magicMemo(ExchangeFab, ['disabled', 'isReadOnlyWallet']);
