import { SWAP_ICON_WIDTH, SwapToastIcon } from '@/components/rainbow-toast/SwapToastIcon';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import { useChainsLabel } from '@/components/rainbow-toast/helpers';
import type { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { Text } from 'react-native';

export function SwapToastContent({ toast }: { toast: RainbowToastSwap }) {
  const icon = <SwapToastIcon toast={toast} />;
  const title = getSwapToastStatusLabel({ toast });
  const subtitle = useSwapToastNetworkLabel({ toast });
  return <ToastContent iconWidth={SWAP_ICON_WIDTH} icon={icon} title={title} subtitle={subtitle} />;
}

export const getSwapToastStatusLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  return toast.status === TransactionStatus.swapping ? 'Swapping' : 'Swapped';
};

export const useSwapToastNetworkLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  const chainsLabel = useChainsLabel();
  const fromNetwork = chainsLabel[toast.fromChainId]?.symbol || '';
  const toNetwork = chainsLabel[toast.toChainId]?.symbol || '';
  return (
    <>
      {fromNetwork} <Text style={{ fontWeight: '200' }}>􀄫</Text> {toNetwork}
    </>
  );
};
