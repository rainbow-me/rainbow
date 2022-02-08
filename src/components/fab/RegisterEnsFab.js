import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import { lightModeThemeColors } from '../../styles/colors';
import { Text } from '../text';
import FloatingActionButton from './FloatingActionButton';
import Routes from '@rainbow-me/routes';
import { magicMemo } from '@rainbow-me/utils';

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

const RegisterEnsFab = ({ disabled, ...props }) => {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    navigate(Routes.REGISTER_ENS_NAVIGATOR);
  }, [navigate]);

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="send-fab"
    >
      <FabIcon color={colors.whiteLabel}>ENS</FabIcon>
    </FloatingActionButton>
  );
};

export default magicMemo(RegisterEnsFab, ['disabled', 'isReadOnlyWallet']);
