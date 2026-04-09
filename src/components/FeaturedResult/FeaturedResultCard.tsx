import { useCallback, useEffect } from 'react';

import { TrackFeaturedResultType } from '@/graphql/__generated__/arc';
import { logger } from '@/logger';
import { getFeaturedResultById } from '@/resources/featuredResults/_selectors/getFeaturedResultById';
import { useFeaturedResults, type FeaturedResultsVariables } from '@/resources/featuredResults/getFeaturedResults';
import { useTrackFeaturedResult } from '@/resources/featuredResults/trackFeaturedResult';

import { type FeaturedResultStackProps } from './FeaturedResultStack';

type FeaturedResultCardProps = FeaturedResultStackProps &
  FeaturedResultsVariables & {
    featuredResultId: string;
  };

export const FeaturedResultCard = ({ featuredResultId, onNavigate, children, ...props }: FeaturedResultCardProps) => {
  const { data: featuredResult } = useFeaturedResults(props, {
    select: data => getFeaturedResultById(data, featuredResultId),
  });

  const { mutateAsync: trackFeaturedResult } = useTrackFeaturedResult();

  useEffect(() => {
    (async () => {
      if (!featuredResult) {
        return;
      }

      await trackFeaturedResult({
        featuredResultCreativeId: featuredResult.id,
        placementId: featuredResult.placementSlug,
        impressionId: featuredResult.impressionId,
        type: TrackFeaturedResultType.Impression,
      });
    })();
  }, [featuredResult, trackFeaturedResult]);

  const handlePress = useCallback(async () => {
    try {
      if (!featuredResult) return;

      const [cta] = featuredResult.ctas || [];

      await trackFeaturedResult({
        featuredResultCreativeId: featuredResult.id,
        placementId: featuredResult.placementSlug,
        impressionId: featuredResult.impressionId,
        type: TrackFeaturedResultType.Click,
      });

      onNavigate(cta.href);
    } catch (error) {
      logger.warn(`[FeaturedResultCard] Error tracking featured result click`, { error });
    }
  }, [featuredResult, trackFeaturedResult, onNavigate]);

  if (!featuredResult) {
    return null;
  }

  return children({ featuredResult, handlePress });
};
