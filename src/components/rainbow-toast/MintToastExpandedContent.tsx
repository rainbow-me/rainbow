import { MintToastIcon } from '@/components/rainbow-toast/MintToastIcon';
import { ToastExpandedContent } from '@/components/rainbow-toast/ToastExpandedContent';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';

export function MintToastExpandedContent({ toast }: { toast: RainbowToastMint }) {
  const icon = <MintToastIcon toast={toast} />;
  const title = toast.status === TransactionStatus.minting ? 'Minting' : 'Minted';
  const subtitle = toast.name;
  return <ToastExpandedContent icon={icon} label={title} statusLabel={subtitle} />;
}
