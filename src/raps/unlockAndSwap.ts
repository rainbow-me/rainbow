import {
  ALLOWS_PERMIT,
  ChainId,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATOR,
  PermitSupportedTokenList,
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
  WRAPPED_ASSET,
} from '@rainbow-me/swaps';
import { assetNeedsUnlocking, estimateApprove } from './actions';
import {
  createNewAction,
  createNewRap,
  RapAction,
  RapActionTypes,
  SwapActionParameters,
} from './common';
import { isNativeAsset } from '@/handlers/assets';
import store from '@/redux/store';
import { ETH_ADDRESS } from '@/references';
import { add } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { estimateSwapGasLimit } from '@/handlers/swap';

export const estimateUnlockAndSwap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, tradeDetails, chainId } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount) {
    return ethereumUtils.getBasicSwapGasLimit(Number(chainId));
  }
  const { accountAddress } = store.getState().settings;

  const isNativeAssetUnwrapping =
    inputCurrency?.address?.toLowerCase() ===
      WRAPPED_ASSET?.[Number(chainId)]?.toLowerCase() &&
    (outputCurrency?.address?.toLowerCase() === ETH_ADDRESS.toLowerCase() ||
      outputCurrency?.address?.toLowerCase() ===
        ETH_ADDRESS_AGGREGATOR.toLowerCase());

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;
  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset =
    ETH_ADDRESS_AGGREGATOR.toLowerCase() ===
      inputCurrency.address?.toLowerCase() ||
    isNativeAsset(
      inputCurrency.address,
      ethereumUtils.getNetworkFromChainId(Number(chainId))
    );

  if (!isNativeAssetUnwrapping && !nativeAsset) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
  }

  let unlockGasLimit;
  let swapGasLimit;

  if (swapAssetNeedsUnlocking) {
    unlockGasLimit = await estimateApprove(
      accountAddress,
      inputCurrency.address,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  swapGasLimit = await estimateSwapGasLimit({
    chainId: Number(chainId),
    requiresApprove: swapAssetNeedsUnlocking,
    tradeDetails,
  });

  gasLimits = gasLimits.concat(swapGasLimit);

  return gasLimits.reduce((acc, limit) => add(acc, limit), '0');
};

export const createUnlockAndSwapRap = async (
  swapParameters: SwapActionParameters
) => {
  let actions: RapAction[] = [];

  const { inputAmount, tradeDetails, flashbots, chainId } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { accountAddress } = store.getState().settings;
  const isNativeAssetUnwrapping =
    inputCurrency.address?.toLowerCase() ===
      WRAPPED_ASSET[`${chainId}`]?.toLowerCase() &&
    outputCurrency.address?.toLowerCase() === ETH_ADDRESS?.toLowerCase() &&
    chainId === ChainId.mainnet;

  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset =
    ETH_ADDRESS_AGGREGATOR.toLowerCase() ===
      inputCurrency?.address?.toLowerCase() ||
    isNativeAsset(
      inputCurrency?.address,
      ethereumUtils.getNetworkFromChainId(Number(chainId))
    );

  let swapAssetNeedsUnlocking = false;

  if (!isNativeAssetUnwrapping && !nativeAsset) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      RAINBOW_ROUTER_CONTRACT_ADDRESS,
      chainId
    );
  }
  const allowsPermit =
    !nativeAsset &&
    chainId === ChainId.mainnet &&
    ALLOWS_PERMIT[
      inputCurrency.address?.toLowerCase() as keyof PermitSupportedTokenList
    ];

  if (swapAssetNeedsUnlocking && !allowsPermit) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      chainId,
      contractAddress: RAINBOW_ROUTER_CONTRACT_ADDRESS,
    });
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction(RapActionTypes.swap, {
    chainId,
    flashbots,
    inputAmount,
    permit: swapAssetNeedsUnlocking && allowsPermit,
    requiresApprove: swapAssetNeedsUnlocking && !allowsPermit,
    tradeDetails,
    meta: swapParameters.meta,
  });
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
