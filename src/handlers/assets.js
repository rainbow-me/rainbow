import { Contract } from '@ethersproject/contracts';
import {
  convertAmountToBalanceDisplay,
  convertRawAmountToDecimalFormat,
} from '../helpers/utilities';
import {
  ARBITRUM_ETH_ADDRESS,
  erc20ABI,
  ETH_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
} from '../references';
import { getProviderForNetwork } from './web3';
import networkTypes from '@rainbow-me/helpers/networkTypes';

export async function getOnchainAssetBalance(
  { address, decimals, symbol },
  userAddress,
  network
) {
  // Check if it's the native chain asset
  if (
    address !== ETH_ADDRESS &&
    (network === networkTypes.mainnet ||
      network === networkTypes.ropsten ||
      network === networkTypes.kovan ||
      network === networkTypes.goerli) &&
    address !== MATIC_POLYGON_ADDRESS &&
    network === networkTypes.polygon &&
    address !== ARBITRUM_ETH_ADDRESS &&
    network === networkTypes.arbitrum &&
    address !== OPTIMISM_ETH_ADDRESS &&
    network === networkTypes.optimism
  ) {
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
    const provider = await getProviderForNetwork(network);
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
    const provider = await getProviderForNetwork(network);
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
