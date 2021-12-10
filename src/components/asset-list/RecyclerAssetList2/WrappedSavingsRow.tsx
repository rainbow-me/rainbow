import React, { useMemo } from 'react';
import useSavingsAccount from '../../../hooks/useSavingsAccount';

import SavingsListRow from '../../savings/SavingsListRow';
import { multiply } from '@rainbow-me/utilities';

export default function WrappedSavingsRow({ address }: { address: string }) {
  const { savings } = useSavingsAccount(true);

  const props = useMemo(() => {
    const found = savings.find(
      ({ cToken: { address: cTokenAddress } }) => cTokenAddress === address
    );

    if (!found) {
      return null;
    }

    const {
      lifetimeSupplyInterestAccrued,
      underlyingBalanceNativeValue,
      underlyingPrice,
    } = found;
    const lifetimeSupplyInterestAccruedNative = lifetimeSupplyInterestAccrued
      ? multiply(lifetimeSupplyInterestAccrued, underlyingPrice)
      : 0;

    return {
      ...found,
      lifetimeSupplyInterestAccruedNative,
      underlyingBalanceNativeValue,
    };
  }, [address, savings]);

  return <SavingsListRow {...props} />;
}
