import { MintToastIcon } from '@/components/rainbow-toast/MintToastIcon';
import { EXPANDED_ICON_SIZE, ToastExpandedContent } from '@/components/rainbow-toast/ToastExpandedContent';
import type { RainbowToastMint } from '@/components/rainbow-toast/types';
import { TransactionStatus } from '@/entities';
import React from 'react';

export function MintToastExpandedContent({ toast }: { toast: RainbowToastMint }) {
  const icon = <MintToastIcon size={EXPANDED_ICON_SIZE} toast={toast} />;
  const title = toast.status === TransactionStatus.minting ? 'Minting' : 'Minted';
  const subtitle = toast.name;
  return <ToastExpandedContent icon={icon} label={title} statusLabel={subtitle} transaction={toast.transaction} />;
}
