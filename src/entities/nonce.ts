import { EthereumAddress } from '.';
import { Network } from '@/helpers/networkTypes';

interface NetworkNonceInfo {
  nonce: number;
}

type AccountNonceInfo = Record<Network, NetworkNonceInfo>;

export interface NonceManager {
  [key: EthereumAddress]: AccountNonceInfo;
}
