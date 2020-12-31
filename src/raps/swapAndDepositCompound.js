import { concat, reduce } from 'lodash';
import { estimateSwapGasLimit } from '../handlers/uniswap';
import { add } from '../helpers/utilities';
import { rapsAddOrUpdate } from '../redux/raps';
import store from '../redux/store';
import { ethUnits, savingsAssetsListByUnderlying } from '../references';
import { UNISWAP_V2_ROUTER_ADDRESS } from '../references/uniswap';
import { contractUtils } from '../utils';

import { getDepositGasLimit } from './actions/depositCompound';
import { isValidSwapInput } from './actions/swap';
import { assetNeedsUnlocking } from './actions/unlock';
import { createNewAction, createNewRap, RapActionTypes } from './common';
import logger from 'logger';

export const estimateSwapAndDepositCompound = async ({
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  tradeDetails,
}) => {
  const { accountAddress, chainId, network } = store.getState().settings;
  const requiresSwap = !!outputCurrency;
  let gasLimits = [];
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
      tradeDetails,
    });
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

const createSwapAndDepositCompoundRap = async ({
  callback,
  inputAmount,
  inputCurrency,
  outputAmount,
  outputCurrency,
  selectedGasPrice,
  tradeDetails,
}) => {
  const { accountAddress, network } = store.getState().settings;
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

export default createSwapAndDepositCompoundRap;
