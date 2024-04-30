import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Stack, Text } from '@/design-system';
import { useSwapAssets } from '@/state/swaps/assets';
import { isL2Chain } from '@/__swaps__/utils/chains';

type ListEmptyProps = {
  output?: boolean;
  action?: 'swap' | 'bridge';
};

export const ListEmpty = ({ output = false, action = 'swap' }: ListEmptyProps) => {
  const assetChainId = useSwapAssets(state => (output ? state.assetToSell?.chainId : state.assetToBuy?.chainId));

  const isL2 = useMemo(() => {
    return assetChainId && isL2Chain(assetChainId);
  }, [assetChainId]);

  return (
    <Box alignItems="center" style={{ paddingTop: 91 }}>
      <Box paddingHorizontal="44px">
        <Stack space="16px">
          <Text containsEmoji color="label" size="26pt" weight="bold" align="center">
            {'👻'}
          </Text>

          <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
            {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
          </Text>

          <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
            {i18n.t(i18n.l.swap.tokens_input[isL2 ? 'nothing_found_description_l2' : 'nothing_found_description'], {
              action,
            })}
          </Text>
        </Stack>
      </Box>
    </Box>
  );
};
