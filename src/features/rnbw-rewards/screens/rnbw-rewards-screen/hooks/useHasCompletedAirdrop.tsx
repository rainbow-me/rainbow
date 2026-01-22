import { HAS_COMPLETED_AIRDROP_FLOW_KEY } from '@/features/rnbw-rewards/constants';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useMMKVBoolean } from 'react-native-mmkv';

export const useHasCompletedAirdrop = () => {
  const walletAddress = useAccountAddress();
  return useMMKVBoolean(`${HAS_COMPLETED_AIRDROP_FLOW_KEY}-${walletAddress}`);
};
