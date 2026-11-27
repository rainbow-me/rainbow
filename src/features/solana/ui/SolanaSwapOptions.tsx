import React from 'react';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { Box } from '@/design-system';
import { ChainId } from '@/features/network/types/backendNetworks';
import { SWAP_ASSETS } from '@/features/solana/core/swap';
import { selectSolanaSwap } from '@/features/solana/data/swapSelection';
import { SolanaSwapTokenRow } from '@/features/solana/ui/SolanaSwapTokenRow';

import { useSolanaSwapOptions } from './useSolanaSwapOptions';

export function SolanaSwapOptions({ output }: { output: boolean }) {
  const { options } = useSolanaSwapOptions(output);
  const { internalSelectedInputAsset, SwapInputController } = useSwapContext();
  if (!options.length) return null;
  return (
    <Box paddingVertical="10px">
      {options.map(asset => (
        <SolanaSwapTokenRow
          key={asset.id}
          token={asset}
          output={output}
          onPress={() => {
            const input = internalSelectedInputAsset.value;
            const isBaseEth = input?.chainId === ChainId.base && input.isNativeAsset;
            selectSolanaSwap({
              inputAsset: output ? (isBaseEth ? SWAP_ASSETS['base-eth'] : null) : asset,
              outputAsset: output ? asset : asset.asset.kind === 'native' ? SWAP_ASSETS.usdc : SWAP_ASSETS.sol,
              amount: output && isBaseEth ? String(SwapInputController.inputValues.value.inputAmount || '0') : '0',
            });
          }}
        />
      ))}
    </Box>
  );
}
