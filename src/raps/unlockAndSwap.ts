import {
  ALLOWS_PERMIT,
  ChainId,
  PermitSupportedTokenList,
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
  WETH,
} from '@rainbow-me/swaps';
import { concat, reduce, toLower } from 'lodash';
import { assetNeedsUnlocking, estimateApprove } from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  SwapActionParameters,
} from './common';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import { estimateSwapGasLimit } from '@rainbow-me/handlers/uniswap';
import store from '@rainbow-me/redux/store';
import { ETH_ADDRESS, ethUnits } from '@rainbow-me/references';
import { add } from '@rainbow-me/utilities';
import { ethereumUtils, logger } from '@rainbow-me/utils';

export const estimateUnlockAndSwap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, tradeDetails, provider } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount)
    return ethUnits.basic_swap;

  const { accountAddress } = store.getState().settings;
  const chainId = (await provider.getNetwork()).chainId;

  const isWethUnwrapping =
    toLower(inputCurrency.address) === toLower(WETH[ChainId.mainnet]) &&
    toLower(outputCurrency.address) === toLower(ETH_ADDRESS);

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;
  if (
    !isWethUnwrapping &&
    !isNativeAsset(
      inputCurrency.address,
      ethereumUtils.getNetworkFromChainId(chainId)
    )
  ) {
    logger.debug('checking if it needs unlocking');
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
  }

  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await estimateApprove(
      accountAddress,
      inputCurrency.address,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
    gasLimits = concat(gasLimits, unlockGasLimit, ethUnits.basic_swap);
  } else {
    logger.debug('about to call estimateSwapGasLimit');
    const swapGasLimit = await estimateSwapGasLimit({
      chainId,
      requiresApprove: swapAssetNeedsUnlocking,
      tradeDetails,
    });

    logger.debug('got swapGasLimit', swapGasLimit);
    gasLimits = concat(gasLimits, swapGasLimit);
  }

  return reduce(gasLimits, (acc, limit) => add(acc, limit), '0');
};

export const createUnlockAndSwapRap = async (
  swapParameters: SwapActionParameters
) => {
  let actions: RapAction[] = [];

  const { inputAmount, tradeDetails, flashbots } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { accountAddress, chainId } = store.getState().settings;
  const isWethUnwrapping =
    toLower(inputCurrency.address) === toLower(WETH[ChainId.mainnet]) &&
    toLower(outputCurrency.address) === toLower(ETH_ADDRESS);

  let swapAssetNeedsUnlocking = false;

  if (!isWethUnwrapping) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
  }
  const allowsPermit =
    ALLOWS_PERMIT[
      toLower(inputCurrency.address) as keyof PermitSupportedTokenList
    ];

  if (swapAssetNeedsUnlocking && !allowsPermit) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      contractAddress: RAINBOW_ROUTER_CONTRACT_ADDRESS,
    });
    actions = concat(actions, unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    flashbots,
    inputAmount,
    permit: swapAssetNeedsUnlocking && allowsPermit,
    tradeDetails,
  });
  actions = concat(actions, swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
