import { useMMKVBoolean } from 'react-native-mmkv';

import { HAS_COMPLETED_AIRDROP_FLOW_KEY } from '@/features/rnbw-rewards/constants';

export const useHasCompletedAirdropFlow = (address: string) => {
  return useMMKVBoolean(`${HAS_COMPLETED_AIRDROP_FLOW_KEY}-${address}`);
};
