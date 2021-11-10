import { useSelector } from 'react-redux';
import { getTransactionCount } from '@rainbow-me/handlers/web3';
import { AppState } from '@rainbow-me/redux/store';
import logger from 'logger';

export default async function useCurrentNonce(
  account: string,
  network: string
) {
  const currentNonce = useSelector((state: AppState) => {
    return state.nonceManager[account.toLowerCase()]?.[network]?.nonce;
  });
  const freshNonce = await getTransactionCount(account);
  logger.log('Using current nonce: ', {
    account,
    currentNonce,
    freshNonce,
    network,
  });
  return !currentNonce || freshNonce > currentNonce ? freshNonce : currentNonce;
}
