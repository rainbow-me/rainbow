import { IS_TEST } from '@/env';
import { KING_OF_THE_HILL_TAB } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';

export const useShowKingOfTheHill = () => {
  const { king_of_the_hill2_enabled } = useRemoteConfig('king_of_the_hill2_enabled');
  return (useExperimentalFlag(KING_OF_THE_HILL_TAB) || king_of_the_hill2_enabled) && !IS_TEST;
};
