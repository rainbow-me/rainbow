import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { NumberPadField } from '@/features/perps/components/NumberPad/NumberPadKey';
import { HYPERCORE_PSEUDO_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS } from '@/features/perps/constants';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { CrosschainQuote, getCrosschainQuote, QuoteError } from '@rainbow-me/swaps';
import { useCallback, useRef, useState } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

export function usePerpsDepositQuote(
  selectedAsset: ExtendedAnimatedAssetWithColors | null,
  fields: SharedValue<Record<string, NumberPadField>>
): [quote: CrosschainQuote | QuoteError | null, fetchQuote: () => void] {
  const accountAddress = userAssetsStoreManager(state => state.address);
  const { nativeCurrency } = useAccountSettings();
  const [quote, setQuote] = useState<CrosschainQuote | QuoteError | null>(null);

  const fetchQuoteId = useRef(0);
  const fetchQuote = useCallback(async () => {
    const amount = Number(fields.value.inputAmount?.value || '0');
    const balance = Number(selectedAsset?.balance?.amount || '0');
    if (amount === 0 || amount > balance || !selectedAsset) return;
    setQuote(null);
    // Make sure we don't use stale quotes.
    fetchQuoteId.current += 1;
    const currentFetchId = fetchQuoteId.current;
    try {
      const quoteResult = await getCrosschainQuote({
        chainId: selectedAsset.chainId,
        toChainId: HYPERCORE_PSEUDO_CHAIN_ID,
        sellTokenAddress: selectedAsset.address,
        buyTokenAddress: HYPERLIQUID_USDC_ADDRESS,
        sellAmount: convertAmountToRawAmount(amount, selectedAsset.decimals),
        fromAddress: accountAddress || '',
        slippage: 1,
        currency: nativeCurrency,
      });
      if (currentFetchId === fetchQuoteId.current) {
        setQuote(quoteResult);
      }
    } catch (error) {
      console.error('Quote fetch error:', error);

      if (currentFetchId === fetchQuoteId.current) {
        setQuote({ error } as QuoteError);
      }
    }
  }, [accountAddress, fields, nativeCurrency, selectedAsset]);

  const fetchQuoteDebounced = useDebouncedCallback(fetchQuote, 200, { leading: true, trailing: true });
  return [quote, fetchQuoteDebounced];
}
