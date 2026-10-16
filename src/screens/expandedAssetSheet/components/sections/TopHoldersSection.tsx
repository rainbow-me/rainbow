import React, { memo } from 'react';

import Animated from 'react-native-reanimated';

import { Box } from '@/design-system';
import { useViewedTokenStore } from '@/features/token/data/stores/viewedTokenStore';
import { useTopHoldersEnabledStore, useTopHoldersStore } from '@/features/top-holders/data/topHoldersStore';
import { TopHolders } from '@/features/top-holders/ui/TopHolders';
import * as i18n from '@/languages';
import { CollapsibleSection, LAYOUT_ANIMATION } from '@/screens/expandedAssetSheet/components/shared/CollapsibleSection';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import { SectionId } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';

export const TopHoldersSection = memo(function TopHoldersSection() {
  const isEnabled = useTopHoldersEnabledStore();
  const hasHolders = useTopHoldersStore(state => !!state.getData());
  const token = useViewedTokenStore(state => (state.token && typeof state.token !== 'string' ? state.token : null));
  if (!isEnabled || !hasHolders || !token) return null;

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
});
