import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';

// @ts-expect-error ts-migrate(6142) FIXME: Module './SheetActionButton' was resolved to '/Use... Remove this comment to see the full error message
import SheetActionButton from './SheetActionButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/support' o... Remove this comment to see the full error message
import showWalletErrorAlert from '@rainbow-me/helpers/support';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useExpandedStateNavigation, useWallets } from '@rainbow-me/hooks';

// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

// @ts-expect-error ts-migrate(7031) FIXME: Binding element 'givenColor' implicitly has an 'an... Remove this comment to see the full error message
export default function BuyActionButton({ color: givenColor, ...props }) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const color = givenColor || colors.paleBlue;
  const navigate = useExpandedStateNavigation();
  const { isDamaged } = useWallets();

  const handlePress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    if (ios) {
      navigate(Routes.ADD_CASH_FLOW, (params: any) => params);
    } else {
      navigate(Routes.WYRE_WEBVIEW, (params: any) => params);
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
      source: 'expanded state',
    });
  }, [navigate, isDamaged]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SheetActionButton
      {...props}
      color={color}
      label="􀍰 Buy more ETH"
      onPress={handlePress}
      weight="bold"
    />
  );
}
