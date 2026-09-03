import { time } from '@/framework/core/utils/time';

export const NFTS_PAGE_SIZE = 12;
export const NFTS_STALE_TIME = time.minutes(10);
export const NFTS_PAGINATION_STALE_TIME = time.seconds(30);
export const NFTS_PRUNE_INTERVAL = time.minutes(10);
