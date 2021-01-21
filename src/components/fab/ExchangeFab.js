import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '../../navigation/Navigation';
import { magicMemo } from '../../utils';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';
import { darkMode } from '@rainbow-me/config/debug';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const FabShadow = darkMode
  ? [[0, 10, 30, colors.shadow, 1]]
  : [
      [0, 10, 30, colors.shadow, 0.8],
      [0, 5, 15, colors.swapPurple, 1],
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

  return (
    <FloatingActionButton
      {...props}
      backgroundColor={colors.swapPurple}
      disabled={disabled}
      onPress={handlePress}
      shadows={FabShadow}
      testID="exchange-fab"
    >
      <Icon
        color={colors.whiteLabel}
        height={21}
        marginBottom={2}
        name="swap"
        width={26}
      />
    </FloatingActionButton>
  );
};

export default magicMemo(ExchangeFab, ['disabled', 'isReadOnlyWallet']);
