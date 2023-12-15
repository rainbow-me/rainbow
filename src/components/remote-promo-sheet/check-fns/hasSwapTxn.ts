import type { EthereumAddress, RainbowTransaction } from '@/entities';
import store from '@/redux/store';

// Rainbow Router
const RAINBOW_ROUTER_ADDRESS: EthereumAddress =
  '0x00000000009726632680fb29d3f7a9734e3010e2';

const isSwapTx = (tx: RainbowTransaction): boolean =>
  tx.to?.toLowerCase() === RAINBOW_ROUTER_ADDRESS;

export const hasSwapTxn = async (): Promise<boolean> => {
  const { transactions } = store.getState().data;

  if (!transactions.length) return false;

  return !!transactions.find(isSwapTx);
};
