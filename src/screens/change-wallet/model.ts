import type { EthereumAddress } from '@/entities/wallet';

export enum AddressMenuAction {
  Edit = 'edit',
  Notifications = 'notifications',
  Remove = 'remove',
  Copy = 'copy',
  Settings = 'settings',
}

export type AddressMenuActionData = {
  address: string;
};

export type AddressItem = {
  id: EthereumAddress;
  address: EthereumAddress;
  color: number;
  emoji: string | undefined;
  isReadOnly: boolean;
  isLedger: boolean;
  isSelected: boolean;
  label: string;
  rowType: number;
  walletId: string;
  balance: string;
  image: string | null | undefined;
};
