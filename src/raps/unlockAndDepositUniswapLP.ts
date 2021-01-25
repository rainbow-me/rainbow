import { Trade } from '@uniswap/sdk';
import { concat, reduce } from 'lodash';
import { assetNeedsUnlocking, isValidSwapInput } from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
} from './common';
import { Asset, SelectedGasPrice } from '@rainbow-me/entities';
import { estimateSwapGasLimit } from '@rainbow-me/handlers/uniswap';
import { rapsAddOrUpdate } from '@rainbow-me/redux/raps';
import store from '@rainbow-me/redux/store';
import { ethUnits, ZapInAddress } from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';
import { contractUtils } from '@rainbow-me/utils';

export const estimateDepositUniswapLP = async ({
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  tradeDetails,
}: {
  inputAmount: string | null;
  inputCurrency: Asset;
  outputAmount: string | null;
  outputCurrency: Asset;
  tradeDetails: Trade;
}) => {
  if (!inputAmount) inputAmount = '1';
  if (!outputAmount) outputAmount = '1';

  const isValid = isValidSwapInput({
    inputCurrency,
    outputCurrency,
  });

  if (!isValid) return ethUnits.basic_swap;

  const { accountAddress, chainId } = store.getState().settings;

  let gasLimits: (string | number)[] = [];
  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    ZapInAddress
  );
  if (depositAssetNeedsUnlocking) {
    const unlockGasLimit = await contractUtils.estimateApprove(
      accountAddress,
      inputCurrency.address,
      ZapInAddress
    );
    gasLimits = concat(gasLimits, unlockGasLimit, ethUnits.basic_swap);
  } else {
    // TODO JIN - not this
    const { gasLimit: swapGasLimit } = await estimateSwapGasLimit({
      accountAddress,
      chainId,
      inputCurrency,
      outputCurrency,
      tradeDetails,
    });
    gasLimits = concat(gasLimits, swapGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

const createDepositUniswapLPRap = async ({
  callback,
  inputAmount,
  inputCurrency,
  outputCurrency,
  selectedGasPrice,
  tradeDetails,
}: {
  callback: () => void;
  inputAmount: string;
  inputCurrency: Asset;
  outputCurrency: Asset;
  selectedGasPrice: SelectedGasPrice;
  tradeDetails: Trade;
}) => {
  // create unlock rap
  const { accountAddress } = store.getState().settings;

  let actions: RapAction[] = [];

  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    inputAmount,
    inputCurrency,
    ZapInAddress
  );

  if (depositAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      accountAddress,
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: ZapInAddress,
      selectedGasPrice,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  // TODO JIN - create a deposit uniswap rap
  const swap = createNewAction(RapActionTypes.swap, {
    accountAddress,
    inputAmount,
    inputCurrency,
    outputCurrency,
    selectedGasPrice,
    tradeDetails,
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  return newRap;
};

export default createDepositUniswapLPRap;
