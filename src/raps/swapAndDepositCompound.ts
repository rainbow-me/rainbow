import { Trade } from '@uniswap/sdk';
import { concat, reduce } from 'lodash';
import {
  assetNeedsUnlocking,
  getDepositGasLimit,
  isValidSwapInput,
} from './actions';
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
import {
  ethUnits,
  savingsAssetsListByUnderlying,
  UNISWAP_V2_ROUTER_ADDRESS,
} from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';
import { contractUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const estimateSwapAndDepositCompound = async ({
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  tradeDetails,
}: {
  inputAmount: string;
  inputCurrency: Asset;
  outputAmount: string | null;
  outputCurrency: Asset;
  tradeDetails: Trade;
}) => {
  const { accountAddress, chainId, network } = store.getState().settings;
  const requiresSwap = !!outputCurrency;
  let gasLimits: (string | number)[] = [];
  if (requiresSwap) {
    const isValid = isValidSwapInput({
      inputCurrency,
      outputCurrency,
    });
    if (!isValid) return ethUnits.basic_deposit;

    const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      UNISWAP_V2_ROUTER_ADDRESS
    );
    if (swapAssetNeedsUnlocking) {
      const unlockGasLimit = await contractUtils.estimateApprove(
        accountAddress,
        inputCurrency.address,
        UNISWAP_V2_ROUTER_ADDRESS
      );
      gasLimits = concat(gasLimits, unlockGasLimit);
    }

    const { gasLimit: swapGasLimit } = await estimateSwapGasLimit({
      accountAddress,
      chainId,
      inputCurrency,
      outputCurrency,
      tradeDetails,
    });
    gasLimits = concat(gasLimits, swapGasLimit);
    logger.log('[swap and deposit] making swap func');
  }
  const tokenToDeposit: Asset = requiresSwap ? outputCurrency : inputCurrency;
  const cTokenContract =
    savingsAssetsListByUnderlying[network][tokenToDeposit.address]
      .contractAddress;
  const amountToDeposit = requiresSwap ? outputAmount : inputAmount;

  if (!amountToDeposit) return ethUnits.basic_deposit;

  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    amountToDeposit,
    tokenToDeposit,
    cTokenContract
  );

  if (depositAssetNeedsUnlocking) {
    const depositGasLimit = await contractUtils.estimateApprove(
      accountAddress,
      tokenToDeposit.address,
      cTokenContract
    );
    gasLimits = concat(gasLimits, depositGasLimit);
  }

  const depositGasLimit = getDepositGasLimit(inputCurrency);
  gasLimits = concat(gasLimits, depositGasLimit);
  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

export const createSwapAndDepositCompoundRap = async ({
  callback,
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  selectedGasPrice,
  tradeDetails,
}: {
  callback: () => void;
  inputAmount: string;
  inputCurrency: Asset;
  outputAmount: string | null;
  outputCurrency: Asset;
  selectedGasPrice: SelectedGasPrice;
  tradeDetails: Trade;
}) => {
  const { accountAddress, network } = store.getState().settings;
  const requiresSwap = !!outputCurrency;
  logger.log('[swap and deposit] currencies', inputCurrency, outputCurrency);
  logger.log('[swap and deposit] amounts', inputAmount, outputAmount);
  let actions: RapAction[] = [];
  if (requiresSwap) {
    logger.log(
      '[swap and deposit] inputCurr is not the same as the output currency'
    );
    const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      UNISWAP_V2_ROUTER_ADDRESS
    );
    if (swapAssetNeedsUnlocking) {
      // create unlock for swap rap
      const unlock = createNewAction(RapActionTypes.unlock, {
        accountAddress,
        amount: inputAmount,
        assetToUnlock: inputCurrency,
        contractAddress: UNISWAP_V2_ROUTER_ADDRESS,
        selectedGasPrice,
      });
      actions = concat(actions, unlock);
      logger.log('[swap and deposit] making unlock for swap func');
    }

    // create a swap rap
    const swap = createNewAction(RapActionTypes.swap, {
      accountAddress,
      inputAmount,
      inputCurrency,
      outputCurrency,
      selectedGasPrice,
      tradeDetails,
    });
    actions = concat(actions, swap);
    logger.log('[swap and deposit] making swap func');
  }

  const tokenToDeposit = requiresSwap ? outputCurrency : inputCurrency;
  const cTokenContract =
    savingsAssetsListByUnderlying[network][tokenToDeposit.address]
      .contractAddress;
  logger.log('ctokencontract', cTokenContract);

  // create unlock token on Compound rap
  const depositAssetNeedsUnlocking = await assetNeedsUnlocking(
    accountAddress,
    requiresSwap ? (outputAmount as string) : inputAmount,
    tokenToDeposit,
    cTokenContract
  );
  if (depositAssetNeedsUnlocking) {
    logger.log('[swap and deposit] making unlock token func');
    const unlockTokenToDeposit = createNewAction(RapActionTypes.unlock, {
      accountAddress,
      amount: requiresSwap ? outputAmount : inputAmount,
      assetToUnlock: tokenToDeposit,
      contractAddress: cTokenContract,
      selectedGasPrice,
    });
    actions = concat(actions, unlockTokenToDeposit);
  }

  // create a deposit rap
  logger.log('[swap and deposit] making deposit func');
  const deposit = createNewAction(RapActionTypes.depositCompound, {
    accountAddress,
    inputAmount: requiresSwap ? outputAmount : inputAmount,
    inputCurrency: tokenToDeposit,
    network,
    selectedGasPrice,
  });
  actions = concat(actions, deposit);

  // create the overall rap
  const newRap = createNewRap(actions, callback);

  // update the rap store
  const { dispatch } = store;
  dispatch(rapsAddOrUpdate(newRap.id, newRap));
  logger.log('[swap and deposit] new rap!', newRap);
  return newRap;
};
