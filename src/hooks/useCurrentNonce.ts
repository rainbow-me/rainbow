import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import { AppState } from '@rainbow-me/redux/store';
import logger from 'logger';

export default function useCurrentNonce(account: string, network: string) {
  const nonceInState = useSelector((state: AppState) => {
    return state.nonceManager[account.toLowerCase()]?.[network]?.nonce;
  });
  const getNextNonce = useCallback(async () => {
    const provider = await getProviderForNetwork(network);
    const transactionCount = await provider.getTransactionCount(
      account,
      'pending'
    );
    const transactionIndex = transactionCount - 1;
    const nextNonceBase =
      !nonceInState || transactionIndex > nonceInState
        ? transactionIndex
        : nonceInState;
    const nextNonce = nextNonceBase + 1;

    logger.log('Use current nonce: ', {
      account,
      network,
      nextNonce,
      nonceInState,
      transactionCount,
    });

    return nextNonce;
  }, [account, network, nonceInState]);

  return getNextNonce;
}
