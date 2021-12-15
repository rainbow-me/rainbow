import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ContextCircleButton } from '../../context-menu';
import EditAction from '@rainbow-me/helpers/EditAction';
import {
  useCoinListEditOptions,
  useCoinListFinishEditingOptions,
} from '@rainbow-me/hooks';
import { ethereumUtils } from '@rainbow-me/utils';

export default function ChartContextButton({ asset, color }) {
  const { clearSelectedCoins, pushSelectedCoin } = useCoinListEditOptions();

  const {
    currentAction,
    setHiddenCoins,
    setPinnedCoins,
  } = useCoinListFinishEditingOptions();

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
        ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.type);
      }
    },
    [
      asset?.address,
      asset?.isNativeAsset,
      asset?.type,
      setHiddenCoins,
      setPinnedCoins,
    ]
  );

  const options = useMemo(
    () => [
      `📌️ ${currentAction === EditAction.unpin ? 'Unpin' : 'Pin'}`,
      `🙈️ ${currentAction === EditAction.unhide ? 'Unhide' : 'Hide'}`,
      ...(asset?.isNativeAsset
        ? []
        : [
            `🔍 View on ${startCase(
              ethereumUtils.getBlockExplorer(asset?.type)
            )}`,
          ]),
      ...(ios ? [lang.t('wallet.action.cancel')] : []),
    ],
    [asset?.isNativeAsset, asset?.type, currentAction]
  );

  return (
    <ContextCircleButton
      flex={0}
      onPressActionSheet={handleActionSheetPress}
      options={options}
      tintColor={color}
    />
  );
}
