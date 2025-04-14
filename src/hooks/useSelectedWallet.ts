import { useWalletsStore } from '@/state/wallets/wallets';

export default function useSelectedWallet() {
  return useWalletsStore(state => state.selected);
}
