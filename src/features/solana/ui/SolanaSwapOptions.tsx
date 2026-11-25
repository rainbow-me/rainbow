import React from 'react';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { Box } from '@/design-system';
import { getUniqueId } from '@/entities/assetId';
import { ChainId } from '@/features/network/types/backendNetworks';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';
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
  const options = SOLANA_SWAP_OUTPUTS.filter(id => {
    if (output) return true;
    const balance = data?.balances.get(
      getUniqueId(id === 'sol' ? 'So11111111111111111111111111111111111111111' : SWAP_ASSETS[id].asset.address, SOLANA_CHAIN_ID)
    );
    return !!balance && !balance.rawUnits;
  });
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
