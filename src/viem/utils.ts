import {
  Account,
  Hex,
  hexToBigInt,
  toHex,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import { getNetworkObj } from '@/networks';
import { Network } from '@/networks/types';
import { loadViemAccount } from '@/model/wallet';
import { secp256k1 } from '@noble/curves/secp256k1';

export type Signature = {
  r: Hex;
  s: Hex;
  v: bigint;
};

export function signatureToHex({ r, s, v }: Signature): Hex {
  return `0x${new secp256k1.Signature(
    hexToBigInt(r),
    hexToBigInt(s)
  ).toCompactHex()}${toHex(v).slice(2)}`;
}

export const getViemNetworkConfig = (network: Network) => {
  const networkObj = getNetworkObj(network);
  const transport = http(networkObj.rpc);
  return {
    chain: networkObj,
    transport,
  };
};

export const getPublicClientForNetwork = (network: Network) => {
  const config = getViemNetworkConfig(network);
  return createPublicClient(config);
};

export const getWalletClientForAddress = async (
  address: `0x${string}`,
  network: Network,
  account?: Account
) => {
  const config = getViemNetworkConfig(network);
  if (!account) {
    const viemAccount = await loadViemAccount(address);
    return createWalletClient({ ...config, account: viemAccount });
  }

  return createWalletClient({ ...config, account });
};
