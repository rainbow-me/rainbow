import { DEFI_POSITIONS_THRESHOLD_FILTER } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';

/** Sets the real value-filter flag without replacing unrelated experimental settings. */
export function setPositionValueFilter(enabled: boolean): void {
  useExperimentalConfigStore.getState().setFlag(DEFI_POSITIONS_THRESHOLD_FILTER, enabled);
}
