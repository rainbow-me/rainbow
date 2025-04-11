import { useWalletsStore } from '@/redux/wallets';

export default function useSelectedWallet() {
  return useWalletsStore(state => state.selected);
}
