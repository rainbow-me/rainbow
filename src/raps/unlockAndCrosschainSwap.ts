import { ALLOWS_PERMIT, ChainId, ETH_ADDRESS as ETH_ADDRESS_AGGREGATOR, PermitSupportedTokenList, WRAPPED_ASSET } from '@rainbow-me/swaps';
import { Address } from 'viem';

import { isNativeAsset } from '@/handlers/assets';
import { add } from '@/helpers/utilities';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { ETH_ADDRESS } from '../references';

import { assetNeedsUnlocking, estimateApprove } from './actions';
import { estimateCrosschainSwapGasLimit } from './actions/crosschainSwap';
import { createNewAction, createNewRap } from './common';
import { RapAction, RapSwapActionParameters, RapUnlockActionParameters } from './references';

export const estimateUnlockAndCrosschainSwap = async ({
  sellAmount,
  quote,
  chainId,
  assetToSell,
}: Pick<RapSwapActionParameters<'crosschainSwap'>, 'sellAmount' | 'quote' | 'chainId' | 'assetToSell'>) => {
  const {
    from: accountAddress,
    sellTokenAddress,
    buyTokenAddress,
    allowanceTarget,
    no_approval,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
    allowanceTarget: Address;
    no_approval: boolean;
  };

  const isNativeAssetUnwrapping =
    (isLowerCaseMatch(sellTokenAddress, WRAPPED_ASSET?.[chainId]) && isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS)) ||
    isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS_AGGREGATOR);

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;

  // TODO: MARK - Replace this once we migrate network => chainId
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset = isLowerCaseMatch(ETH_ADDRESS_AGGREGATOR, sellTokenAddress) || isNativeAsset(assetToSell.address, network);

  const shouldNotHaveApproval = no_approval !== undefined && no_approval;

  if (!isNativeAssetUnwrapping && !nativeAsset && allowanceTarget && !shouldNotHaveApproval) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: allowanceTarget,
      chainId,
    });
  }

  let unlockGasLimit;

  if (swapAssetNeedsUnlocking) {
    unlockGasLimit = await estimateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: allowanceTarget,
      chainId,
    });
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  const swapGasLimit = await estimateCrosschainSwapGasLimit({
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
    quote,
  });

  const gasLimit = gasLimits.concat(swapGasLimit).reduce((acc, limit) => add(acc, limit), '0');

  return gasLimit.toString();
};

export const createUnlockAndCrosschainSwapRap = async (swapParameters: RapSwapActionParameters<'crosschainSwap'>) => {
  let actions: RapAction<'crosschainSwap' | 'unlock'>[] = [];
  const { sellAmount, assetToBuy, quote, chainId, assetToSell } = swapParameters;

  const {
    from: accountAddress,
    sellTokenAddress,
    buyTokenAddress,
    allowanceTarget,
    no_approval,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
    allowanceTarget: Address;
    no_approval: boolean;
  };

  const isNativeAssetUnwrapping =
    isLowerCaseMatch(sellTokenAddress, WRAPPED_ASSET[`${chainId}`]) &&
    isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS) &&
    chainId === ChainId.mainnet;

  // Aggregators represent native asset as 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
  const nativeAsset = isLowerCaseMatch(ETH_ADDRESS_AGGREGATOR, sellTokenAddress) || assetToSell?.isNativeAsset;

  const shouldNotHaveApproval = no_approval !== undefined && no_approval;

  let swapAssetNeedsUnlocking = false;

  if (!isNativeAssetUnwrapping && !nativeAsset && allowanceTarget && !shouldNotHaveApproval) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: allowanceTarget,
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
      contractAddress: quote.to,
    } as RapUnlockActionParameters);
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction('crosschainSwap', {
    chainId,
    permit: swapAssetNeedsUnlocking && allowsPermit,
    requiresApprove: swapAssetNeedsUnlocking && !allowsPermit,
    quote,
    meta: swapParameters.meta,
    assetToSell,
    sellAmount,
    assetToBuy,
    gasParams: swapParameters.gasParams,
    gasFeeParamsBySpeed: swapParameters.gasFeeParamsBySpeed,
  } satisfies RapSwapActionParameters<'crosschainSwap'>);
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
