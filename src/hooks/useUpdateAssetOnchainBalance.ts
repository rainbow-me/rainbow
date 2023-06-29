import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getOnchainAssetBalance } from '../handlers/assets';
import { dataUpdateAsset } from '../redux/data';
import { logger } from '@/utils';

export default function useUpdateAssetOnchainBalance() {
  const dispatch = useDispatch();

  const updateAssetOnchainBalance = useCallback(
    async (
      assetToUpdate: any,
      accountAddress: any,
      network: any,
      provider: any,
      successCallback: any
    ) => {
      const balance = await getOnchainAssetBalance(
        assetToUpdate,
        accountAddress,
        network,
        provider
      );
      if (balance && balance?.amount !== assetToUpdate?.balance?.amount) {
        const updatedAssetWithBalance = {
          ...assetToUpdate,
          balance,
        };
        // Now we need to update the asset
        // First in the state
        successCallback(updatedAssetWithBalance);
        // Then in redux
        await dispatch(dataUpdateAsset(updatedAssetWithBalance));
        logger.log(
          `balance updated with onchain data for asset ${assetToUpdate.symbol}`,
          balance
        );
      }
    },
    [dispatch]
  );
  return updateAssetOnchainBalance;
}
