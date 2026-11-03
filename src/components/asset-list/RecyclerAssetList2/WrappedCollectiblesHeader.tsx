import React from 'react';

import { Box, Inline, Text } from '@/design-system';
import { NFTS_ENABLED } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import * as i18n from '@/languages';

const TokenFamilyHeaderHeight = 48;

const CollectiblesHeader = () => {
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

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
