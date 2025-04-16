import { controlPanelStyles, Panel, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';
import { safeAreaInsetValues } from '@/utils';
import React from 'react';
import { ClaimPanelHeader } from './ClaimPanelHeader';
import { ClaimStatus } from '../../shared/types';

export function ClaimPanel({
  children,
  claimStatus,
  iconUrl,
  currentIndex,
  totalActions,
}: {
  children: React.ReactNode;
  claimStatus: ClaimStatus;
  iconUrl: string;
  currentIndex?: number;
  totalActions?: number;
}) {
  return (
    <>
      <Box
        style={[
          controlPanelStyles.panelContainer,
          { bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30), alignItems: 'center', width: '100%' },
        ]}
      >
        <Panel>
          <ClaimPanelHeader currentIndex={currentIndex} totalActions={totalActions} claimStatus={claimStatus} iconUrl={iconUrl} />
          <Box alignItems="center" paddingTop="44px" paddingBottom="24px" gap={42}>
            {children}
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
}
