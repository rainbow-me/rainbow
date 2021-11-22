import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { EthereumAddress } from '@rainbow-me/entities';
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { AppState } from '@rainbow-me/redux/store';
import logger from 'logger';

export default function useCurrentNonce(
  accountAddress: EthereumAddress,
  network: Network
) {
  const nonceInState = useSelector((state: AppState) => {
    return state.nonceManager[accountAddress.toLowerCase()]?.[network]?.nonce;
  });
  const getNextNonce = useCallback(async () => {
    try {
      const provider = await getProviderForNetwork(network);
      const transactionCount = await provider.getTransactionCount(
        accountAddress,
        'pending'
      );
      const transactionIndex = transactionCount - 1;
      const nextNonceBase =
        !nonceInState || transactionIndex > nonceInState
          ? transactionIndex
          : nonceInState;
      const nextNonce = nextNonceBase + 1;

      logger.log('Use current nonce: ', {
        accountAddress,
        network,
        nextNonce,
        nonceInState,
        transactionCount,
      });

      return nextNonce;
    } catch (e) {
      logger.log('Error determining next nonce: ', e);
      return null;
    }
  }, [accountAddress, network, nonceInState]);

  return getNextNonce;
}
