import { ParsedAddressAsset, SwappableAsset } from '@/entities';
import { ethereumUtils } from '@/utils';
import useMinRefuelAmount from './useMinRefuelAmount';
import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import { add, greaterThan, isZero, lessThan, multiply, subtract } from '@/helpers/utilities';
import { useEffect, useMemo, useState } from 'react';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { useAccountSettings, useGas } from '.';
import { isNativeAsset } from '@/handlers/assets';
import { NetworkTypes } from '@/helpers';
import { toWei } from '@/handlers/web3';

export enum RefuelState {
  'Add' = 'Add',
  'Deduct' = 'Deduct',
  'Notice' = 'Notice',
}

export default function useSwapRefuel({
  inputCurrency,
  outputCurrency,
  tradeDetails,
}: {
  inputCurrency: SwappableAsset;
  outputCurrency: SwappableAsset;
  tradeDetails: Quote | CrosschainQuote | null;
}) {
  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);
  const { accountAddress } = useAccountSettings();
  const { selectedGasFee } = useGas();

  const [outputNativeAsset, setOutputNativeAsset] = useState<ParsedAddressAsset>();
  const [inputNativeAsset, setInputNativeAsset] = useState<ParsedAddressAsset>();

  const { inputNetwork, outputNetwork, chainId, toChainId, isCrosschainSwap } = useMemo(() => {
    const inputNetwork = inputCurrency.network;
    const outputNetwork = outputCurrency.network;
    const chainId = ethereumUtils.getChainIdFromNetwork(inputNetwork);

    const toChainId = ethereumUtils.getChainIdFromNetwork(outputNetwork);
    const isCrosschainSwap = crosschainSwapsEnabled && inputNetwork !== outputNetwork;

    return {
      inputNetwork,
      outputNetwork,
      chainId,
      toChainId,
      isCrosschainSwap,
    };
  }, [crosschainSwapsEnabled, inputCurrency.network, outputCurrency.network]);

  const { data: minRefuelAmount } = useMinRefuelAmount(
    {
      chainId,
      toChainId,
    },
    { enabled: isCrosschainSwap }
  );

  useEffect(() => {
    const getNativeInputOutputAssets = async () => {
      if (!outputNetwork || !inputNetwork || !accountAddress) return;
      const outputNativeAsset = await ethereumUtils.getNativeAssetForNetwork(outputNetwork, accountAddress);
      const inputNativeAsset = await ethereumUtils.getNativeAssetForNetwork(inputNetwork, accountAddress);
      setOutputNativeAsset(outputNativeAsset);
      setInputNativeAsset(inputNativeAsset);
    };
    getNativeInputOutputAssets();
  }, [outputNetwork, inputNetwork, accountAddress]);

  const { showRefuelSheet, refuelState } = useMemo(() => {
    const swappingToNativeAsset = isNativeAsset(outputCurrency?.address, outputNetwork);
    // // If the swap is going into a native token on the destination chain, in which case we can ignore all refuel functionality
    if (swappingToNativeAsset) {
      return { showRefuelSheet: false, refuelState: null };
    }
    // If its not a crosschain swap then ignore
    if (!isCrosschainSwap) {
      return { showRefuelSheet: false, refuelState: null };
    }
    // If we are swapping to mainnet then ignore
    if (outputNetwork === NetworkTypes.mainnet) return { showRefuelSheet: false, refuelState: null };

    // Does the user have an existing balance on the output native asset
    const hasZeroOutputNativeAssetBalance = isZero(outputNativeAsset?.balance?.amount || 0);
    // If its not 0 then ignore
    if (!hasZeroOutputNativeAssetBalance) return { showRefuelSheet: false, refuelState: null };

    // Get minimum refuel amount, this is how much must be used by the refuel swap
    const refuelAmount = minRefuelAmount || '0';
    // Check if they have enough of the source native asset once you deduct input amount (if native asset) + gas amount, if the value is < minRefuelAmount we should show the explainer that gives them no options
    // Get the gas fee for the swap
    const gasFee = multiply(selectedGasFee?.gasFee?.estimatedFee?.value?.amount || '0', 1.5).toString();
    // - If they have >= minRefuelAmount then we should check to see if they swapping native asset and if they will have the minRefuel amount left over after the swap then we offer them the option to add the amount on
    // Check the existing source native asset balance
    const inputNativeAssetAmount = toWei(inputNativeAsset?.balance?.amount || '0');
    // Check if swapping from native asset
    const swappingFromNativeAsset = isNativeAsset(inputCurrency?.address, inputNetwork);

    const gasFeesPlusRefuelAmount = add(gasFee, refuelAmount.toString());
    // - If they wont have enough after the swap of the source native asset then we should offer to deduct some of the input amount into the refuel amount
    // If swapping from the native asset we should take that amount into account
    if (swappingFromNativeAsset) {
      const nativeAmountAfterSwap = subtract(inputNativeAssetAmount, tradeDetails?.sellAmount?.toString() || '0');
      const nativeAmountAfterSwapStillLeft = greaterThan(nativeAmountAfterSwap, 0);
      const enoughNativeAssetAfterSwapAndRefuel = lessThan(gasFeesPlusRefuelAmount, nativeAmountAfterSwap);
      // if enoughNativeAssetAfterSwapAndRefuel user can refuel without any issue
      if (enoughNativeAssetAfterSwapAndRefuel) return { showRefuelSheet: true, refuelState: RefuelState.Add };
      // if user max'ed out
      // Show deduct refuel amount modal if enough balance to refuel
      if (!enoughNativeAssetAfterSwapAndRefuel && nativeAmountAfterSwapStillLeft)
        return { showRefuelSheet: true, refuelState: RefuelState.Deduct };
      // Show notice refuel amount modal if not enough balance to refuel
      return { showRefuelSheet: true, refuelState: RefuelState.Notice };
    }
    // If the total gas and refuel amount is less than native asset amount balance then show normal refuel screen
    // If total gas and refuel is more than the native asset amount the  show the continue anyway and dont allow for refuel
    const enoughNativeAssetAfterSwapAndRefuel = lessThan(gasFeesPlusRefuelAmount, inputNativeAssetAmount);

    if (enoughNativeAssetAfterSwapAndRefuel) {
      return { showRefuelSheet: true, refuelState: RefuelState.Add };
    }

    return { showRefuelSheet: true, refuelState: RefuelState.Notice };
  }, [
    inputCurrency?.address,
    inputNativeAsset?.balance?.amount,
    inputNetwork,
    isCrosschainSwap,
    minRefuelAmount,
    outputCurrency?.address,
    outputNativeAsset?.balance?.amount,
    outputNetwork,
    selectedGasFee?.gasFee?.estimatedFee?.value?.amount,
    tradeDetails?.sellAmount,
  ]);

  return {
    showRefuelSheet,
    refuelState,
    inputNativeAsset,
    outputNativeAsset,
    minRefuelAmount,
  };
}
