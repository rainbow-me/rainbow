import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@/helpers';
import { ExchangeNavigatorFactory, useStatusBarManaging } from '@/navigation';

const DepositModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();

  return (
    <ExchangeModal
      testID="deposit-modal"
      type={ExchangeModalTypes.deposit}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(DepositModal);
