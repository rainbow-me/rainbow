import React, { useCallback, useMemo } from 'react';
import * as i18n from '@/languages';
import { CoinRow } from '../CoinRow';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { ParsedSearchAsset } from '../../types/assets';
import { useSwapAssetStore } from '../../state/assets';
import { Box, Stack, Text } from '@/design-system';
import { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '../../providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '../../utils/assets';

export const TokenToSellList = () => {
  const { SwapNavigation, SwapInputController } = useSwapContext();
  const { setAssetToSell, assetToBuy, setSearchFilter } = useSwapAssetStore();
  const userAssets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      const userAsset = userAssets.find(asset => isSameAsset(asset, token));
      const parsedAset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      setAssetToSell(parsedAset);

      runOnUI(() => {
        SwapInputController.inputValues.modify(prev => ({
          ...prev,
          inputAmount: userAsset?.balance.amount ?? '0', // TODO: Do we want to default to 100% of balance? 50%?
        }));
      })();

      setSearchFilter('');
      if (!assetToBuy) {
        runOnUI(SwapNavigation.handleFocusOutputSearch)();
      } else {
        runOnUI(SwapNavigation.handleExitSearch)();
      }
    },
    [
      SwapInputController.inputValues,
      SwapNavigation.handleExitSearch,
      SwapNavigation.handleFocusOutputSearch,
      assetToBuy,
      setAssetToSell,
      setSearchFilter,
      userAssets,
    ]
  );

  const assetsCount = useMemo(
    () =>
      userAssets?.reduce((prev, asset) => {
        let count = prev;
        if (asset) {
          count += 1;
        }

        return count;
      }, 0),
    [userAssets]
  );

  return (
    <Stack space="20px">
      {userAssets.map((token: ParsedSearchAsset) => (
        <CoinRow
          key={token.uniqueId}
          chainId={token.chainId}
          color={token.colors?.primary ?? token.colors?.fallback}
          iconUrl={token.icon_url}
          address={token.address}
          mainnetAddress={token.mainnetAddress}
          balance={token.balance.display}
          name={token.name}
          onPress={() => handleSelectToken(token)}
          nativeBalance={token.native.balance.display}
          output={false}
          symbol={token.symbol}
        />
      ))}

      {!assetsCount && (
        <Box alignItems="center" style={{ paddingTop: 121 }}>
          <Box paddingHorizontal="36px">
            <Stack space="16px">
              <Text color="label" size="26pt" weight="bold" align="center">
                {'👻'}
              </Text>

              <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
                {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
              </Text>

              <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
                {i18n.t(i18n.l.swap.tokens_input.nothing_found_description, {
                  action: 'swap',
                })}
              </Text>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>
  );
};
