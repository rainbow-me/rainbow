import { SWAP_ICON_WIDTH } from '@/components/rainbow-toast/constants';
import { getSwapToastStatusLabel, useSwapToastNetworkLabel } from '@/components/rainbow-toast/SwapToastContent';
import { SwapToastIcon } from '@/components/rainbow-toast/SwapToastIcon';
import { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';
import { View } from 'react-native';
import { EXPANDED_ICON_SIZE, ToastExpandedContent } from './ToastExpandedContent';

export function SwapToastExpandedContent({ toast }: { toast: RainbowToastSwap }) {
  const { transaction } = toast;

  const title = useSwapToastNetworkLabel({ toast });
  const subtitle = getSwapToastStatusLabel({ toast });
  const isSwapped = toast.status === TransactionStatus.swapped;
  const isLoading = !isSwapped;

  return (
    <ToastExpandedContent
      isLoading={isLoading}
      icon={
        <View style={{ marginLeft: isSwapped ? 0 : -(SWAP_ICON_WIDTH - EXPANDED_ICON_SIZE) / 2 }}>
          <SwapToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />
        </View>
      }
      statusLabel={subtitle}
      label={title}
      transaction={transaction}
    />
  );
}
