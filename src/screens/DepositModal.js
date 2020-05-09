import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createSwapAndDepositCompoundRap, {
  estimateSwapAndDepositCompound,
} from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const DepositModal = ({ navigation, ...props }) => {
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  const underlyingPrice = navigation.getParam('underlyingPrice');
  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      estimateRap={estimateSwapAndDepositCompound}
      defaultInputAsset={defaultInputAsset}
      inputHeaderTitle="Deposit"
      showOutputField={false}
      type={ExchangeModalTypes.deposit}
      underlyingPrice={underlyingPrice}
      {...props}
    />
  );
};

export default DepositModal;
