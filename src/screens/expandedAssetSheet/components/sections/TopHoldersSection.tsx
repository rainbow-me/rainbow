import React, { memo } from 'react';

import Animated from 'react-native-reanimated';

import { Box } from '@/design-system';
import { TOP_HOLDERS } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { useTopHoldersStore } from '@/features/top-holders/data/topHoldersStore';
import { TopHolders } from '@/features/top-holders/ui/TopHolders';
import * as i18n from '@/languages';
import { CollapsibleSection, LAYOUT_ANIMATION } from '@/screens/expandedAssetSheet/components/shared/CollapsibleSection';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import { SectionId } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';

export const TopHoldersSection = memo(function TopHoldersSection() {
  const { top_holders_enabled } = useRemoteConfig('top_holders_enabled');
  const topHoldersExperimentalEnabled = useExperimentalFlag(TOP_HOLDERS);

  if (!top_holders_enabled && !topHoldersExperimentalEnabled) return null;
  return <TopHoldersSectionContent />;
});

function TopHoldersSectionContent() {
  // Subscribing here, behind the feature gate, is what triggers the fetch
  const hasHolders = useTopHoldersStore(topHolders => topHolders !== null);
  const token = useViewedTokenStore(state => (state.token && typeof state.token !== 'string' ? state.token : null));
  if (!hasHolders || !token) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<TopHolders token={token} />}
        icon="􀉫"
        id={SectionId.HOLDERS}
        primaryText={i18n.t(i18n.l.expanded_state.sections.top_holders.title_top)}
        secondaryText={i18n.t(i18n.l.expanded_state.sections.top_holders.title_holders)}
      />
      <SheetSeparator />
    </Box>
  );
}
