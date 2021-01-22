import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import { magicMemo } from '../../utils';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';
import Routes from '@rainbow-me/routes';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const FabShadowDark = [[0, 10, 30, colors_NOT_REACTIVE.shadow, 1]];
const FabShadowLight = [
  [0, 10, 30, colors_NOT_REACTIVE.shadow, 0.8],
  [0, 5, 15, colors_NOT_REACTIVE.swapPurple, 1],
];

const ExchangeFab = ({ disabled, isReadOnlyWallet, ...props }) => {
  const { navigate } = useNavigation();

  const handlePress = useCallback(() => {
    if (!isReadOnlyWallet) {
      navigate(Routes.EXCHANGE_MODAL);
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [navigate, isReadOnlyWallet]);

  const { isDarkMode } = useTheme();

  const FabShadow = isDarkMode ? FabShadowDark : FabShadowLight;

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors_NOT_REACTIVE.swapPurple}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="exchange-fab"
    >
      <Icon
        color={colors_NOT_REACTIVE.whiteLabel}
        height={21}
        marginBottom={2}
        name="swap"
        width={26}
      />
    </FloatingActionButton>
  );
};

export default magicMemo(ExchangeFab, ['disabled', 'isReadOnlyWallet']);
