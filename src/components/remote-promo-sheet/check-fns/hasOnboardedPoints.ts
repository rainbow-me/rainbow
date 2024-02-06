import { metadataPOSTClient } from '@/graphql';
import { PointsErrorType } from '@/graphql/__generated__/metadataPOST';
import store from '@/redux/store';

export const hasOnboardedPoints = async (): Promise<boolean> => {
  const { accountAddress } = store.getState().settings;

  const data = await metadataPOSTClient.getPointsDataForWallet({
    address: accountAddress,
  });

  const isOnboarded = data?.points?.error?.type !== PointsErrorType.NonExistingUser;

  return isOnboarded;
};
