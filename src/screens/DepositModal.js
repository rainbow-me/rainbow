import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createSwapAndDepositCompoundRap, {
  estimateSwapAndDepositCompound,
} from '../raps/swapAndDepositCompound';
import ExchangeModal from './ExchangeModal';

const DepositModal = ({ navigation, ...props }) => {
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  const underlyingPrice = navigation.getParam('underlyingPrice');
  return (
    <ExchangeModal
      createRap={createSwapAndDepositCompoundRap}
      estimateRap={estimateSwapAndDepositCompound}
      defaultInputAsset={defaultInputAsset}
      inputHeaderTitle="Deposit"
      navigation={navigation}
      showOutputField={false}
      type={ExchangeModalTypes.deposit}
      underlyingPrice={underlyingPrice}
      {...props}
    />
  );
};

export default DepositModal;
