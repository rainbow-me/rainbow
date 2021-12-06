import {
  createNewAction,
  createNewRap,
  RapActionTypes,
  SwapActionParameters,
} from './common';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
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
