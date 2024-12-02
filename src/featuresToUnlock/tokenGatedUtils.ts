import { Contract } from '@ethersproject/contracts';
import { EthereumAddress } from '@/entities';
import { getProvider } from '@/handlers/web3';
import { tokenGateCheckerAbi } from '@/references';
import { Network } from '@/chains/types';
import { chainsIdByName } from '@/chains';

export type TokenGateCheckerNetwork =
  | Network.arbitrum
  | Network.zora
  | Network.optimism
  | Network.mainnet
  | Network.polygon
  | Network.bsc
  | Network.base
  | Network.gnosis
  | Network.avalanche;
const TOKEN_GATE_CHECKER_ADDRESS: Record<TokenGateCheckerNetwork, EthereumAddress> = {
  [Network.arbitrum]: '0x5A9D9FFBd5a22f2790AF726550920B845c3A6B35',
  [Network.mainnet]: '0xc4A8619B3980d84F6d59d416d415007A1217fEc8',
  [Network.optimism]: '0x5A9D9FFBd5a22f2790AF726550920B845c3A6B35',
  [Network.polygon]: '0x3e3937C119BD854059844D3D03A8116a18Afa409',
  [Network.zora]: '0x75efed6B8AF6B0490c2899e489c58EF26E3D0898',
  [Network.bsc]: '0x50a42aB85A09e24229e42dAd31Cb44B42E83b2De',
  [Network.base]: '0xa5d7b264ad7039F54A670c27Fe5A64CAd0FE0cCe',
  [Network.gnosis]: '0x2488F7B6FD1A0949391fE6a533D7E5c4704173E2',
  [Network.avalanche]: '0x2a0332E28913A06Fa924d40A3E2160f763010417',
};

export const checkIfWalletsOwnNft = async (
  tokenAddress: EthereumAddress[],
  network: TokenGateCheckerNetwork,
  walletsToCheck: EthereumAddress[]
) => {
  const p = await getProvider({ chainId: chainsIdByName[network] });

  const contractInstance = new Contract(TOKEN_GATE_CHECKER_ADDRESS[network], tokenGateCheckerAbi, p);

  try {
    const found = contractInstance.areOwners(tokenAddress, walletsToCheck);
    return found;
  } catch (e) {
    return false;
  }
};
