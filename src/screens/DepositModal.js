import React from 'react';
import ExchangeModalWithData from './ExchangeModalWithData';
import { DAI_ADDRESS } from '../references';

const DepositModal = ({ ...props }) => (
  <ExchangeModalWithData
    inputHeaderTitle="Deposit"
    defaultInputAddress={DAI_ADDRESS}
    showOutputField={false}
    {...props}
  />
);

export default DepositModal;
