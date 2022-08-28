import React, { useCallback } from 'react';
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../text';
import FloatingActionButton from './FloatingActionButton';
import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { magicMemo, watchingAlert } from '@/utils';

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
}))({});

const SendFab = ({ disabled, isReadOnlyWallet, ...props }) => {
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
    <FloatingActionButton
      {...props}
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="send-fab"
    >
      <FabIcon color={colors.whiteLabel}>􀈠</FabIcon>
    </FloatingActionButton>
  );
};

export default magicMemo(SendFab, ['disabled', 'isReadOnlyWallet']);
