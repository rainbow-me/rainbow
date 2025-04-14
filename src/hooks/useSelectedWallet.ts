import { useWalletsStore } from '@/state/wallets/walletsStore';

export default function useSelectedWallet() {
  return useWalletsStore(state => state.selected);
}
