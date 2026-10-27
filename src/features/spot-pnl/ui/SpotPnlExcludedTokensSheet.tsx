import React from 'react';

import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';

export function SpotPnlExcludedTokensSheet() {
  return (
    <PanelSheet borderRadius={38} innerBorderWidth={1}>
      <Box gap={24} paddingHorizontal={{ custom: 32 }} paddingTop={{ custom: 36 }} paddingBottom={{ custom: 40 }}>
        <Text color="label" size="26pt" weight="heavy">
          {'􀅴'}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="bold">
          {i18n.t(i18n.l.spot_pnl_sheet.excluded_tokens_info)}
        </Text>
      </Box>
    </PanelSheet>
  );
}
