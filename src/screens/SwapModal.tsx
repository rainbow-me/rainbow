import { useRoute } from '@react-navigation/native';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeModal' was resolved to '/Users/n... Remove this comment to see the full error message
import ExchangeModal from './ExchangeModal';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { ExchangeModalTypes } from '@rainbow-me/helpers';

const SwapModal = (props: any, ref: any) => {
  const { params = {} } = useRoute();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'inputAsset' does not exist on type '{}'.
  const { inputAsset, outputAsset } = params;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ExchangeModal
      defaultInputAsset={inputAsset}
      defaultOutputAsset={outputAsset}
      ref={ref}
      testID="exchange-modal"
      type={ExchangeModalTypes.swap}
      {...props}
    />
  );
};

export default React.forwardRef(SwapModal);
