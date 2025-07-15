import { getSwapToastStatusLabel, useSwapToastNetworkLabel } from '@/components/rainbow-toast/SwapToastContent';
import { SWAP_ICON_WIDTH, SwapToastIcon } from '@/components/rainbow-toast/SwapToastIcon';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import React from 'react';
import { View } from 'react-native';
import { EXPANDED_ICON_SIZE, ToastExpandedContent } from './ToastExpandedContent';
import { TransactionStatus } from '@/entities';

export function SwapToastExpandedContent({ toast }: { toast: RainbowToastSwap }) {
  const { transaction } = toast;

  const title = useSwapToastNetworkLabel({ toast });
  const subtitle = getSwapToastStatusLabel({ toast });

  const icon = (
    <View style={{ marginLeft: toast.status === TransactionStatus.swapped ? 0 : -(SWAP_ICON_WIDTH - EXPANDED_ICON_SIZE) / 2 }}>
      <SwapToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />
    </View>
  );

  return <ToastExpandedContent icon={icon} statusLabel={subtitle} label={title} transaction={transaction} />;
}
