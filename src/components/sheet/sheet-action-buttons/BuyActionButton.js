import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import {
  useAccountSettings,
  useExpandedStateNavigation,
  useWallets,
} from '@rainbow-me/hooks';

import Routes from '@rainbow-me/routes';

function BuyActionButton({ color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation();
  const { isDamaged } = useWallets();
  const { accountAddress } = useAccountSettings();

  const handlePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (ios) {
      navigate(Routes.ADD_CASH_FLOW, params => params);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, () => ({
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      }));
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
      source: 'expanded state',
    });
  }, [accountAddress, isDamaged, navigate]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="􀍰 Buy more ETH"
      onPress={handlePress}
      weight="bold"
    />
  );
}

export default React.memo(BuyActionButton);
