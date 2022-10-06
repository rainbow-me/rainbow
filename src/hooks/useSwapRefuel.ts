import { ParsedAddressAsset, SwappableAsset } from '@/entities';
import { ethereumUtils } from '@/utils';
import useMinRefuelAmount from './useMinRefuelAmount';
import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import { add, isZero, lessThan, subtract } from '@/helpers/utilities';
import { useEffect, useMemo, useState } from 'react';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
import { useAccountSettings, useGas } from '.';
import { isNativeAsset } from '@/handlers/assets';
import { NetworkTypes } from '@/helpers';

// TODO
// - Find out if the swap is going into a native token on the destination chain, in which case we can likely ignore all reswap functionality
// - Get minimum refuel amount, this is how much must be used by the refuel swap
// - Check if they have enough of the source native asset once you deduct input amount (if native asset) + gas amount, if the value is < minRefuelAmount we should show the explainer that gives them no options
// - If they have >= minRefuelAmount then we should check to see if they swapping native asset and if they will have the minRefuel amount left over after the swap then we offer them the option to add the amount on
// - If they wont have enough after the swap of the source native asset then we should offer to deduct some of the input amount into the refuel amount

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

  const [
    outputNativeAsset,
    setOutputNativeAsset,
  ] = useState<ParsedAddressAsset>();
  const [
    inputNativeAsset,
    setInputNativeAsset,
  ] = useState<ParsedAddressAsset>();

  const {
    inputNetwork,
    outputNetwork,
    chainId,
    toChainId,
    isCrosschainSwap,
  } = useMemo(() => {
    const inputNetwork = ethereumUtils.getNetworkFromType(inputCurrency?.type);
    const outputNetwork = ethereumUtils.getNetworkFromType(
      outputCurrency?.type
    );
    const chainId =
      inputCurrency?.type || outputCurrency?.type
        ? ethereumUtils.getChainIdFromType(
            inputCurrency?.type ?? outputCurrency?.type
          )
        : 1;

    const toChainId =
      ethereumUtils.getChainIdFromType(outputCurrency?.type) ?? 1;
    const isCrosschainSwap =
      crosschainSwapsEnabled && inputNetwork !== outputNetwork;

    return {
      inputNetwork,
      outputNetwork,
      chainId,
      toChainId,
      isCrosschainSwap,
    };
  }, [crosschainSwapsEnabled, inputCurrency?.type, outputCurrency?.type]);

  const { data: minRefuelAmount } = useMinRefuelAmount(
    {
      chainId,
      toChainId,
    },
    { enabled: isCrosschainSwap }
  );

  useEffect(() => {
    const getNativeAsset = async () => {
      if (!outputNetwork || !inputNetwork || !accountAddress) return;
      const outputNativeAsset = await ethereumUtils.getNativeAssetForNetwork(
        outputNetwork,
        accountAddress
      );
      const inputNativeAsset = await ethereumUtils.getNativeAssetForNetwork(
        inputNetwork,
        accountAddress
      );
      setOutputNativeAsset(outputNativeAsset);
      setInputNativeAsset(inputNativeAsset);
    };
    getNativeAsset();
  }, [outputNetwork, inputNetwork, accountAddress]);

  const showRefuelSheet = useMemo(() => {
    const swappingToNativeAsset = isNativeAsset(
      outputCurrency?.address,
      outputNetwork
    );
    // - Find out if the swap is going into a native token on the destination chain, in which case we can likely ignore all reswap functionality
    if (swappingToNativeAsset) {
      return false;
    }
    if (!isCrosschainSwap) {
      return false;
    }
    if (outputNetwork === NetworkTypes.mainnet) return false;
    const hasZeroOutputNativeAssetBalance = isZero(
      outputNativeAsset?.balance?.amount || 0
    );
    if (!hasZeroOutputNativeAssetBalance) return false;

    // - Get minimum refuel amount, this is how much must be used by the refuel swap
    const refuelAmount = minRefuelAmount || 0;
    // - Check if they have enough of the source native asset once you deduct input amount (if native asset) + gas amount, if the value is < minRefuelAmount we should show the explainer that gives them no options
    const gasFee = selectedGasFee?.gasFee?.estimatedFee?.value?.amount || '0';
    // - If they have >= minRefuelAmount then we should check to see if they swapping native asset and if they will have the minRefuel amount left over after the swap then we offer them the option to add the amount on
    const inputNativeAssetAmount = inputNativeAsset?.balance?.amount || '0';

    const swappingFromNativeAsset = isNativeAsset(
      inputCurrency?.address,
      inputNetwork
    );
    const gasFeesPlusRefuelAmount = add(gasFee, refuelAmount?.toString());
    // - If they wont have enough after the swap of the source native asset then we should offer to deduct some of the input amount into the refuel amount

    if (swappingFromNativeAsset) {
      const nativeAmountAfterSwap = subtract(
        inputNativeAssetAmount,
        tradeDetails?.sellAmount?.toString() || '0'
      );
      const enoughNativeAssetAfterSwapAndRefuel = lessThan(
        gasFeesPlusRefuelAmount,
        nativeAmountAfterSwap
      );
      // if enoughNativeAssetAfterSwapAndRefuel user can refuel without any issue
      if (enoughNativeAssetAfterSwapAndRefuel)
        return enoughNativeAssetAfterSwapAndRefuel;
      // if user max'ed out

      // new input is sellAmount - minRefuelAmount if sellAmount > minRefuelAmount
      // const newSellAmountAfterRefuel = subtract(tradeDetails?.sellAmount?.toString() || '0', minRefuelAmount)
      // if user press adjust and add 3 go back to exchange modal and update the input token amount
      // updateSwapInputAmount(fromWei(newSellAmountAfterRefuel))
      return enoughNativeAssetAfterSwapAndRefuel;
    }
    return lessThan(gasFeesPlusRefuelAmount, inputNativeAssetAmount);
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
    inputNativeAsset,
    outputNativeAsset,
  };
}
