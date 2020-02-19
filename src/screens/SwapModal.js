import React from 'react';
import ExchangeModalWithData from './ExchangeModalWithData';

const SwapModal = ({ ...props }) => (
  <ExchangeModalWithData inputHeaderTitle="Swap" showOutputField {...props} />
);

export default SwapModal;
