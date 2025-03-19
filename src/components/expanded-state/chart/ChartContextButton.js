import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { ContextCircleButton } from '../../context-menu';
import { EditAction } from '@/screens/WalletScreen/UserAssets/UserAssetsListContext';
import { ethereumUtils } from '@/utils';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { getUniqueId } from '@/utils/ethereumUtils';

const emojiSpacing = ios ? '' : '  ';

export default function ChartContextButton({ asset, color }) {
  const setHiddenAssets = useUserAssetsStore(state => state.setHiddenAssets);
  const { pinnedAssets, hiddenAssets } = useUserAssetsStore(state => ({
    pinnedAssets: state.pinnedAssets,
    hiddenAssets: state.hiddenAssets,
  }));
  const setPinnedAssets = useUserAssetsStore(state => state.setPinnedAssets);

  const uniqueId = getUniqueId(asset.address, asset.chainId);

  const handleActionSheetPress = useCallback(
    buttonIndex => {
      if (buttonIndex === 0) {
        // 📌️ Pin
        setPinnedAssets([uniqueId], EditAction.pin);
      } else if (buttonIndex === 1) {
        // 🙈️ Hide
        setHiddenAssets([uniqueId], EditAction.hide);
      } else if (buttonIndex === 2 && !asset?.isNativeAsset) {
        // 🔍 View on Etherscan
        ethereumUtils.openTokenEtherscanURL({ address: asset?.address, chainId: asset?.chainId });
      }
    },
    [asset?.address, asset?.isNativeAsset, asset?.chainId, setHiddenAssets, setPinnedAssets, uniqueId]
  );

  const options = useMemo(
    () => [
      `📌️ ${emojiSpacing}${pinnedAssets.has(uniqueId) ? lang.t('wallet.action.unpin') : lang.t('wallet.action.pin')}`,
      `🙈️ ${emojiSpacing}${hiddenAssets.has(uniqueId) ? lang.t('wallet.action.unhide') : lang.t('wallet.action.hide')}`,
      ...(asset?.isNativeAsset
        ? []
        : [
            `🔍 ${emojiSpacing}${lang.t('wallet.action.view_on', {
              blockExplorerName: startCase(ethereumUtils.getBlockExplorer({ chainId: asset?.chainId })),
            })}`,
          ]),
      ...(ios ? [lang.t('wallet.action.cancel')] : []),
    ],
    [asset?.chainId, asset?.isNativeAsset, pinnedAssets, hiddenAssets, uniqueId]
  );

  return <ContextCircleButton flex={0} onPressActionSheet={handleActionSheetPress} options={options} tintColor={color} />;
}
