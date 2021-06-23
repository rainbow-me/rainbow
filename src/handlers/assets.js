import { Contract } from '@ethersproject/contracts';
import {
  convertAmountToBalanceDisplay,
  convertRawAmountToDecimalFormat,
} from '../helpers/utilities';
import { erc20ABI } from '../references';
import { getProviderForNetwork } from './web3';

export async function getOnchainAssetBalance(
  { address, decimals, symbol },
  userAddress,
  network
) {
  if (address !== 'eth') {
    return getOnchainTokenBalance(
      { address, decimals, symbol },
      userAddress,
      network
    );
  }
  return getOnchainNativeAssetBalance(
    { address, decimals, symbol },
    userAddress,
    network
  );
}

async function getOnchainTokenBalance(
  { address, decimals, symbol },
  userAddress,
  network
) {
  try {
    const provider = getProviderForNetwork(network);
    const tokenContract = new Contract(address, erc20ABI, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    const tokenBalance = convertRawAmountToDecimalFormat(
      balance.toString(),
      decimals
    );
    const displayBalance = convertAmountToBalanceDisplay(tokenBalance, {
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

async function getOnchainNativeAssetBalance(
  { address, decimals, symbol },
  userAddress,
  network
) {
  try {
    const provider = getProviderForNetwork(network);
    const balance = await provider.getBalance(userAddress);
    const tokenBalance = convertRawAmountToDecimalFormat(
      balance.toString(),
      decimals
    );
    const displayBalance = convertAmountToBalanceDisplay(tokenBalance, {
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
