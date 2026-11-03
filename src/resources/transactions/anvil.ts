import { Platform } from 'react-native';

import { createPublicClient, http, type Chain } from 'viem';
import { foundry } from 'viem/chains';

import { type RainbowTransaction } from '@/entities/transactions';
import { IS_TEST } from '@/env';

const ANVIL_RPC_URL = IS_TEST && Platform.OS === 'android' ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';

export const anvilChain = {
  ...foundry,
  id: 1337,
  name: 'Ethereum',
  network: 'ethereum',
  rpcUrls: {
    public: { http: [ANVIL_RPC_URL] },
    default: { http: [ANVIL_RPC_URL] },
  },
} satisfies Chain & { network: string };

export const anvilPublicClient = IS_TEST
  ? createPublicClient({
      chain: anvilChain,
      transport: http(ANVIL_RPC_URL),
    })
  : null;

export const anvilConfirmedTransactions: RainbowTransaction[] = [];
