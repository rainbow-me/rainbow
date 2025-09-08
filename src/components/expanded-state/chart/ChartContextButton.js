import * as i18n from '@/languages';
import { startCase } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ContextCircleButton } from '../../context-menu';
import EditAction from '@/helpers/EditAction';
import { useCoinListEditOptions, useCoinListFinishEditingOptions } from '@/hooks';
import { ethereumUtils } from '@/utils';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { getUniqueId } from '@/utils/ethereumUtils';

const emojiSpacing = ios ? '' : '  ';

export default function ChartContextButton({ asset, color }) {
  const { clearSelectedCoins, pushSelectedCoin } = useCoinListEditOptions();
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);

  const { currentAction, setPinnedCoins } = useCoinListFinishEditingOptions();

  useEffect(() => {
    // Ensure this expanded state's asset is always actively inside
    // the CoinListEditOptions selection queue
    pushSelectedCoin(asset?.uniqueId);

    // Clear CoinListEditOptions selection queue on unmount.
    return () => clearSelectedCoins();
  }, [asset, clearSelectedCoins, currentAction, pushSelectedCoin]);

  const handleActionSheetPress = useCallback(
    buttonIndex => {
      if (buttonIndex === 0) {
        // 📌️ Pin
        setPinnedCoins();
      } else if (buttonIndex === 1) {
        // 🙈️ Hide
        setHiddenAssets([getUniqueId(asset.address, asset.chainId)]);
      } else if (buttonIndex === 2 && !asset?.isNativeAsset) {
        // 🔍 View on Etherscan
        ethereumUtils.openTokenEtherscanURL({ address: asset?.address, chainId: asset?.chainId });
      }
    },
    [asset?.address, asset?.isNativeAsset, asset?.chainId, setHiddenAssets, setPinnedCoins]
  );

  const options = useMemo(
    () => [
      `📌️ ${emojiSpacing}${currentAction === EditAction.unpin ? i18n.t(i18n.l.wallet.action.unpin) : i18n.t(i18n.l.wallet.action.pin)}`,
      `🙈️ ${emojiSpacing}${currentAction === EditAction.unhide ? i18n.t(i18n.l.wallet.action.unhide) : i18n.t(i18n.l.wallet.action.hide)}`,
      ...(asset?.isNativeAsset
        ? []
        : [
            `🔍 ${emojiSpacing}${i18n.t(i18n.l.wallet.action.view_on, {
              blockExplorerName: startCase(ethereumUtils.getBlockExplorer({ chainId: asset?.chainId })),
            })}`,
          ]),
      ...(ios ? [i18n.t(i18n.l.wallet.action.cancel)] : []),
    ],
    [asset?.chainId, asset?.isNativeAsset, currentAction]
  );

  return <ContextCircleButton flex={0} onPressActionSheet={handleActionSheetPress} options={options} tintColor={color} />;
}
