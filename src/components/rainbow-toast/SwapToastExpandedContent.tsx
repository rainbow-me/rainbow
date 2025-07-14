import { getSwapToastStatusLabel, useSwapToastNetworkLabel } from '@/components/rainbow-toast/SwapToastContent';
import { SWAP_ICON_WIDTH, SwapToastIcon } from '@/components/rainbow-toast/SwapToastIcon';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { usePendingTransactionByHash } from '@/hooks/usePendingTransactions';
import React from 'react';
import { View } from 'react-native';
import { ToastExpandedAfterTransaction } from './ToastExpandedAfterTransaction';
import { ToastExpandedContent } from './ToastExpandedContent';

export function SwapToastExpandedContent({ toast }: { toast: RainbowToastSwap }) {
  const { transactionHash } = toast;
  const tx = usePendingTransactionByHash(transactionHash);

  const title = useSwapToastNetworkLabel({ toast });
  const subtitle = getSwapToastStatusLabel({ toast });

  const icon = (
    <View style={{ marginLeft: -(SWAP_ICON_WIDTH - 28) / 2 }}>
      <SwapToastIcon toast={toast} />
    </View>
  );
  const after = <ToastExpandedAfterTransaction topLabel="0.05 ETH" bottomLabel="- $92.50" />;

  if (!tx) {
    return null;
  }

  return <ToastExpandedContent icon={icon} statusLabel={subtitle} label={title} after={after} />;
}
