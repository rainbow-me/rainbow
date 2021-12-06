import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { ContextCircleButton } from '../../context-menu';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/editOption... Remove this comment to see the full error message
import EditOptions from '@rainbow-me/helpers/editOptionTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useCoinListEditOptions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

export default function ChartContextButton({ asset, color }: any) {
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
      `📌️ ${currentAction === EditOptions.unpin ? 'Unpin' : 'Pin'}`,
      `🙈️ ${currentAction === EditOptions.unhide ? 'Unhide' : 'Hide'}`,
      ...(asset?.isNativeAsset
        ? []
        : [
            `🔍 View on ${startCase(
              ethereumUtils.getBlockExplorer(asset?.type)
            )}`,
          ]),
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      ...(ios ? [lang.t('wallet.action.cancel')] : []),
    ],
    [asset?.isNativeAsset, asset?.type, currentAction]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ContextCircleButton
      flex={0}
      onPressActionSheet={handleActionSheetPress}
      options={options}
      tintColor={color}
    />
  );
}
