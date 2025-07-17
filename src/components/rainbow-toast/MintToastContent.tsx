import { MintToastIcon } from '@/components/rainbow-toast/MintToastIcon';
import { ToastContent } from '@/components/rainbow-toast/ToastContent';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';

export function MintToastContent({ toast }: { toast: RainbowToastMint }) {
  const icon = <MintToastIcon toast={toast} />;
  const title = toast.status === TransactionStatus.minting || toast.status === TransactionStatus.pending ? 'Minting' : 'Minted';
  const subtitle = toast.name;
  return <ToastContent icon={icon} title={title} subtitle={subtitle} />;
}
