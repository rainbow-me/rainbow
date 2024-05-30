import {
  ALLOWS_PERMIT,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATOR,
  PermitSupportedTokenList,
  WRAPPED_ASSET,
  getRainbowRouterContractAddress,
} from '@rainbow-me/swaps';
import { Address } from 'viem';

import { ChainId } from '@/__swaps__/types/chains';
import { isNativeAsset } from '@/handlers/assets';
import { add } from '@/helpers/utilities';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { ETH_ADDRESS } from '../references';

import { isWrapNative } from '@/handlers/swap';
import { assetNeedsUnlocking, estimateApprove, estimateSwapGasLimit } from './actions';
import { estimateUnlockAndSwapFromMetadata } from './actions/swap';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters, RapUnlockActionParameters } from './references';

export const estimateUnlockAndSwap = async ({
  sellAmount,
  quote,
  chainId,
  assetToSell,
}: Pick<RapSwapActionParameters<'swap'>, 'sellAmount' | 'quote' | 'chainId' | 'assetToSell'>) => {
  const {
    from: accountAddress,
    sellTokenAddress,
    buyTokenAddress,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
  };

  const isNativeAssetUnwrapping =
    isLowerCaseMatch(sellTokenAddress, WRAPPED_ASSET?.[chainId]) &&
    (isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS?.[chainId]) || isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS_AGGREGATOR?.[chainId]));

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;

  // TODO: MARK - replace this when we migrate from network => chainId
  const network = ethereumUtils.getNetworkFromChainId(chainId);

  const nativeAsset = isLowerCaseMatch(ETH_ADDRESS_AGGREGATOR, sellTokenAddress) || isNativeAsset(sellTokenAddress, network);

  if (!isNativeAssetUnwrapping && !nativeAsset) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: getRainbowRouterContractAddress(chainId),
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    const gasLimitFromMetadata = await estimateUnlockAndSwapFromMetadata({
      swapAssetNeedsUnlocking,
      chainId,
      accountAddress,
      sellTokenAddress,
      quote,
    });
    if (gasLimitFromMetadata) {
      return gasLimitFromMetadata;
    }
  }

  let unlockGasLimit;

  if (swapAssetNeedsUnlocking) {
    unlockGasLimit = await estimateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: getRainbowRouterContractAddress(chainId),
      chainId,
    });
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  const swapGasLimit = await estimateSwapGasLimit({
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
    quote,
  });

  const gasLimit = gasLimits.concat(swapGasLimit).reduce((acc, limit) => add(acc, limit), '0');

  return gasLimit.toString();
};

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;

  const {
    from: accountAddress,
    sellTokenAddress,
    buyTokenAddress,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
  };

  const isNativeAssetUnwrapping =
    isWrapNative({
      chainId,
      sellTokenAddress,
      buyTokenAddress,
    }) && chainId === ChainId.mainnet;

  // TODO: MARK - replace this when we migrate from network => chainId
  const network = ethereumUtils.getNetworkFromChainId(chainId);

  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset = isLowerCaseMatch(ETH_ADDRESS_AGGREGATOR, sellTokenAddress) || isNativeAsset(sellTokenAddress, network);

  let swapAssetNeedsUnlocking = false;

  if (!isNativeAssetUnwrapping && !nativeAsset) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount as string,
      assetToUnlock: assetToSell,
      spender: getRainbowRouterContractAddress(chainId),
      chainId,
    });
  }

  const allowsPermit =
    !nativeAsset && chainId === ChainId.mainnet && ALLOWS_PERMIT[assetToSell.address?.toLowerCase() as keyof PermitSupportedTokenList];

  if (swapAssetNeedsUnlocking && !allowsPermit) {
    const unlock = createNewAction('unlock', {
      fromAddress: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      chainId,
      contractAddress: getRainbowRouterContractAddress(chainId),
    } as RapUnlockActionParameters);
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction('swap', {
    chainId,
    sellAmount,
    permit: swapAssetNeedsUnlocking && allowsPermit,
    requiresApprove: swapAssetNeedsUnlocking && !allowsPermit,
    quote,
    meta: swapParameters.meta,
    assetToSell,
    assetToBuy,
    gasParams: swapParameters.gasParams,
    gasFeeParamsBySpeed: swapParameters.gasFeeParamsBySpeed,
  } satisfies RapSwapActionParameters<'swap'>);
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
