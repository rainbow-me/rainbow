import { Contract } from '@ethersproject/contracts';
import { toLower } from 'lodash';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  ARBITRUM_ETH_ADDRESS,
  erc20ABI,
  ETH_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
} from '@rainbow-me/references';
import {
  convertAmountToBalanceDisplay,
  convertRawAmountToDecimalFormat,
} from '@rainbow-me/utilities';

const nativeAssetsPerNetwork = {
  [networkTypes.arbitrum]: ARBITRUM_ETH_ADDRESS,
  [networkTypes.goerli]: ETH_ADDRESS,
  [networkTypes.kovan]: ETH_ADDRESS,
  [networkTypes.mainnet]: ETH_ADDRESS,
  [networkTypes.optimism]: OPTIMISM_ETH_ADDRESS,
  [networkTypes.polygon]: MATIC_POLYGON_ADDRESS,
  [networkTypes.ropsten]: ETH_ADDRESS,
};

export function isNativeAsset(address, network) {
  return toLower(nativeAssetsPerNetwork[network]) === toLower(address);
}

export async function getOnchainAssetBalance(
  { address, decimals, symbol },
  userAddress,
  network,
  provider
) {
  // Check if it's the native chain asset
  if (isNativeAsset(address, network)) {
    return getOnchainNativeAssetBalance(
      { address, decimals, symbol },
      userAddress,
      provider
    );
  }
  return getOnchainTokenBalance(
    { address, decimals, symbol },
    userAddress,
    provider
  );
}

async function getOnchainTokenBalance(
  { address, decimals, symbol },
  userAddress,
  provider
) {
  try {
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
  provider
) {
  try {
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
