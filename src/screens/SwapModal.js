import React from 'react';
import ExchangeModalWithData from './ExchangeModalWithData';

// TODO JIN
// first update ExchangeModal with the new props
// inputHeaderTitle (Swap or Deposit)
// focus stuff
// pass in the defaultInputAddress
// pass in showOutputField
// pass in the confirmation function
// use accountData
// need to swap or not?

const SwapModal = ({ ...props }) => {
  return (
    <ExchangeModalWithData inputHeaderTitle="Swap" showOutputField {...props} />
  );
};

export default SwapModal;
