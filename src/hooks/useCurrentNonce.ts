import { useSelector } from 'react-redux';
import { getTransactionCount } from '@rainbow-me/handlers/web3';
import { AppState } from '@rainbow-me/redux/store';
import logger from 'logger';

export default async function useCurrentNonce(
  account: string,
  network: string
) {
  try {
    const currentNonce = useSelector((state: AppState) => {
      return state.nonceManager[account.toLowerCase()]?.[network]?.nonce;
    });
    const freshNonce = await getTransactionCount(account);
    return freshNonce > currentNonce ? freshNonce : currentNonce;
  } catch (e) {
    logger.log('useCurrentNonce Error: ', e);
  }
}
