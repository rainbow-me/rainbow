import React from 'react';
import { Box, Text } from '@/design-system';
import i18n from '@/languages';
import { AssetListHeaderHeight } from '../../AssetListHeader';

export const TokensHeader = React.memo(function TokensHeader() {
  return (
    <Box height={{ custom: AssetListHeaderHeight }} paddingHorizontal={'19px (Deprecated)'} justifyContent="center">
      <Text size="22pt" color={'label'} weight="heavy">
        {i18n.account.tab_tokens()}
      </Text>
    </Box>
  );
});
