import React from 'react';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { Box } from '@/design-system';
import { ChainId } from '@/features/network/types/backendNetworks';
import { SOLANA_SWAP_OUTPUTS, SWAP_ASSETS } from '@/features/solana/core/swap';
import { useSolanaBalancesAddress, useSolanaWalletBalances } from '@/features/solana/data/solanaBalancesStore';
import { selectSolanaSwap } from '@/features/solana/data/swapSelection';
import { SolanaSwapTokenRow } from '@/features/solana/ui/SolanaSwapTokenRow';
import { useUserAssetsStore } from '@/state/assets/userAssets';

export function SolanaSwapOptions({ output }: { output: boolean }) {
  const enabledAddress = useSolanaBalancesAddress();
  const { data } = useSolanaWalletBalances();
  const outputQuery = useSwapsSearchStore(state => state.searchQuery);
  const inputQuery = useUserAssetsStore(state => state.inputSearchQuery);
  const { internalSelectedInputAsset, SwapInputController } = useSwapContext();
  if (!enabledAddress || (output ? outputQuery : inputQuery).trim()) return null;
  const options = SOLANA_SWAP_OUTPUTS.filter(
    id =>
      output ||
      data?.balances.some(
        balance =>
          !balance.rawUnits &&
          balance.assetId.endsWith(
            id === 'sol' ? '/native:So11111111111111111111111111111111111111111' : `/token:${SWAP_ASSETS[id].asset.address}`
          )
      )
  );
  if (!options.length) return null;
  return (
    <Box paddingVertical="10px">
      {options.map(id => (
        <SolanaSwapTokenRow
          key={id}
          assetId={id}
          output={output}
          onPress={() => {
            const input = internalSelectedInputAsset.value;
            const isBaseEth = input?.chainId === ChainId.base && input.isNativeAsset;
            selectSolanaSwap({
              inputAsset: output ? (isBaseEth ? 'base-eth' : null) : id,
              outputAsset: output ? id : id === 'sol' ? 'usdc' : 'sol',
              amount: output && isBaseEth ? String(SwapInputController.inputValues.value.inputAmount || '0') : '0',
            });
          }}
        />
      ))}
    </Box>
  );
}
