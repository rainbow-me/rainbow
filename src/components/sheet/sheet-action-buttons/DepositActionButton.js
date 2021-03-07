import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import SheetActionButton from './SheetActionButton';
import { enableActionsOnReadOnlyWallet } from '@rainbow-me/config/debug';
import { useWallets } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { neverRerender } from '@rainbow-me/utils';

function DepositActionButton({ asset, color: givenColor, ...props }) {
  const { isReadOnlyWallet } = useWallets();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const color = givenColor || (isDarkMode ? colors.darkModeDark : colors.dark);

  const onDeposit = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.UNISWAP_DEPOSIT_MODAL, {
        params: {
          params: {
            uniswapPair: asset,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      });

      analytics.track('Navigated to UniswapDepositModal', {
        category: 'uniswapDeposit',
        label: asset?.symbol,
      });
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [asset, isReadOnlyWallet, navigate]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="􀁍 Deposit"
      onPress={onDeposit}
    />
  );
}

export default neverRerender(DepositActionButton);
