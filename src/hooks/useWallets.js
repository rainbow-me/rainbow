import { useSelector } from 'react-redux';

export default function useWallets() {
  return useSelector(({ wallets }) => wallets);
}
