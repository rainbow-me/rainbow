import { concat, get, reduce, toLower } from 'lodash';
import {
  calculateTradeDetails,
  estimateSwapGasLimit,
} from '../handlers/uniswap';
import { add } from '../helpers/utilities';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { ethUnits, savingsAssetsListByUnderlying } from '../references';
import { contractUtils } from '../utils';

import { getDepositGasLimit } from './actions/depositCompound';
import { isValidSwapInput } from './actions/swap';
import { assetNeedsUnlocking } from './actions/unlock';
import { createNewAction, createNewRap, RapActionTypes } from './common';
import logger from 'logger';

export const estimateSwapAndDepositCompound = async ({
  inputAmount,
  inputCurrency,
  inputReserve,
  outputAmount,
  outputCurrency,
  outputReserve,
}) => {
  const { accountAddress, chainId, network } = store.getState().settings;
  const { pairs, allTokens } = store.getState().uniswap;
  const globalPairs = {
    ...pairs,
    ...allTokens,
  };
  const exchangeAddress = get(
    globalPairs,
    `[${toLower(inputCurrency.address)}].exchangeAddress`
  );
  const requiresSwap = !!outputCurrency;
  let gasLimits = [];
  if (requiresSwap) {
    const isValid = isValidSwapInput({
      inputCurrency,
      inputReserve,
      outputCurrency,
      outputReserve,
    });
    if (!isValid) return ethUnits.basic_deposit;

    const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      exchangeAddress
    );
    if (swapAssetNeedsUnlocking) {
      const unlockGasLimit = await contractUtils.estimateApprove(
        inputCurrency.address,
        exchangeAddress
      );
      gasLimits = concat(gasLimits, unlockGasLimit);
    }

    const tradeDetails = calculateTradeDetails(
      chainId,
      inputAmount,
      inputCurrency,
      inputReserve,
      outputAmount,
      outputCurrency,
      outputReserve,
      true
    );
    const swapGasLimit = await estimateSwapGasLimit(
      accountAddress,
      tradeDetails
    );
    gasLimits = concat(gasLimits, swapGasLimit);
    logger.log('[swap and deposit] making swap func');
  }
  const tokenToDeposit = requiresSwap ? outputCurrency : inputCurrency;
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
      tokenToDeposit.address,
      cTokenContract
    );
    gasLimits = concat(gasLimits, depositGasLimit);
  }

  const depositGasLimit = getDepositGasLimit(inputCurrency);
  gasLimits = concat(gasLimits, depositGasLimit);
  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

const createSwapAndDepositCompoundRap = async ({
  callback,
  inputAmount,
  inputCurrency,
  inputReserve,
  outputAmount,
  outputCurrency,
  outputReserve,
  selectedGasPrice,
}) => {
  const { accountAddress, chainId, network } = store.getState().settings;
  const { pairs, allTokens } = store.getState().uniswap;
  const globalPairs = {
    ...pairs,
    ...allTokens,
  };
  const exchangeAddress = get(
    globalPairs,
    `[${toLower(inputCurrency.address)}].exchangeAddress`
  );
  const requiresSwap = !!outputCurrency;
  logger.log('[swap and deposit] currencies', inputCurrency, outputCurrency);
  logger.log('[swap and deposit] amounts', inputAmount, outputAmount);
  let actions = [];
  if (requiresSwap) {
    logger.log(
      '[swap and deposit] inputCurr is not the same as the output currency'
    );
    const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      exchangeAddress
    );
    if (swapAssetNeedsUnlocking) {
      // create unlock for swap rap
      const unlock = createNewAction(RapActionTypes.unlock, {
        accountAddress,
        amount: inputAmount,
        assetToUnlock: inputCurrency,
        contractAddress: exchangeAddress,
      });
      actions = concat(actions, unlock);
      logger.log('[swap and deposit] making unlock for swap func');
    }

    // create a swap rap
    const swap = createNewAction(RapActionTypes.swap, {
      accountAddress,
      chainId,
      inputAmount,
      inputAsExactAmount: true,
      inputCurrency,
      inputReserve,
      outputAmount,
      outputCurrency,
      outputReserve,
      selectedGasPrice,
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
    requiresSwap ? outputAmount : inputAmount,
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

export default createSwapAndDepositCompoundRap;
