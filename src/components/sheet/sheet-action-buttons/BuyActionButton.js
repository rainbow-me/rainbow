import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { analytics } from '@/analytics';
import showWalletErrorAlert from '@/helpers/support';
import {
  useAccountSettings,
  useExpandedStateNavigation,
  useWallets,
} from '@/hooks';
import config from '@/model/config';
import { useNavigation } from '@/navigation';

import Routes from '@/navigation/routesNames';

function BuyActionButton({ color: givenColor, ...props }) {
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation();
  const { navigate: appNavigate } = useNavigation();
  const { isDamaged } = useWallets();
  const { accountAddress } = useAccountSettings();

  const handlePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (!config.wyre_enabled) {
      appNavigate(Routes.EXPLAIN_SHEET, { type: 'wyre_degradation' });
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
      label={`􀍰 ${lang.t('button.buy_more_eth')}`}
      onPress={handlePress}
      weight="bold"
    />
  );
}

export default React.memo(BuyActionButton);
