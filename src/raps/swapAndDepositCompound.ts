import { concat, reduce } from 'lodash';
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { Asset } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/uniswap' ... Remove this comment to see the full error message
import { estimateSwapGasLimit } from '@rainbow-me/handlers/uniswap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import store from '@rainbow-me/redux/store';
import {
  ethUnits,
  savingsAssetsListByUnderlying,
  UNISWAP_V2_ROUTER_ADDRESS,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
} from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { add } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export const estimateSwapAndDepositCompound = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, outputAmount, tradeDetails } = swapParameters;
  const {
    inputCurrency,
    outputCurrency,
    slippageInBips: slippage,
  } = store.getState().swap;
  const { accountAddress, chainId, network } = store.getState().settings;
  const requiresSwap = !!outputCurrency;
  let gasLimits: (string | number)[] = [];
  if (requiresSwap) {
    if (!inputCurrency) return ethUnits.basic_deposit;

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
      gasLimits = concat(gasLimits, unlockGasLimit);
    }

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
    const depositGasLimit = await estimateApprove(
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

export const createSwapAndDepositCompoundRap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, outputAmount, tradeDetails } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;
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
        amount: inputAmount,
        assetToUnlock: inputCurrency,
        contractAddress: UNISWAP_V2_ROUTER_ADDRESS,
      });
      actions = concat(actions, unlock);
      logger.log('[swap and deposit] making unlock for swap func');
    }

    // create a swap rap
    const swap = createNewAction(RapActionTypes.swap, {
      inputAmount,
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
      amount: requiresSwap ? outputAmount : inputAmount,
      assetToUnlock: tokenToDeposit,
      contractAddress: cTokenContract,
    });
    actions = concat(actions, unlockTokenToDeposit);
  }

  // create a deposit rap
  logger.log('[swap and deposit] making deposit func');
  const deposit = createNewAction(RapActionTypes.depositCompound, {
    inputAmount,
    outputAmount,
  });
  actions = concat(actions, deposit);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
