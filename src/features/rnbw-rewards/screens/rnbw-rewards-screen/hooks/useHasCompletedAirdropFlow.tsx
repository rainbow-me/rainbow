import { HAS_COMPLETED_AIRDROP_FLOW_KEY } from '@/features/rnbw-rewards/constants';
import { useMMKVBoolean } from 'react-native-mmkv';

export const useHasCompletedAirdropFlow = (address: string) => {
  return useMMKVBoolean(`${HAS_COMPLETED_AIRDROP_FLOW_KEY}-${address}`);
};
