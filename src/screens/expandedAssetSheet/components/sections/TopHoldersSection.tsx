import React, { memo } from 'react';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ShimmerAnimation } from '@/components/animations/ShimmerAnimation';
import { Box, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { TOP_HOLDERS_LIMIT } from '@/features/top-holders/core/topHolders';
import { useTopHoldersEnabledStore, useTopHoldersStore } from '@/features/top-holders/data/topHoldersStore';
import { HOLDER_ROW_HEIGHT, HOLDER_ROW_SEPARATOR_HEIGHT, TopHolders } from '@/features/top-holders/ui/TopHolders';
import * as i18n from '@/languages';
import { CollapsibleSection, LAYOUT_ANIMATION } from '@/screens/expandedAssetSheet/components/shared/CollapsibleSection';
import { SheetSeparator } from '@/screens/expandedAssetSheet/components/shared/Separator';
import { SectionId, useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';

const FADE_DURATION = 160;
const SKELETON_ROW_INSET = 6;

export const TopHoldersSection = memo(function TopHoldersSection() {
  const isEnabled = useTopHoldersEnabledStore();
  // Cached holders stay on screen through a refetch and after a failed one. Without them, a failed first load stays
  // hidden through its retries: the cache entry keeps the failure until a fetch succeeds, while `status` returns to loading
  const display = useTopHoldersStore(state => {
    if (state.getData()) return 'holders';
    if (state.getCacheEntry()?.errorInfo) return null;
    return state.status === 'idle' || state.status === 'loading' ? 'skeleton' : null;
  });
  const token = useChartsStore(state => (state.token && typeof state.token !== 'string' ? state.token : null));
  if (!isEnabled || !display || !token) return null;

  return (
    <Box
      as={Animated.View}
      entering={FadeIn.duration(FADE_DURATION)}
      exiting={FadeOut.duration(FADE_DURATION)}
      layout={LAYOUT_ANIMATION}
      gap={28}
    >
      <CollapsibleSection
        content={
          display === 'holders' ? (
            <Animated.View entering={FadeIn.duration(FADE_DURATION)}>
              <TopHolders token={token} />
            </Animated.View>
          ) : (
            <TopHoldersSkeleton />
          )
        }
        icon="􀉫"
        id={SectionId.HOLDERS}
        primaryText={i18n.t(i18n.l.expanded_state.sections.top_holders.title_top)}
        secondaryText={i18n.t(i18n.l.expanded_state.sections.top_holders.title_holders)}
      />
      <SheetSeparator />
    </Box>
  );
});

/** As tall as a full holder list, so the list replaces it without moving the sections below. */
function TopHoldersSkeleton() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const shimmerColor = opacity(fillTertiary, isDarkMode ? 0.025 : 0.06);

  return (
    <Box
      as={Animated.View}
      exiting={FadeOut.duration(FADE_DURATION)}
      gap={HOLDER_ROW_SEPARATOR_HEIGHT}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: TOP_HOLDERS_LIMIT }, (_, index) => (
        <Box key={index} height={{ custom: HOLDER_ROW_HEIGHT }} paddingVertical={{ custom: SKELETON_ROW_INSET }}>
          <Box backgroundColor={accentColors.surfaceSecondary} borderRadius={18} height="full" style={{ overflow: 'hidden' }}>
            <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
