import React from 'react';
import * as i18n from '@/languages';
import { Box, Stack, Text } from '@/design-system';

type ListEmptyProps = {
  isL2?: boolean | null;
  action?: 'swap' | 'bridge';
};

export const ListEmpty = ({ isL2 = false, action = 'swap' }: ListEmptyProps) => (
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
