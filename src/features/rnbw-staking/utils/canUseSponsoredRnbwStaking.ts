import { isRainbowDelegatedForChain } from '@/features/delegation/utils/isRainbowDelegatedForChain';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { type ChainId } from '@/state/backendNetworks/types';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';
import { type Address } from 'viem';

export async function canUseSponsoredRnbwStaking(address: Address, chainId: ChainId): Promise<boolean> {
  const wallet = getWalletWithAccount(address);

  if (wallet?.type === EthereumWalletType.bluetooth) {
    return false;
  }

  return isRainbowDelegatedForChain(address, chainId);
}
