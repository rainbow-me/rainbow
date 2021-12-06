import { useCallback } from 'react';
import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { EthereumAddress } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { getProviderForNetwork } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import { Network } from '@rainbow-me/helpers/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
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
