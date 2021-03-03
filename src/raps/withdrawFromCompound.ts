import {
  createNewAction,
  createNewRap,
  RapActionTypes,
  SwapActionParameters,
} from './common';
import { ethUnits } from '@rainbow-me/references';

export const estimateWithdrawFromCompound = () => ethUnits.basic_withdrawal;

export const createWithdrawFromCompoundRap = (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount } = swapParameters;

  const withdraw = createNewAction(RapActionTypes.withdrawCompound, {
    inputAmount,
  });
  const actions = [withdraw];

  return createNewRap(actions);
};
