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
import networkTypes from '@rainbow-me/helpers/networkTypes';

const nativeAssetsPerNetwork = {
  [ARBITRUM_ETH_ADDRESS]: [networkTypes.arbitrum],
  [ETH_ADDRESS]: [
    networkTypes.mainnet,
    networkTypes.ropsten,
    networkTypes.kovan,
    networkTypes.goerli,
  ],
  [MATIC_POLYGON_ADDRESS]: [networkTypes.polygon],
  [OPTIMISM_ETH_ADDRESS]: [networkTypes.optimism],
};

export function isNativeAsset(address, network) {
  /* 
    check if an asset is native depending on
    the network & asset address
  */

  if (nativeAssetsPerNetwork[address]?.indexOf(network) !== -1) {
    return true;
  }
  return false;
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
