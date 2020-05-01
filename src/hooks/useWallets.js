import { useSelector } from 'react-redux';

export default function useWallets() {
  const wallets = useSelector(({ wallets }) => wallets);
  return wallets;
}
