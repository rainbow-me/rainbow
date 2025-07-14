import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SFSymbolIcon } from '@/components/icons/SFSymbolIcon';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import { TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { useChainsLabel } from '@/components/rainbow-toast/helpers';
import type { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { Text, View } from 'react-native';

const ICON_INTERSECT = TOAST_ICON_SIZE * 0.3;

export function SwapToastContent({ toast }: { toast: RainbowToastSwap }) {
  const chainsLabel = useChainsLabel();
  const iconWidth = TOAST_ICON_SIZE * 2 - ICON_INTERSECT;

  const icon =
    toast.status === TransactionStatus.swapped ? (
      <SFSymbolIcon name="check" />
    ) : (
      <View style={{ flexDirection: 'row', height: TOAST_ICON_SIZE }}>
        <ChainImage chainId={toast.fromChainId} size={TOAST_ICON_SIZE} />
        <View style={{ transform: [{ translateX: TOAST_ICON_SIZE - ICON_INTERSECT }] }}>
          <ChainImage chainId={toast.toChainId} size={TOAST_ICON_SIZE} />
        </View>
      </View>
    );

  const title = toast.status === TransactionStatus.swapping ? 'Swapping' : 'Swapped';
  const fromNetwork = chainsLabel[toast.fromChainId]?.symbol || '';
  const toNetwork = chainsLabel[toast.toChainId]?.symbol || '';
  const subtitle = (
    <>
      {fromNetwork} <Text style={{ fontWeight: '200' }}>􀄫</Text> {toNetwork}
    </>
  );

  return <ToastContent icon={icon} iconWidth={iconWidth} title={title} subtitle={subtitle} />;
}
