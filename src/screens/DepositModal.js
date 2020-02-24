import React from 'react';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import { DAI_ADDRESS } from '../references';
import ExchangeModalWithData from './ExchangeModalWithData';

const DepositModal = ({ ...props }) => (
  <ExchangeModalWithData
    inputHeaderTitle="Deposit"
    defaultInputAddress={DAI_ADDRESS}
    createRap={createSwapAndDepositCompoundRap}
    showOutputField={false}
    {...props}
  />
);

export default DepositModal;
