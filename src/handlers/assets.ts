import { Contract } from '@ethersproject/contracts';

import { erc20ABI } from '@/references';
import { convertAmountToBalanceDisplay, convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { getNetworkObject } from '@/networks';
import { ChainId } from '@/networks/types';

export function isNativeAsset(address: string, chainId: ChainId) {
  return getNetworkObject({ chainId }).nativeCurrency.address.toLowerCase() === address?.toLowerCase();
}

export async function getOnchainAssetBalance({ address, decimals, symbol }: any, userAddress: any, chainId: ChainId, provider: any) {
  // Check if it's the native chain asset
  if (isNativeAsset(address, chainId)) {
    return getOnchainNativeAssetBalance({ decimals, symbol }, userAddress, provider);
  }
  return getOnchainTokenBalance({ address, decimals, symbol }, userAddress, provider);
}

async function getOnchainTokenBalance({ address, decimals, symbol }: any, userAddress: any, provider: any) {
  try {
    const tokenContract = new Contract(address, erc20ABI, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    const tokenBalance = convertRawAmountToDecimalFormat(balance.toString(), decimals);
    const displayBalance = convertAmountToBalanceDisplay(tokenBalance, {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ address: any; decimals: any; s... Remove this comment to see the full error message
      address,
      decimals,
      symbol,
    });

    return {
      amount: tokenBalance,
      display: displayBalance,
    };
  } catch (e) {
    return null;
  }
}

async function getOnchainNativeAssetBalance({ decimals, symbol }: any, userAddress: any, provider: any) {
  try {
    const balance = await provider.getBalance(userAddress);
    const tokenBalance = convertRawAmountToDecimalFormat(balance.toString(), decimals);
    const displayBalance = convertAmountToBalanceDisplay(tokenBalance, {
      decimals,
      symbol,
    });

    return {
      amount: tokenBalance,
      display: displayBalance,
    };
  } catch (e) {
    return null;
  }
}
