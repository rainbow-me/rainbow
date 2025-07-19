import { MintToastIcon } from '@/components/rainbow-toast/MintToastIcon';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import React from 'react';

export const getMintToastStatusLabel = (toast: RainbowToastMint) => {
  return toast.status === TransactionStatus.minting || toast.status === TransactionStatus.pending
    ? i18n.t(i18n.l.toasts.mint.minting)
    : toast.status === TransactionStatus.failed
      ? i18n.t(i18n.l.toasts.mint.failed)
      : i18n.t(i18n.l.toasts.mint.minted);
};

export function MintToastContent({ toast }: { toast: RainbowToastMint }) {
  const icon = <MintToastIcon toast={toast} />;

  const title = getMintToastStatusLabel(toast);
  const subtitle = toast.name;

  return (
    <ToastContent icon={icon} title={title} subtitle={subtitle} type={toast.status === TransactionStatus.failed ? 'error' : undefined} />
  );
}
