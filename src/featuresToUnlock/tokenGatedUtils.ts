import { Contract } from '@ethersproject/contracts';
import { EthereumAddress } from '@/entities';
import { getProviderForNetwork } from '@/handlers/web3';
import { Network } from '@/helpers';
import { tokenGateCheckerAbi } from '@/references';

const TOKEN_GATE_CHECKER_ADDRESS: Record<string, string> = {
  arbitrum: '0x2a0332e28913a06fa924d40a3e2160f763010417',
  mainnet: '0x47c9c137fc9aa5ccdbea707b0b27d52780565476',
  optimism: '0x400a9f1bb1db80643c33710c2232a0d74ef5cff1',
  polygon: '0x400a9f1bb1db80643c33710c2232a0d74ef5cff1',
};

export const checkIfWalletsOwnNft = async (
  tokenAddress: EthereumAddress[],
  network: Network,
  walletsToCheck: EthereumAddress[]
) => {
  const p = await getProviderForNetwork(network);

  const contractInstance = new Contract(
    TOKEN_GATE_CHECKER_ADDRESS[network],
    tokenGateCheckerAbi,
    p
  );

  try {
    const found = contractInstance.areOwners(tokenAddress, walletsToCheck);
    return found;
  } catch (e) {
    return false;
  }
};
