import { ChainImage } from '@/components/coin-icon/ChainImage';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { ToastSFSymbolIcon } from '@/components/rainbow-toast/ToastSFSymbolIcon';
import type { RainbowToast } from '@/components/rainbow-toast/types';
import { RainbowImage } from '@/components/RainbowImage';
import { TransactionStatus } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const SendToastIcon = ({ toast, size = TOAST_ICON_SIZE }: { toast: RainbowToast; size?: number }) => {
  const { transaction } = toast;
  if (transaction.status === TransactionStatus.confirmed) {
    return <ToastSFSymbolIcon size={size} name="check" />;
  }

  if (transaction.status === TransactionStatus.failed) {
    return <ToastSFSymbolIcon size={size} name="exclamationMark" />;
  }

  const assetImage = transaction.asset?.icon_url || transaction.asset?.images?.lowResUrl;

  // show asset image + chain floating icon
  if (assetImage) {
    return (
      <View style={{ position: 'relative' }}>
        <View style={{ width: size, height: size, borderRadius: 100, overflow: 'hidden' }}>
          <RainbowImage source={{ url: assetImage }} style={{ width: size, height: size }} />
        </View>

        {transaction.chainId !== ChainId.mainnet && (
          <View style={styles.chainImageContainer}>
            <ChainImage chainId={transaction.chainId} size={16} />
          </View>
        )}
      </View>
    );
  }

  // if no asset image just show chain image
  return <ChainImage chainId={transaction.chainId} size={size} />;
};

const styles = StyleSheet.create({
  chainImageContainer: {
    position: 'absolute',
    bottom: -2,
    right: 8,
    zIndex: 10,
  },
});
