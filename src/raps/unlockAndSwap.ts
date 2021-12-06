import { concat, reduce } from 'lodash';
import { assetNeedsUnlocking, estimateApprove } from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  SwapActionParameters,
} from './common';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/uniswap' ... Remove this comment to see the full error message
import { estimateSwapGasLimit } from '@rainbow-me/handlers/uniswap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ethUnits, UNISWAP_V2_ROUTER_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { add } from '@rainbow-me/utilities';

export const estimateUnlockAndSwap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, tradeDetails } = swapParameters;
  const {
    inputCurrency,
    outputCurrency,
    slippageInBips: slippage,
  } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount)
    return ethUnits.basic_swap;

  const { accountAddress, chainId } = store.getState().settings;

  let gasLimits: (string | number)[] = [];
  const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    UNISWAP_V2_ROUTER_ADDRESS
  );
  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await estimateApprove(
      accountAddress,
      inputCurrency.address,
      UNISWAP_V2_ROUTER_ADDRESS
    );
    gasLimits = concat(gasLimits, unlockGasLimit, ethUnits.basic_swap);
  } else {
    const { gasLimit: swapGasLimit } = await estimateSwapGasLimit({
      accountAddress,
      chainId,
      inputCurrency,
      outputCurrency,
      slippage,
      tradeDetails,
    });
    gasLimits = concat(gasLimits, swapGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

export const createUnlockAndSwapRap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, tradeDetails } = swapParameters;
  const { inputCurrency } = store.getState().swap;

  // create unlock rap
  const { accountAddress } = store.getState().settings;

  let actions: RapAction[] = [];

  const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    UNISWAP_V2_ROUTER_ADDRESS
  );

  if (swapAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: UNISWAP_V2_ROUTER_ADDRESS,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    inputAmount,
    tradeDetails,
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
