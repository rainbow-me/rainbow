import React from 'react';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SFSymbolIcon } from '@/components/icons/SFSymbolIcon';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import { View } from 'react-native';

const ICON_INTERSECT = TOAST_ICON_SIZE * 0.3;

export const SWAP_ICON_WIDTH = TOAST_ICON_SIZE * 2 - ICON_INTERSECT;

export const SwapToastIcon = ({ toast }: { toast: RainbowToastSwap }) => {
  return toast.status === TransactionStatus.swapped ? (
    <SFSymbolIcon name="check" />
  ) : (
    <View style={{ flexDirection: 'row', height: TOAST_ICON_SIZE }}>
      <ChainImage chainId={toast.fromChainId} size={TOAST_ICON_SIZE} />
      <View style={{ transform: [{ translateX: TOAST_ICON_SIZE - ICON_INTERSECT }] }}>
        <ChainImage chainId={toast.toChainId} size={TOAST_ICON_SIZE} />
      </View>
    </View>
  );
};
