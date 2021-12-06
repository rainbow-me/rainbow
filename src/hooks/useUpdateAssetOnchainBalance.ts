import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getOnchainAssetBalance } from '../handlers/assets';
import { dataUpdateAssets } from '../redux/data';
import useAccountAssets from './useAccountAssets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { logger } from '@rainbow-me/utils';

export default function useUpdateAssetOnchainBalance() {
  const { allAssets } = useAccountAssets();
  const dispatch = useDispatch();

  const updateAssetOnchainBalance = useCallback(
    async (
      assetToUpdate,
      accountAddress,
      network,
      provider,
      successCallback
    ) => {
      const balance = await getOnchainAssetBalance(
        assetToUpdate,
        accountAddress,
        network,
        provider
      );
      if (balance?.amount !== assetToUpdate?.balance?.amount) {
        // Now we need to update the asset
        // First in the state
        successCallback({ ...assetToUpdate, balance });
        // Then in redux
        const allAssetsUpdated = allAssets.map((asset: any) => {
          if (
            asset.address === assetToUpdate.address &&
            asset.network === assetToUpdate.network
          ) {
            asset.balance = balance;
          }
          return asset;
        });
        await dispatch(dataUpdateAssets(allAssetsUpdated));
        logger.log(
          `balance updated with onchain data for asset ${assetToUpdate.symbol}`,
          balance
        );
      }
    },
    [allAssets, dispatch]
  );
  return updateAssetOnchainBalance;
}
