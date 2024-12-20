import { Contract } from '@ethersproject/contracts';

import { erc20ABI } from '@/references';
import { convertAmountToBalanceDisplay, convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { isLowerCaseMatch } from '@/utils';
import { AddressOrEth } from '@/__swaps__/types/assets';

export function isNativeAsset(address: AddressOrEth | string, chainId: ChainId) {
  return isLowerCaseMatch(useBackendNetworksStore.getState().getChainsNativeAsset()[chainId].address, address);
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
