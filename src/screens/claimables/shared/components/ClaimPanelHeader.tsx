import { ListHeader } from '@/components/SmoothPager/ListPanel';
import { Box, Text, TextShadow } from '@/design-system';
import { FasterImageView } from '@candlefinance/faster-image';
import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { TextColor } from '@/design-system/color/palettes';
import { ClaimStatus } from '../../shared/types';

export function ClaimPanelHeader({ claimStatus, iconUrl }: { claimStatus: ClaimStatus; iconUrl: string }) {
  const panelTitle = useMemo(() => {
    switch (claimStatus) {
      case 'notReady':
      case 'ready':
        return i18n.t(i18n.l.claimables.panel.claim);
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claiming);
      case 'pending':
        return i18n.t(i18n.l.claimables.panel.tokens_on_the_way);
      case 'success':
        return i18n.t(i18n.l.claimables.panel.claimed);
      case 'unrecoverableError':
        return i18n.t(i18n.l.claimables.panel.swap_failed);
      default:
        return i18n.t(i18n.l.claimables.panel.claiming_failed);
    }
  }, [claimStatus]);

  const panelTitleColor: TextColor = useMemo(() => {
    switch (claimStatus) {
      case 'notReady':
      case 'ready':
      case 'claiming':
        return 'label';
      case 'pending':
      case 'success':
        return 'green';
      case 'unrecoverableError':
      case 'recoverableError':
      default:
        return 'red';
    }
  }, [claimStatus]);

  return (
    <ListHeader
      TitleComponent={
        <Box alignItems="center" flexDirection="row" gap={10} justifyContent="center">
          <Box borderRadius={6} borderWidth={1} borderColor={{ custom: 'rgba(0, 0, 0, 0.03)' }}>
            <FasterImageView source={{ url: iconUrl }} style={{ height: 20, width: 20 }} />
          </Box>
          <TextShadow shadowOpacity={0.3}>
            <Text align="center" color={panelTitleColor} size="20pt" weight="heavy">
              {panelTitle}
            </Text>
          </TextShadow>
        </Box>
      }
      showBackButton={false}
    />
  );
}
