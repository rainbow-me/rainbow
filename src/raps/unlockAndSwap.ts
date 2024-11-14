import { getRainbowRouterContractAddress } from '@rainbow-me/swaps';
import { Address } from 'viem';

import { add } from '@/helpers/utilities';

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
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    allowanceNeeded: boolean;
  };

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
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
    const unlockGasLimit = await estimateApprove({
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

  if (swapGasLimit === null || swapGasLimit === undefined || isNaN(Number(swapGasLimit))) {
    return null;
  }

  const gasLimit = gasLimits.concat(swapGasLimit).reduce((acc, limit) => add(acc, limit), '0');
  if (isNaN(Number(gasLimit))) {
    return null;
  }

  return gasLimit.toString();
};

export const createUnlockAndSwapRap = async (swapParameters: RapSwapActionParameters<'swap'>) => {
  let actions: RapAction<'swap' | 'unlock'>[] = [];

  const { sellAmount, quote, chainId, assetToSell, assetToBuy } = swapParameters;

  const { from: accountAddress, allowanceNeeded } = quote as {
    from: Address;
    sellTokenAddress: Address;
    allowanceNeeded: boolean;
  };

  let swapAssetNeedsUnlocking = false;

  if (false) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount as string,
      assetToUnlock: assetToSell,
      spender: getRainbowRouterContractAddress(chainId),
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
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
    permit: false,
    requiresApprove: swapAssetNeedsUnlocking,
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
