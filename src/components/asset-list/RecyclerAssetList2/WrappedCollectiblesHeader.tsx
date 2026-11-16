import React from 'react';

import { Box, Inline, Text } from '@/design-system';
import { useNftsEnabled } from '@/features/nfts/data/nftsEnabledStore';
import * as i18n from '@/languages';

const TokenFamilyHeaderHeight = 48;

const CollectiblesHeader = () => {
  const nftsEnabled = useNftsEnabled();

  if (!nftsEnabled) return null;

  return (
    <Box
      height={{ custom: TokenFamilyHeaderHeight }}
      paddingBottom="2px"
      paddingHorizontal={'19px (Deprecated)'}
      justifyContent="flex-end"
      testID={`collectibles-list-header`}
    >
      <Inline alignHorizontal="justify" alignVertical="center">
        <Text size="22pt" color={'label'} weight="heavy">
          {i18n.t(i18n.l.account.tab_collectibles)}
        </Text>
      </Inline>
    </Box>
  );
};

CollectiblesHeader.height = TokenFamilyHeaderHeight;

export default React.memo(CollectiblesHeader);
