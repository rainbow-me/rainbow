import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryFunctionArgs } from '@/react-query';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 10_000;

// ///////////////////////////////////////////////
// Query Types

export type PromoSheetArgs = {
  promoSheetId: string;
};

const promoSheetQueryKey = ({ promoSheetId }: PromoSheetArgs) =>
  createQueryKey('promoSheet', { promoSheetId }, { persisterVersion: 1 });
