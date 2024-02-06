import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ContextCircleButton } from '../../context-menu';
import EditAction from '@/helpers/EditAction';
import { useCoinListEditOptions, useCoinListFinishEditingOptions } from '@/hooks';
import { ethereumUtils } from '@/utils';

const emojiSpacing = ios ? '' : '  ';

export default function ChartContextButton({ asset, color }) {
  const { clearSelectedCoins, pushSelectedCoin } = useCoinListEditOptions();

  const { currentAction, setHiddenCoins, setPinnedCoins } = useCoinListFinishEditingOptions();

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
        setHiddenCoins();
      } else if (buttonIndex === 2 && !asset?.isNativeAsset) {
        // 🔍 View on Etherscan
        ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.network);
      }
    },
    [asset?.address, asset?.isNativeAsset, asset?.network, setHiddenCoins, setPinnedCoins]
  );

  const options = useMemo(
    () => [
      `📌️ ${emojiSpacing}${currentAction === EditAction.unpin ? lang.t('wallet.action.unpin') : lang.t('wallet.action.pin')}`,
      `🙈️ ${emojiSpacing}${currentAction === EditAction.unhide ? lang.t('wallet.action.unhide') : lang.t('wallet.action.hide')}`,
      ...(asset?.isNativeAsset
        ? []
        : [
            `🔍 ${emojiSpacing}${lang.t('wallet.action.view_on', {
              blockExplorerName: startCase(ethereumUtils.getBlockExplorer(asset?.network)),
            })}`,
          ]),
      ...(ios ? [lang.t('wallet.action.cancel')] : []),
    ],
    [asset?.isNativeAsset, asset?.network, currentAction]
  );

  return <ContextCircleButton flex={0} onPressActionSheet={handleActionSheetPress} options={options} tintColor={color} />;
}
