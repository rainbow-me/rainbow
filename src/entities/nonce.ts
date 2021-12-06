import { EthereumAddress } from '.';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import { Network } from '@rainbow-me/helpers/networkTypes';

interface NetworkNonceInfo {
  nonce: number;
}

type AccountNonceInfo = Record<Network, NetworkNonceInfo>;

export interface NonceManager {
  // @ts-expect-error ts-migrate(1336) FIXME: An index signature parameter type cannot be a type... Remove this comment to see the full error message
  [key: EthereumAddress]: AccountNonceInfo;
}
