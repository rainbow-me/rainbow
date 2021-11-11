import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import logger from 'logger';

export default function useCurrentNonce(account: string, network: string) {
  const nonce = useSelector((state: AppState) => {
    return state.nonceManager[account.toLowerCase()]?.[network]?.nonce;
  });
  logger.log('Using current nonce: ', {
    account,
    network,
    nonce,
  });
  const getMostRecentNonce = (
    transactionCount: number,
    currentNonce?: number
  ) => {
    return !currentNonce || transactionCount > currentNonce
      ? transactionCount
      : currentNonce;
  };
  return [nonce, getMostRecentNonce];
}
