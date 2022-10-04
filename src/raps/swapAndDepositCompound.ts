import { RAINBOW_ROUTER_CONTRACT_ADDRESS } from '@rainbow-me/swaps';
import {
  assetNeedsUnlocking,
  estimateApprove,
  getDepositGasLimit,
} from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  SwapActionParameters,
} from './common';
import { Asset } from '@/entities';
import store from '@/redux/store';
import { ethUnits, savingsAssetsListByUnderlying } from '@/references';
import { add } from '@/helpers/utilities';
import logger from '@/utils/logger';
import { estimateSwapGasLimit } from '@/handlers/swap';

export const estimateSwapAndDepositCompound = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, outputAmount, tradeDetails } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { accountAddress, chainId, network } = store.getState().settings;
  const requiresSwap = !!outputCurrency;
  let gasLimits: (string | number)[] = [];
  if (requiresSwap) {
    if (!inputCurrency) return ethUnits.basic_deposit;

    const swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
    if (swapAssetNeedsUnlocking) {
      const unlockGasLimit = await estimateApprove(
        accountAddress,
        inputCurrency.address,
        RAINBOW_ROUTER_CONTRACT_ADDRESS
      );
      gasLimits = gasLimits.concat(unlockGasLimit);
    }

    const swapGasLimit = await estimateSwapGasLimit({
      chainId,
      requiresApprove: swapAssetNeedsUnlocking,
      tradeDetails,
    });
    gasLimits = gasLimits.concat(swapGasLimit);
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
    cTokenContract,
    chainId
  );

  if (depositAssetNeedsUnlocking) {
    const depositGasLimit = await estimateApprove(
      accountAddress,
      tokenToDeposit.address,
      cTokenContract
    );
    gasLimits = gasLimits.concat(depositGasLimit);
  }

  const depositGasLimit = getDepositGasLimit(inputCurrency);
  gasLimits = gasLimits.concat(depositGasLimit);
  return gasLimits.reduce((acc, limit) => add(acc, limit), '0');
};

export const createSwapAndDepositCompoundRap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, outputAmount, tradeDetails } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { accountAddress, network, chainId } = store.getState().settings;
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
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
    if (swapAssetNeedsUnlocking) {
      // create unlock for swap rap
      const unlock = createNewAction(RapActionTypes.unlock, {
        amount: inputAmount,
        assetToUnlock: inputCurrency,
        contractAddress: RAINBOW_ROUTER_CONTRACT_ADDRESS,
      });
      actions = actions.concat(unlock);
      logger.log('[swap and deposit] making unlock for swap func');
    }

    // create a swap rap
    const swap = createNewAction(RapActionTypes.swap, {
      inputAmount,
      tradeDetails,
    });
    actions = actions.concat(swap);
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
    cTokenContract,
    chainId
  );
  if (depositAssetNeedsUnlocking) {
    logger.log('[swap and deposit] making unlock token func');
    const unlockTokenToDeposit = createNewAction(RapActionTypes.unlock, {
      amount: requiresSwap ? outputAmount : inputAmount,
      assetToUnlock: tokenToDeposit,
      contractAddress: cTokenContract,
    });
    actions = actions.concat(unlockTokenToDeposit);
  }

  // create a deposit rap
  logger.log('[swap and deposit] making deposit func');
  const deposit = createNewAction(RapActionTypes.depositCompound, {
    inputAmount,
    outputAmount,
  });
  actions = actions.concat(deposit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
