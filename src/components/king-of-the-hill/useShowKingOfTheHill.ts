import { KING_OF_THE_HILL_TAB, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { useRemoteConfig } from '@/model/remoteConfig';

export const useShowKingOfTheHill = () => {
  const { king_of_the_hill2_enabled } = useRemoteConfig('king_of_the_hill2_enabled');
  return (useExperimentalFlag(KING_OF_THE_HILL_TAB) || king_of_the_hill2_enabled) && !IS_TEST;
};
