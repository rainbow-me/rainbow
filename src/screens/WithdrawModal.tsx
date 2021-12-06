import { useRoute } from '@react-navigation/native';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeModal' was resolved to '/Users/n... Remove this comment to see the full error message
import ExchangeModal from './ExchangeModal';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  ExchangeNavigatorFactory,
  useStatusBarManaging,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
} from '@rainbow-me/navigation';

const WithdrawModal = (props: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  const typeSpecificParams = {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'cTokenBalance' does not exist on type 'o... Remove this comment to see the full error message
    cTokenBalance: params?.cTokenBalance,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'supplyBalanceUnderlying' does not exist ... Remove this comment to see the full error message
    supplyBalanceUnderlying: params?.supplyBalanceUnderlying,
  };

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ExchangeModal
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultInputAsset' does not exist on typ... Remove this comment to see the full error message
      defaultInputAsset={params?.defaultInputAsset}
      type={ExchangeModalTypes.withdrawal}
      typeSpecificParams={typeSpecificParams}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(WithdrawModal);
