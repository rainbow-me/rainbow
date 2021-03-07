import { concat, reduce } from 'lodash';
import {
  assetNeedsUnlocking,
  estimateApprove,
  estimateDepositUniswap,
} from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  SwapActionParameters,
} from './common';
import store from '@rainbow-me/redux/store';
import { ethUnits, ZapInAddress } from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';

export const estimateUnlockAndDepositUniswap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount } = swapParameters;
  const { inputCurrency } = store.getState().swap;

  if (!inputCurrency || !inputAmount) return ethUnits.basic_deposit_uniswap;

  const {
    accountAddress,
  }: {
    accountAddress: string;
  } = store.getState().settings;

  let gasLimits: (string | number)[] = [];
  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    ZapInAddress
  );
  if (depositAssetNeedsUnlocking) {
    const unlockGasLimit = await estimateApprove(
      accountAddress,
      inputCurrency.address,
      ZapInAddress
    );
    gasLimits = concat(
      gasLimits,
      unlockGasLimit,
      ethUnits.basic_deposit_uniswap
    );
  } else {
    const depositGasLimit = await estimateDepositUniswap(inputAmount);
    gasLimits = concat(gasLimits, depositGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

export const createDepositUniswapRap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount } = swapParameters;
  const { inputCurrency } = store.getState().swap;
  const {
    accountAddress,
  }: {
    accountAddress: string;
  } = store.getState().settings;

  let actions: RapAction[] = [];

  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    ZapInAddress
  );

  if (depositAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: ZapInAddress,
    });
    actions = concat(actions, unlock);
  }

  // create a deposit Uniswap rap
  const depositUniswapParams = {
    inputAmount,
  };

  const depositUniswap = createNewAction(
    RapActionTypes.depositUniswap,
    depositUniswapParams
  );
  actions = concat(actions, depositUniswap);

  // create the overall rap
  return createNewRap(actions);
};
