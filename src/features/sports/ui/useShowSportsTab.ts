import { IS_TEST } from '@/env';
import { usePolymarketEnabled } from '@/features/polymarket/stores/derived/usePolymarketEnabled';

export function useShowSportsTab(): boolean {
  return usePolymarketEnabled() && !IS_TEST;
}
