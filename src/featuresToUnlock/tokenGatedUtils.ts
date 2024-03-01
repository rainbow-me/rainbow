import { Contract } from '@ethersproject/contracts';
import { EthereumAddress } from '@/entities';
import { getProviderForNetwork } from '@/handlers/web3';
import { Network } from '@/helpers';
import { tokenGateCheckerAbi } from '@/references';

export type TokenGateCheckerNetwork =
  | Network.arbitrum
  | Network.zora
  | Network.optimism
  | Network.mainnet
  | Network.polygon
  | Network.bsc
  | Network.base;

const TOKEN_GATE_CHECKER_ADDRESS: Record<TokenGateCheckerNetwork, EthereumAddress> = {
  [Network.arbitrum]: '0x2a0332e28913a06fa924d40a3e2160f763010417',
  [Network.mainnet]: '0x47c9c137fc9aa5ccdbea707b0b27d52780565476',
  [Network.optimism]: '0x400a9f1bb1db80643c33710c2232a0d74ef5cff1',
  [Network.polygon]: '0x400a9f1bb1db80643c33710c2232a0d74ef5cff1',
  [Network.zora]: '0x12a39421c23f4d3f788c33f0f9281652ac4f909a',
  [Network.bsc]: '0x5a9d9ffbd5a22f2790af726550920b845c3a6b35',
  [Network.base]: '0x7edddf0b8e7471e0ebf0df67ad179598c0bef695',
};

export const checkIfWalletsOwnNft = async (
  tokenAddress: EthereumAddress[],
  network: TokenGateCheckerNetwork,
  walletsToCheck: EthereumAddress[]
) => {
  const p = await getProviderForNetwork(network);

  const contractInstance = new Contract(TOKEN_GATE_CHECKER_ADDRESS[network], tokenGateCheckerAbi, p);

  try {
    const found = contractInstance.areOwners(tokenAddress, walletsToCheck);
    return found;
  } catch (e) {
    return false;
  }
};
