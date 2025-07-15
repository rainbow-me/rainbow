import { getSwapToastStatusLabel, useSwapToastNetworkLabel } from '@/components/rainbow-toast/SwapToastContent';
import { SWAP_ICON_WIDTH, SwapToastIcon } from '@/components/rainbow-toast/SwapToastIcon';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import React from 'react';
import { View } from 'react-native';
import { ToastExpandedContent } from './ToastExpandedContent';

export function SwapToastExpandedContent({ toast }: { toast: RainbowToastSwap }) {
  const { transaction } = toast;

  const title = useSwapToastNetworkLabel({ toast });
  const subtitle = getSwapToastStatusLabel({ toast });

  const icon = (
    <View style={{ marginLeft: -(SWAP_ICON_WIDTH - 28) / 2 }}>
      <SwapToastIcon toast={toast} />
    </View>
  );

  return <ToastExpandedContent icon={icon} statusLabel={subtitle} label={title} transaction={transaction} />;
}
