import {useOpenSavings} from "@rainbow-me/hooks";
import {add, multiply} from "@rainbow-me/utilities";
import React, { useMemo } from 'react';
import {assets} from "../../../../react-native.config";
import useSavingsAccount from "../../../hooks/useSavingsAccount";


import SavingsListRow from "../../savings/SavingsListRow";

export default function WrappedSavingsRow({ address }) {
  const { savings } = useSavingsAccount(
    true
  );

  const props = useMemo(() => {
    const found = savings.find(({ cToken: { address: cTokenAddress } }) => (cTokenAddress === address))

    if (!found) {
      return null
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
  }, [address, savings])

  return (
    <SavingsListRow
      {...props}
    />
  )
}
