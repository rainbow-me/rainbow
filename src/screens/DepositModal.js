import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import useStatusBarManaging from '../navigation/useStatusBarManaging';
import createSwapAndDepositCompoundRap, {
  estimateSwapAndDepositCompound,
} from '../raps/swapAndDepositCompound';
import ExchangeModal from './ExchangeModal';

const DepositModal = ({ navigation, ...props }) => {
  useStatusBarManaging();
  const { params } = useRoute();
  const defaultInputAsset = params?.defaultInputAsset;
  const underlyingPrice = params?.underlyingPrice;
  return (
    <ExchangeModal
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAsset={defaultInputAsset}
      estimateRap={estimateSwapAndDepositCompound}
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
