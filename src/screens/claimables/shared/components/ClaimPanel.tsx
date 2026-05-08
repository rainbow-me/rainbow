import React from 'react';
import { Platform } from 'react-native';

import { controlPanelStyles, Panel, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { Box } from '@/design-system';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

import { type ClaimStatus } from '../../shared/types';
import { ClaimPanelHeader } from './ClaimPanelHeader';

export function ClaimPanel({
  children,
  title,
  subtitle,
  claimStatus,
  iconUrl,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  claimStatus: ClaimStatus;
  iconUrl: string;
}) {
  return (
    <>
      <Box
        style={[
          controlPanelStyles.panelContainer,
          { bottom: Math.max(safeAreaInsetValues.bottom + 5, Platform.OS === 'ios' ? 8 : 30), alignItems: 'center', width: '100%' },
        ]}
      >
        <Panel>
          <ClaimPanelHeader title={title} subtitle={subtitle} claimStatus={claimStatus} iconUrl={iconUrl} />
          <Box alignItems="center" paddingTop="44px" paddingBottom="24px" gap={42}>
            {children}
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
}
