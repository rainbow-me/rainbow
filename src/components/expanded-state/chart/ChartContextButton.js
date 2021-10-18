import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ContextCircleButton } from '../../context-menu';
import EditOptions from '@rainbow-me/helpers/editOptionTypes';
import { useCoinListEditOptions } from '@rainbow-me/hooks';
import { ethereumUtils } from '@rainbow-me/utils';

export default function ChartContextButton({ asset, color }) {
  const {
    clearSelectedCoins,
    currentAction,
    pushSelectedCoin,
    setHiddenCoins,
    setPinnedCoins,
  } = useCoinListEditOptions();

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
      } else if (buttonIndex === 2 && asset?.uniqueId !== 'eth') {
        // 🔍 View on Etherscan
        ethereumUtils.openTokenEtherscanURL(asset?.uniqueId, asset?.type);
      }
    },
    [asset?.type, asset?.uniqueId, setHiddenCoins, setPinnedCoins]
  );

  const options = useMemo(
    () => [
      `📌️ ${currentAction === EditOptions.unpin ? 'Unpin' : 'Pin'}`,
      `🙈️ ${currentAction === EditOptions.unhide ? 'Unhide' : 'Hide'}`,
      ...(asset?.uniqueId === 'eth'
        ? []
        : [
            `🔍 View on ${startCase(
              ethereumUtils.getBlockExplorer(asset?.type)
            )}`,
          ]),
      ...(ios ? [lang.t('wallet.action.cancel')] : []),
    ],
    [asset.type, asset?.uniqueId, currentAction]
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
