import { ETH_ADDRESS as ETH_ADDRESS_AGGREGATOR } from '@rainbow-me/swaps';
import { assetNeedsUnlocking, estimateApprove } from './actions';
import {
  createNewAction,
  createNewRap,
  CrosschainSwapActionParameters,
  RapAction,
  RapActionTypes,
} from './common';
import { isNativeAsset } from '@/handlers/assets';
import store from '@/redux/store';
import { add } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { estimateCrosschainSwapGasLimit } from '@/handlers/swap';

export const estimateUnlockAndCrosschainSwap = async (
  swapParameters: CrosschainSwapActionParameters
) => {
  const { inputAmount, tradeDetails, chainId } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount) {
    return ethereumUtils.getBasicSwapGasLimit(Number(chainId));
  }
  const { accountAddress } = store.getState().settings;

  const routeAllowanceTargetAddress =
    tradeDetails?.routes?.[0]?.userTxs?.[0]?.approvalData?.allowanceTarget;

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

  if (!nativeAsset && routeAllowanceTargetAddress) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      routeAllowanceTargetAddress,
      chainId
    );
    if (swapAssetNeedsUnlocking) {
      const unlockGasLimit = await estimateApprove(
        accountAddress,
        inputCurrency.address,
        routeAllowanceTargetAddress,
        chainId,
        false
      );
      gasLimits = gasLimits.concat(unlockGasLimit);
    }
  }

  const swapGasLimit = await estimateCrosschainSwapGasLimit({
    chainId: Number(chainId),
    requiresApprove: swapAssetNeedsUnlocking,
    tradeDetails,
  });

  gasLimits = gasLimits.concat(swapGasLimit);

  return gasLimits.reduce((acc, limit) => add(acc, limit), '0');
};

export const createUnlockAndCrosschainSwapRap = async (
  swapParameters: CrosschainSwapActionParameters
) => {
  let actions: RapAction[] = [];

  const { inputAmount, tradeDetails, flashbots, chainId } = swapParameters;
  const { inputCurrency } = store.getState().swap;
  const { accountAddress } = store.getState().settings;

  // this will probably need refactor
  const routeAllowanceTargetAddress =
    tradeDetails?.routes?.[0]?.userTxs?.[0]?.approvalData?.allowanceTarget;

  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset =
    ETH_ADDRESS_AGGREGATOR.toLowerCase() ===
      inputCurrency?.address?.toLowerCase() ||
    isNativeAsset(
      inputCurrency?.address,
      ethereumUtils.getNetworkFromChainId(Number(chainId))
    );

  let swapAssetNeedsUnlocking = false;
  if (!nativeAsset && routeAllowanceTargetAddress) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      routeAllowanceTargetAddress,
      chainId
    );
    if (swapAssetNeedsUnlocking) {
      const unlock = createNewAction(RapActionTypes.unlock, {
        amount: inputAmount,
        assetToUnlock: inputCurrency,
        chainId,
        contractAddress: routeAllowanceTargetAddress,
      });
      actions = actions.concat(unlock);
    }
  }

  const crosschainSwap = createNewAction(RapActionTypes.crosschainSwap, {
    chainId,
    flashbots,
    inputAmount,
    requiresApprove: swapAssetNeedsUnlocking,
    tradeDetails,
  });
  actions = actions.concat(crosschainSwap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
