import React, { memo } from 'react';
import { Box, Stack, Text } from '@/design-system';
import * as i18n from '@/languages';

type TokenSearchNotFoundProps = {
  description?: string;
};

export const TokenSearchNotFound = memo(function TokenSearchNotFound({ description }: TokenSearchNotFoundProps) {
  return (
    <Box paddingHorizontal="44px">
      <Stack space="16px">
        <Text containsEmoji color="label" size="26pt" weight="bold" align="center">
          👻
        </Text>

        <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
          {i18n.t(i18n.l.token_search.nothing_found)}
        </Text>

        {description ? (
          <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
            {description}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
});
