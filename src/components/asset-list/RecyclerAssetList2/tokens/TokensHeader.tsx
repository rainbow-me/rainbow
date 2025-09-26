import React from 'react';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';

const HEIGHT = 48;

export const TokensHeader = React.memo(function TokensHeader() {
  return (
    <Box height={{ custom: HEIGHT }} paddingHorizontal={'19px (Deprecated)'} justifyContent="center">
      <Text size="22pt" color={'label'} weight="heavy">
        {i18n.t(i18n.l.account.tab_tokens)}
      </Text>
    </Box>
  );
});
