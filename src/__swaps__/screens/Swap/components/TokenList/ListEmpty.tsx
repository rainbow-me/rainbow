import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Stack, Text } from '@/design-system';
import { swapsStore } from '@/state/swaps/swapsStore';
import { isL2Chain } from '@/__swaps__/utils/chains';

type ListEmptyProps = {
  action?: 'swap' | 'bridge';
  isSearchEmptyState?: boolean;
  output?: boolean;
};

export const ListEmpty = ({ action = 'swap', isSearchEmptyState, output = false }: ListEmptyProps) => {
  // TODO: Might need to make this reactive instead of reading inline getState
  const isL2 = useMemo(() => {
    return output ? isL2Chain(swapsStore.getState().selectedOutputChainId) : false;
  }, [output]);

  return (
    <Box
      alignItems="center"
      height="full"
      style={{ alignSelf: 'center', flexDirection: 'row', paddingVertical: isSearchEmptyState ? 40 : 120 }}
    >
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
