import {readableUniswapSelector} from "@rainbow-me/helpers/uniswapLiquidityTokenInfoSelector";
import {useOpenSavings} from "@rainbow-me/hooks";
import {add, multiply} from "@rainbow-me/utilities";
import React, { useMemo } from 'react';
import {assets} from "../../../../react-native.config";
import useSavingsAccount from "../../../hooks/useSavingsAccount";
import {UniswapInvestmentRow} from "../../investment-cards";
import { useSelector } from 'react-redux';



import SavingsListRow from "../../savings/SavingsListRow";

export default function WrappedPoolRow({ address }) {
  const { savings } = useSavingsAccount(
    true
  );

  const {uniswap} = useSelector(readableUniswapSelector);
  const found = uniswap.find(({ address: uniswapAddress }) => uniswapAddress === address)


  return (
    <UniswapInvestmentRow assetType="uniswap" item={found} />
  )
}
