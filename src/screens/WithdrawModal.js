import React from 'react';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import { DAI_ADDRESS } from '../references';
import ExchangeModalWithData from './ExchangeModalWithData';

const WithdrawModal = ({ ...props }) => (
  <ExchangeModalWithData
    createRap={createSwapAndDepositCompoundRap}
    defaultInputAddress={DAI_ADDRESS}
    inputHeaderTitle="Withdraw"
    isDeposit
    showOutputField={false}
    {...props}
  />
);

export default WithdrawModal;
