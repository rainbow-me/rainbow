import { SWAP_ICON_WIDTH, TOAST_ICON_SIZE } from '@/components/rainbow-toast/constants';
import { isWideSwapIcon, SwapToastIcon } from '@/components/rainbow-toast/SwapToastIcon';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastSwap } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import React from 'react';
import { Text } from 'react-native';

export function SwapToastContent({ toast }: { toast: RainbowToastSwap }) {
  const title = getSwapToastStatusLabel({ toast });
  const subtitle = getSwapToastNetworkLabel({ toast });
  return (
    <ToastContent
      iconWidth={isWideSwapIcon(toast) ? SWAP_ICON_WIDTH : TOAST_ICON_SIZE}
      type={toast.status === TransactionStatus.failed ? 'error' : undefined}
      icon={<SwapToastIcon toast={toast} />}
      title={title}
      subtitle={subtitle}
    />
  );
}

export const getSwapToastStatusLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  return toast.status === TransactionStatus.failed
    ? i18n.t(i18n.l.toasts.swap.failed)
    : toast.status === TransactionStatus.swapping
      ? i18n.t(i18n.l.toasts.swap.swapping)
      : i18n.t(i18n.l.toasts.swap.swapped);
};

export const getSwapToastNetworkLabel = ({ toast }: { toast: RainbowToastSwap }) => {
  return (
    <>
      {toast.fromAssetSymbol} <Text style={{ fontWeight: '200' }}>􀄫</Text> {toast.toAssetSymbol}
    </>
  );
};
