import React, { useCallback } from 'react';
import { CoinRow } from '../CoinRow';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { ParsedSearchAsset } from '../../types/assets';
import { useSwapAssetStore } from '../../state/assets';
import { Stack } from '@/design-system';
import { useSwapContext } from '../../providers/swap-provider';

export const TokenToSellList = () => {
  const { setAssetToSell } = useSwapAssetStore();
  const { SwapInputController } = useSwapContext();
  const assets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      setAssetToSell(token);
      SwapInputController.formattedInputAmount;
      // TODO: Close the input dropdown and open the output token dropdown
    },
    [setAssetToSell]
  );

  return (
    <Stack space="20px">
      {assets.map((token: ParsedSearchAsset) => (
        <CoinRow
          key={token.uniqueId}
          address={token.address}
          balance={token.balance.display}
          name={token.name}
          onPress={() => handleSelectToken(token)}
          nativeBalance={token.native.balance.display}
          output={false}
          symbol={token.symbol}
        />
      ))}
    </Stack>
  );
};
