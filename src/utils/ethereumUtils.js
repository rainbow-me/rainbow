import { Wallet } from '@ethersproject/wallet';
import AsyncStorage from '@react-native-community/async-storage';
import { captureException } from '@sentry/react-native';
import { mnemonicToSeed } from 'bip39';
import { parse } from 'eth-url-parser';
import {
  addHexPrefix,
  isValidAddress,
  toChecksumAddress,
} from 'ethereumjs-util';

import { hdkey } from 'ethereumjs-wallet';
import {
  find,
  isEmpty,
  isString,
  matchesProperty,
  replace,
  toLower,
} from 'lodash';

import {
  Alert,
  InteractionManager,
  Linking,
  NativeModules,
} from 'react-native';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import { useSelector } from 'react-redux';
import URL from 'url-parse';
import { getOnchainAssetBalance } from '@rainbow-me/handlers/assets';
import { getProviderForNetwork, isTestnet } from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToPercentageDisplay,
  convertRawAmountToDecimalFormat,
  delay,
  fromWei,
  greaterThan,
  isZero,
  subtract,
} from '@rainbow-me/helpers/utilities';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import {
  DEFAULT_HD_PATH,
  identifyWalletType,
  WalletLibraryType,
} from '@rainbow-me/model/wallet';
import { Navigation } from '@rainbow-me/navigation';
import { parseAssetsNative } from '@rainbow-me/parsers';
import store from '@rainbow-me/redux/store';
import {
  ARBITRUM_BLOCK_EXPLORER_URL,
  ARBITRUM_ETH_ADDRESS,
  chains,
  ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_BLOCK_EXPLORER_URL,
  OPTIMISM_ETH_ADDRESS,
  POLYGON_BLOCK_EXPLORER_URL,
} from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const { RNBip39 } = NativeModules;

const getNativeAssetAddressForNetwork = network => {
  let nativeAssetAddress;
  switch (network) {
    case networkTypes.arbitrum:
      nativeAssetAddress = ARBITRUM_ETH_ADDRESS;
      break;
    case networkTypes.optimism:
      nativeAssetAddress = OPTIMISM_ETH_ADDRESS;
      break;
    case networkTypes.polygon:
      nativeAssetAddress = MATIC_POLYGON_ADDRESS;
      break;
    default:
      nativeAssetAddress = ETH_ADDRESS;
  }
  return nativeAssetAddress;
};

const getNativeAssetForNetwork = async (network, address) => {
  const nativeAssetAddress = getNativeAssetAddressForNetwork(network);
  const { accountAddress } = store.getState().settings;
  let differentWallet = toLower(address) !== toLower(accountAddress);
  const { assets } = store.getState().data;
  let nativeAsset =
    !differentWallet && getAsset(assets, toLower(nativeAssetAddress));

  // If the asset is on a different wallet, or not available in this wallet
  if (differentWallet || !nativeAsset) {
    const { genericAssets } = store.getState().data;
    const mainnetAddress =
      network === networkTypes.polygon ? MATIC_MAINNET_ADDRESS : ETH_ADDRESS;
    nativeAsset = genericAssets[mainnetAddress];

    if (network === networkTypes.polygon) {
      nativeAsset.mainnet_address = mainnetAddress;
      nativeAsset.address = MATIC_POLYGON_ADDRESS;
    }

    const provider = await getProviderForNetwork(network);
    const balance = await getOnchainAssetBalance(
      nativeAsset,
      address,
      network,
      provider
    );

    const assetWithBalance = {
      ...nativeAsset,
      balance,
    };

    return assetWithBalance;
  }
  return nativeAsset;
};

const getAsset = (assets, address = 'eth') =>
  find(assets, matchesProperty('address', toLower(address)));

const getAssetPrice = (address = ETH_ADDRESS) => {
  const { assets, genericAssets } = store.getState().data;
  const genericPrice = genericAssets[address]?.price?.value;
  return genericPrice || getAsset(assets, address)?.price?.value || 0;
};

export const useEth = () => {
  return useSelector(
    ({
      data: {
        genericAssets: { [ETH_ADDRESS]: asset },
      },
    }) => asset
  );
};

export const useEthUSDPrice = () => {
  return useSelector(({ data: { ethUSDPrice } }) => ethUSDPrice);
};

export const useEthUSDMonthChart = () => {
  return useSelector(({ charts: { chartsEthUSDMonth } }) => chartsEthUSDMonth);
};

const getPriceOfNativeAssetForNetwork = network => {
  return network === networkTypes.polygon
    ? getMaticPriceUnit()
    : getEthPriceUnit();
};

const getEthPriceUnit = () => getAssetPrice();

const getMaticPriceUnit = () => getAssetPrice(MATIC_MAINNET_ADDRESS);

const getBalanceAmount = (selectedGasPrice, selected) => {
  const { assets } = store.getState().data;
  let amount =
    selected?.balance?.amount ??
    getAsset(assets, selected?.address)?.balance?.amount ??
    0;

  if (selected?.address === ETH_ADDRESS) {
    if (!isEmpty(selectedGasPrice)) {
      const txFeeRaw = selectedGasPrice?.txFee?.value?.amount;
      const txFeeAmount = fromWei(txFeeRaw);
      const remaining = subtract(amount, txFeeAmount);
      amount = greaterThan(remaining, 0) ? remaining : '0';
    }
  }
  return amount;
};

const getHash = txn => txn.hash.split('-').shift();

const formatGenericAsset = (asset, nativeCurrency) => {
  return {
    ...asset,
    native: {
      change: asset?.price?.relative_change_24h
        ? convertAmountToPercentageDisplay(
            `${asset?.price?.relative_change_24h}`
          )
        : '',
      price: convertAmountAndPriceToNativeDisplay(
        1,
        asset?.price?.value,
        nativeCurrency
      ),
    },
  };
};

export const checkWalletEthZero = assets => {
  const ethAsset = find(assets, asset => asset.address === ETH_ADDRESS);
  let amount = ethAsset?.balance?.amount ?? 0;
  return isZero(amount);
};

/**
 * @desc remove hex prefix
 * @param  {String} hex
 * @return {String}
 */
const removeHexPrefix = hex => replace(toLower(hex), '0x', '');

/**
 * @desc pad string to specific width and padding
 * @param  {String} n
 * @param  {Number} width
 * @param  {String} z
 * @return {String}
 */
const padLeft = (n, width, z = '0') => {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

/**
 * @desc get ethereum contract call data string
 * @param  {String} func
 * @param  {Array}  arrVals
 * @return {String}
 */
const getDataString = (func, arrVals) => {
  let val = '';
  for (let i = 0; i < arrVals.length; i++) val += padLeft(arrVals[i], 64);
  const data = func + val;
  return data;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
const getNetworkFromChainId = chainId => {
  const networkData = find(chains, ['chain_id', chainId]);
  return networkData?.network ?? networkTypes.mainnet;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
const getNetworkNameFromChainId = chainId => {
  const networkData = find(chains, ['chain_id', chainId]);
  return networkData?.name;
};

/**
 * @desc get chainId from network string
 * @param  {String} network
 */
const getChainIdFromNetwork = network => {
  const chainData = find(chains, ['network', network]);
  return chainData?.chain_id ?? 1;
};

/**
 * @desc get etherscan host from network string
 * @param  {String} network
 */
function getEtherscanHostForNetwork(network) {
  const base_host = 'etherscan.io';
  if (network === networkTypes.optimism) {
    return OPTIMISM_BLOCK_EXPLORER_URL;
  } else if (network === networkTypes.polygon) {
    return POLYGON_BLOCK_EXPLORER_URL;
  } else if (network === networkTypes.arbitrum) {
    return ARBITRUM_BLOCK_EXPLORER_URL;
  } else if (isTestnet(network)) {
    return `${network}.${base_host}`;
  } else {
    return base_host;
  }
}

/**
 * @desc Checks if a string is a valid ethereum address
 * @param  {String} str
 * @return {Boolean}
 */
const isEthAddress = str => {
  const withHexPrefix = addHexPrefix(str);
  return isValidAddress(withHexPrefix);
};

const fetchTxWithAlwaysCache = async address => {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&tag=oldest&page=1&offset=1&apikey=${ETHERSCAN_API_KEY}`;
  const cachedTxTime = await AsyncStorage.getItem(`first-tx-${address}`);
  if (cachedTxTime) {
    return cachedTxTime;
  }
  const response = await fetch(url);
  const parsedResponse = await response.json();
  const txTime = parsedResponse.result[0].timeStamp;
  AsyncStorage.setItem(`first-tx-${address}`, txTime);
  return txTime;
};

export const daysFromTheFirstTx = address => {
  return new Promise(async resolve => {
    try {
      if (address === 'eth') {
        resolve(1000);
        return;
      }
      const txTime = await fetchTxWithAlwaysCache(address);
      const daysFrom = Math.floor((Date.now() / 1000 - txTime) / 60 / 60 / 24);
      resolve(daysFrom);
    } catch (e) {
      resolve(1000);
    }
  });
};
/**
 * @desc Checks if a an address has previous transactions
 * @param  {String} address
 * @return {Promise<Boolean>}
 */
const hasPreviousTransactions = address => {
  return new Promise(async resolve => {
    try {
      const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&tag=latest&page=1&offset=1&apikey=${ETHERSCAN_API_KEY}`;
      const response = await fetch(url);
      const parsedResponse = await response.json();
      // Timeout needed to avoid the 5 requests / second rate limit of etherscan API
      setTimeout(() => {
        if (parsedResponse.status !== '0' && parsedResponse.result.length > 0) {
          resolve(true);
        }
        resolve(false);
      }, 260);
    } catch (e) {
      resolve(false);
    }
  });
};

const checkIfUrlIsAScam = async url => {
  try {
    const request = await fetch('https://api.cryptoscamdb.org/v1/scams');
    const { result } = await request.json();
    const { hostname } = new URL(url);
    const found = result.find(s => toLower(s.name) === toLower(hostname));
    if (found) {
      return true;
    }
    return false;
  } catch (e) {
    logger.sentry('Error fetching cryptoscamdb.org list');
    captureException(e);
  }
};

const deriveAccountFromMnemonic = async (mnemonic, index = 0) => {
  let seed;
  if (ios) {
    seed = await mnemonicToSeed(mnemonic);
  } else {
    const res = await RNBip39.mnemonicToSeed({ mnemonic, passphrase: null });
    seed = new Buffer(res, 'base64');
  }
  const hdWallet = hdkey.fromMasterSeed(seed);
  const root = hdWallet.derivePath(DEFAULT_HD_PATH);
  const child = root.deriveChild(index);
  const wallet = child.getWallet();
  return {
    address: toChecksumAddress(wallet.getAddress().toString('hex')),
    isHDWallet: true,
    root,
    type: WalletTypes.mnemonic,
    wallet,
    walletType: WalletLibraryType.bip39,
  };
};

const deriveAccountFromPrivateKey = privateKey => {
  const ethersWallet = new Wallet(addHexPrefix(privateKey));
  return {
    address: ethersWallet.address,
    isHDWallet: false,
    root: null,
    type: WalletTypes.privateKey,
    wallet: ethersWallet,
    walletType: WalletLibraryType.ethers,
  };
};

const deriveAccountFromWalletInput = input => {
  const type = identifyWalletType(input);
  if (type === WalletTypes.privateKey) {
    return deriveAccountFromPrivateKey(input);
  } else if (type === WalletTypes.readOnly) {
    const ethersWallet = { address: addHexPrefix(input), privateKey: null };
    return {
      address: addHexPrefix(input),
      isHDWallet: false,
      root: null,
      type: WalletTypes.readOnly,
      wallet: ethersWallet,
      walletType: WalletLibraryType.ethers,
    };
  }
  return deriveAccountFromMnemonic(input);
};

function getBlockExplorer(network) {
  switch (network) {
    case networkTypes.mainnet:
      return 'etherscan';
    case networkTypes.polygon:
      return 'polygonScan';
    case networkTypes.optimism:
      return 'etherscan';
    case networkTypes.arbitrum:
      return 'arbiscan';
    default:
      return 'etherscan';
  }
}

function openAddressInBlockExplorer(address, network) {
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(`https://${etherscanHost}/address/${address}`);
}

function openTokenEtherscanURL(address, network) {
  if (!isString(address)) return;
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(`https://${etherscanHost}/token/${address}`);
}

function openTransactionInBlockExplorer(hash, network) {
  const normalizedHash = hash.replace(/-.*/g, '');
  if (!isString(hash)) return;
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
}

async function parseEthereumUrl(data) {
  let ethUrl;
  try {
    ethUrl = parse(data);
  } catch (e) {
    Alert.alert('Invalid ethereum url');
    return;
  }

  const functionName = ethUrl.function_name;
  let asset = null;
  const network = getNetworkFromChainId(Number(ethUrl.chain_id || 1));
  let address = null;
  let nativeAmount = null;
  const { nativeCurrency } = store.getState().settings;

  while (store.getState().data.isLoadingAssets) {
    await delay(300);
  }
  const { assets } = store.getState().data;

  if (!functionName) {
    // Send native asset
    const nativeAssetAddress = getNativeAssetAddressForNetwork(network);
    asset = getAsset(assets, toLower(nativeAssetAddress));

    if (!asset || asset?.balance.amount === 0) {
      Alert.alert(
        'Ooops!',
        `Looks like you don't have that asset in your wallet...`
      );
      return;
    }
    address = ethUrl.target_address;
    nativeAmount = ethUrl.parameters?.value && fromWei(ethUrl.parameters.value);
  } else if (functionName === 'transfer') {
    // Send ERC-20
    asset = getAsset(assets, toLower(ethUrl.target_address));
    if (!asset || asset?.balance.amount === 0) {
      Alert.alert(
        'Ooops!',
        `Looks like you don't have that asset in your wallet...`
      );
      return;
    }
    address = ethUrl.parameters?.address;
    nativeAmount =
      ethUrl.parameters?.uint256 &&
      convertRawAmountToDecimalFormat(
        ethUrl.parameters.uint256,
        asset.decimals
      );
  } else {
    Alert.alert('This action is currently not supported :(');
    return;
  }

  const assetWithPrice = parseAssetsNative([asset], nativeCurrency)[0];

  InteractionManager.runAfterInteractions(() => {
    const params = { address, asset: assetWithPrice, nativeAmount };
    if (isNativeStackAvailable || android) {
      Navigation.handleAction(Routes.SEND_FLOW, {
        params,
        screen: Routes.SEND_SHEET,
      });
    } else {
      Navigation.handleAction(Routes.SEND_FLOW, params);
    }
  });
}

export default {
  checkIfUrlIsAScam,
  deriveAccountFromMnemonic,
  deriveAccountFromPrivateKey,
  deriveAccountFromWalletInput,
  formatGenericAsset,
  getAsset,
  getAssetPrice,
  getBalanceAmount,
  getBlockExplorer,
  getChainIdFromNetwork,
  getDataString,
  getEtherscanHostForNetwork,
  getEthPriceUnit,
  getHash,
  getMaticPriceUnit,
  getNativeAssetForNetwork,
  getNetworkFromChainId,
  getNetworkNameFromChainId,
  getPriceOfNativeAssetForNetwork,
  hasPreviousTransactions,
  isEthAddress,
  openAddressInBlockExplorer,
  openTokenEtherscanURL,
  openTransactionInBlockExplorer,
  padLeft,
  parseEthereumUrl,
  removeHexPrefix,
};
