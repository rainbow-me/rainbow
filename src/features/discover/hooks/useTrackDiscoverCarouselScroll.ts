import { useEffect } from 'react';

import { useDebouncedCallback } from 'use-debounce';

import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { trackSurfaceInteraction } from '@/features/placements/engagement/trackInteraction';
import { type SurfaceId, type SurfaceLeaf } from '@/features/placements/surfaces/types';
import { time } from '@/framework/core/utils/time';

const SCROLL_DEBOUNCE_MS = time.ms(500);
const SCROLL_DEBOUNCE_OPTIONS = Object.freeze({ leading: false, trailing: true });

export function useTrackDiscoverCarouselScroll(section: SurfaceLeaf, surfaceId: SurfaceId, title: string): () => void {
  const onScrollSettle = useDebouncedCallback(
    () => {
      analytics.track(event.discoverCarouselScrolled, {
        display: section.display,
        sectionId: section.id,
      });

      trackSurfaceInteraction({
        display: section.display,
        id: surfaceId,
        sectionId: section.id,
        sectionTitle: title,
      });
    },
    SCROLL_DEBOUNCE_MS,
    SCROLL_DEBOUNCE_OPTIONS
  );

  useEffect(() => () => onScrollSettle.flush(), [onScrollSettle]);

  return onScrollSettle;
}
