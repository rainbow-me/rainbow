import { Address } from 'viem';
import { add } from '@/helpers/utilities';
import { createNewAction, createNewRap } from './common';
import { CrosschainSwapActionParameters, RapAction, RapParameters } from './references';
import { assetNeedsUnlocking, estimateApprove } from './actions';
import { estimateCrosschainSwapGasLimit } from './actions/crosschainSwapAction';
import { RainbowError } from '@/logger';

export const estimateUnlockAndCrosschainSwap = async ({
  sellAmount,
  quote,
  chainId,
  assetToSell,
}: Pick<CrosschainSwapActionParameters, 'sellAmount' | 'quote' | 'chainId' | 'assetToSell'>) => {
  const {
    from: accountAddress,
    sellTokenAddress,
    allowanceTarget,
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
    allowanceTarget: Address;
    allowanceNeeded: boolean;
  };

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: allowanceTarget,
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await estimateApprove({
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

  if (swapGasLimit === null || swapGasLimit === undefined || isNaN(Number(swapGasLimit))) {
    return null;
  }

  const gasLimit = gasLimits.concat(swapGasLimit).reduce((acc, limit) => add(acc, limit), '0');
  if (isNaN(Number(gasLimit))) {
    return null;
  }

  return gasLimit.toString();
};

export const createUnlockAndCrosschainSwapRap = async (parameters: Extract<RapParameters, { type: 'crosschainSwapRap' }>) => {
  let actions: RapAction<'crosschainSwapAction' | 'unlockAction'>[] = [];
  const { sellAmount, assetToBuy, quote, chainId, assetToSell, meta, gasParams, gasFeeParamsBySpeed } =
    parameters.crosschainSwapActionParameters;

  const {
    from: accountAddress,
    allowanceTarget,
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    buyTokenAddress: Address;
    allowanceTarget: Address;
    allowanceNeeded: boolean;
  };

  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: allowanceTarget,
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    if (!quote.to) throw new RainbowError('[rapsV2/crosschainSwapRap]: quote.to is undefined');

    const unlock = createNewAction(
      'unlockAction',
      {
        fromAddress: accountAddress,
        assetToUnlock: assetToSell,
        chainId,
        contractAddress: quote.to as Address,
        gas: {
          gasFeeParamsBySpeed: parameters.crosschainSwapActionParameters.gasFeeParamsBySpeed,
          gasParams: parameters.crosschainSwapActionParameters.gasParams,
        },
      },
      true
    );
    actions = actions.concat(unlock);
  }

  // create a swap rap
  const swap = createNewAction('crosschainSwapAction', {
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
    quote,
    meta,
    assetToSell,
    sellAmount,
    assetToBuy,
    gasParams,
    gasFeeParamsBySpeed,
  });
  actions = actions.concat(swap);

  // create the overall rap
  const newRap = createNewRap(actions);
  return newRap;
};
