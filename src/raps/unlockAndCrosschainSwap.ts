import {
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATOR,
  SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
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
import { add } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { estimateSwapGasLimit } from '@/handlers/swap';

export const estimateUnlockAndCrosschainSwap = async (
  swapParameters: SwapActionParameters
) => {
  const { inputAmount, tradeDetails, chainId } = swapParameters;
  const { inputCurrency, outputCurrency } = store.getState().swap;

  if (!inputCurrency || !outputCurrency || !inputAmount) {
    return ethereumUtils.getBasicSwapGasLimit(Number(chainId));
  }
  const { accountAddress } = store.getState().settings;

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

  if (!nativeAsset) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
      chainId
    );
  }

  let unlockGasLimit;
  let swapGasLimit;

  if (swapAssetNeedsUnlocking) {
    unlockGasLimit = await estimateApprove(
      accountAddress,
      inputCurrency.address,
      SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
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

export const createUnlockAndCrosschainSwapRap = async (
  swapParameters: SwapActionParameters
) => {
  let actions: RapAction[] = [];

  const { inputAmount, tradeDetails, flashbots, chainId } = swapParameters;
  const { inputCurrency } = store.getState().swap;
  const { accountAddress } = store.getState().settings;

  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset =
    ETH_ADDRESS_AGGREGATOR.toLowerCase() ===
      inputCurrency?.address?.toLowerCase() ||
    isNativeAsset(
      inputCurrency?.address,
      ethereumUtils.getNetworkFromChainId(Number(chainId))
    );

  let swapAssetNeedsUnlocking = false;
  if (!nativeAsset) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking(
      accountAddress,
      inputAmount,
      inputCurrency,
      SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
      chainId
    );
  }

  if (swapAssetNeedsUnlocking) {
    const unlock = createNewAction(RapActionTypes.unlock, {
      amount: inputAmount,
      assetToUnlock: inputCurrency,
      chainId,
      contractAddress: SOCKET_REGISTRY_CONTRACT_ADDRESSESS,
    });
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const crosschainSwap = createNewAction(RapActionTypes.crosschainSwap, {
    chainId,
    flashbots,
    inputAmount,
    permit: swapAssetNeedsUnlocking,
    requiresApprove: swapAssetNeedsUnlocking,
    tradeDetails,
  });
  actions = actions.concat(crosschainSwap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
