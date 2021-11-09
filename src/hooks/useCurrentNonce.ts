import { useSelector } from 'react-redux';
import { getTransactionCount } from '@rainbow-me/handlers/web3';
import { AppState } from '@rainbow-me/redux/store';

export default async function useCurrentNonce(
  account: string,
  network: string
) {
  const currentNonce = useSelector((state: AppState) => {
    return state.nonceManager[account.toLowerCase()]?.[network]?.nonce;
  });
  const freshNonce = await getTransactionCount(account);
  return !currentNonce || freshNonce > currentNonce ? freshNonce : currentNonce;
}
