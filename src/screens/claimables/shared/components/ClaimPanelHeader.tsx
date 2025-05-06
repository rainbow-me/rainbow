import { ListHeader } from '@/components/SmoothPager/ListPanel';
import { Box, Text, TextShadow } from '@/design-system';
import { FasterImageView } from '@candlefinance/faster-image';
import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import { TextColor } from '@/design-system/color/palettes';
import { ClaimStatus } from '../../shared/types';

export function ClaimPanelHeader({
  title,
  subtitle,
  claimStatus,
  iconUrl,
}: {
  title?: string;
  subtitle?: string;
  claimStatus: ClaimStatus;
  iconUrl: string;
}) {
  const panelTitle = useMemo(() => {
    switch (claimStatus) {
      case 'notReady':
      case 'ready':
        return title ?? i18n.t(i18n.l.claimables.panel.claim);
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
  }, [claimStatus, title]);

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
      BackButtonComponent={
        <Box marginLeft={{ custom: 10 }} borderRadius={10} borderWidth={1} borderColor={{ custom: 'rgba(0, 0, 0, 0.03)' }}>
          <FasterImageView source={{ url: iconUrl }} style={{ height: 32, width: 32 }} />
        </Box>
      }
      TitleComponent={
        <Box alignItems="center" gap={10} justifyContent="center">
          <TextShadow shadowOpacity={0.3}>
            <Text align="center" color={panelTitleColor} size="20pt" weight="heavy">
              {panelTitle}
            </Text>
          </TextShadow>
          {subtitle && (
            <TextShadow shadowOpacity={0.3}>
              <Text align="center" color="labelTertiary" size="13pt" weight="semibold">
                {subtitle}
              </Text>
            </TextShadow>
          )}
        </Box>
      }
    />
  );
}
