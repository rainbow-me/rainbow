import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useMutation } from '@tanstack/react-query';
import { arcPOSTClient } from '@/graphql';

export type TrackFeaturedResultVariables = Parameters<typeof arcPOSTClient.trackFeaturedResult>['0'];
export type TrackFeaturedResultResult = Awaited<ReturnType<typeof arcPOSTClient.trackFeaturedResult>>;

// ///////////////////////////////////////////////
// Mutation Key
export const trackFeaturedResultMutationKey = (props: Partial<TrackFeaturedResultVariables>) =>
  createQueryKey('track-featured-result', props, { persisterVersion: 1 });

export type TrackFeaturedResultMutationKey = ReturnType<typeof trackFeaturedResultMutationKey>;

// ///////////////////////////////////////////////
// Query Hook

export function useTrackFeaturedResult(
  props: Partial<TrackFeaturedResultVariables> = {},
  config: QueryConfigWithSelect<TrackFeaturedResultResult, Error, TrackFeaturedResultResult, TrackFeaturedResultMutationKey> = {}
) {
  return useMutation(trackFeaturedResultMutationKey(props), arcPOSTClient.trackFeaturedResult, {
    ...config,
  });
}
