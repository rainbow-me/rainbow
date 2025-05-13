import { metadataPOSTClient } from '@/graphql';
import { PointsErrorType } from '@/graphql/__generated__/metadataPOST';
import { useWalletsStore } from '@/redux/wallets';

export const hasOnboardedPoints = async (): Promise<boolean> => {
  const { accountAddress } = useWalletsStore.getState();
  
  if (!accountAddress) return false;

  const data = await metadataPOSTClient.getPointsDataForWallet({
    address: accountAddress,
  });

  const isOnboarded = data?.points?.error?.type !== PointsErrorType.NonExistingUser;

  return isOnboarded;
};
