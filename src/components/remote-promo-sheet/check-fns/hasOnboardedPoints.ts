import { metadataPOSTClient } from '@/graphql';
import { PointsErrorType } from '@/graphql/__generated__/metadataPOST';
import { getAccountAddress } from '@/state/wallets/wallets';

export const hasOnboardedPoints = async (): Promise<boolean> => {
  const accountAddress = getAccountAddress();

  const data = await metadataPOSTClient.getPointsDataForWallet({
    address: accountAddress,
  });

  const isOnboarded = data?.points?.error?.type !== PointsErrorType.NonExistingUser;

  return isOnboarded;
};
