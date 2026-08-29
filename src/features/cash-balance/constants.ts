import { ChainId } from '@/features/network/types/backendNetworks';

export const CASH_BALANCE_COLORS = {
  icon: '#08B44F',
  iconBorder: '#0FAE52',
  addButton: '#00BB3E',
  addButtonGradient: ['#22D185', '#00BB3E'] as const,
};

export const CASH_BALANCE_USDC_BY_CHAIN_ID: Partial<Record<ChainId, { address: string }>> = {
  [ChainId.base]: { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
};
