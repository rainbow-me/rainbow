import { Contract } from '@ethersproject/contracts';
import {
  convertAmountToBalanceDisplay,
  convertRawAmountToDecimalFormat,
} from '../helpers/utilities';
import { erc20ABI } from '../references';
import { web3Provider } from './web3';

export async function getOnchainAssetBalance(
  { address, decimals, symbol },
  userAddress
) {
  if (address !== 'eth') {
    return getOnchainTokenBalance({ address, decimals, symbol }, userAddress);
  }
  return getOnchainEtherBalance({ address, decimals, symbol }, userAddress);
}

async function getOnchainTokenBalance(
  { address, decimals, symbol },
  userAddress
) {
  try {
    const tokenContract = new Contract(address, erc20ABI, web3Provider);
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

async function getOnchainEtherBalance(
  { address, decimals, symbol },
  userAddress
) {
  try {
    const balance = await web3Provider.getBalance(userAddress);
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
