import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useMutation } from '@tanstack/react-query';
import { arcClient } from '@/graphql';

export type TrackFeaturedResultVariables = Parameters<typeof arcClient.trackFeaturedResult>['0'];
export type TrackFeaturedResultResult = Awaited<ReturnType<typeof arcClient.trackFeaturedResult>>;

// ///////////////////////////////////////////////
// Mutation Key
export const trackFeaturedResultMutationKey = (props: TrackFeaturedResultVariables) =>
  createQueryKey('track-featured-result', props, { persisterVersion: 1 });

export type TrackFeaturedResultMutationKey = ReturnType<typeof trackFeaturedResultMutationKey>;

// ///////////////////////////////////////////////
// Query Hook

export function useTrackFeaturedResult(
  props: TrackFeaturedResultVariables,
  config: QueryConfigWithSelect<TrackFeaturedResultResult, Error, TrackFeaturedResultResult, TrackFeaturedResultMutationKey> = {}
) {
  return useMutation(trackFeaturedResultMutationKey(props), () => arcClient.trackFeaturedResult(props), {
    ...config,
  });
}
