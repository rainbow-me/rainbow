// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/debug' or i... Remove this comment to see the full error message
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import React, { useCallback } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingActionButton' was resolved to '/... Remove this comment to see the full error message
import FloatingActionButton from './FloatingActionButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo, watchingAlert } from '@rainbow-me/utils';

const FabShadow = [
  [0, 10, 30, lightModeThemeColors.shadow, 0.8],
  [0, 5, 15, lightModeThemeColors.paleBlue, 1],
];

const FabIcon = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 'zero',
  size: 24,
  weight: 'semibold',
}))``;

const SendFab = ({ disabled, isReadOnlyWallet, ...props }: any) => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SEND_FLOW);
    } else {
      watchingAlert();
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingActionButton
      {...props}
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="send-fab"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FabIcon color={colors.whiteLabel}>􀈠</FabIcon>
    </FloatingActionButton>
  );
};

export default magicMemo(SendFab, ['disabled', 'isReadOnlyWallet']);
