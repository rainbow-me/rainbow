import { BigNumberish } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { serialize } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import AsyncStorage from '@react-native-community/async-storage';
import { captureException } from '@sentry/react-native';
import { mnemonicToSeed } from 'bip39';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'eth-... Remove this comment to see the full error message
import { parse } from 'eth-url-parser';
import {
  addHexPrefix,
  isValidAddress,
  toChecksumAddress,
} from 'ethereumjs-util';
import { hdkey } from 'ethereumjs-wallet';
import { Contract } from 'ethers';
import { isEmpty, isString, replace, toLower } from 'lodash';
import {
  Alert,
  InteractionManager,
  Linking,
  NativeModules,
} from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import { useSelector } from 'react-redux';
import URL from 'url-parse';
import {
  EthereumAddress,
  GasFee,
  LegacySelectedGasFee,
  ParsedAddressAsset,
  RainbowTransaction,
  SelectedGasFee,
} from '@rainbow-me/entities';
import { getOnchainAssetBalance } from '@rainbow-me/handlers/assets';
import {
  getProviderForNetwork,
  isTestnetNetwork,
  toHex,
} from '@rainbow-me/handlers/web3';
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { Network } from '@rainbow-me/helpers/networkTypes';
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
import type {
  EthereumPrivateKey,
  EthereumWalletSeed,
} from '@rainbow-me/model/wallet';
import { Navigation } from '@rainbow-me/navigation';
import { parseAssetNative } from '@rainbow-me/parsers';
import store from '@rainbow-me/redux/store';
import {
  ARBITRUM_BLOCK_EXPLORER_URL,
  ARBITRUM_ETH_ADDRESS,
  chains,
  ETH_ADDRESS,
  ethUnits,
  MATIC_MAINNET_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_BLOCK_EXPLORER_URL,
  OPTIMISM_ETH_ADDRESS,
  optimismGasOracleAbi,
  OVM_GAS_PRICE_ORACLE,
  POLYGON_BLOCK_EXPLORER_URL,
} from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import logger from 'logger';

const { RNBip39 } = NativeModules;

const getNetworkNativeAsset = (
  network: Network
): ParsedAddressAsset | undefined => {
  let nativeAssetUniqueId;
  switch (network) {
    case Network.arbitrum:
      nativeAssetUniqueId = `${ARBITRUM_ETH_ADDRESS}_${network}`;
      break;
    case Network.optimism:
      nativeAssetUniqueId = `${OPTIMISM_ETH_ADDRESS}_${network}`;
      break;
    case Network.polygon:
      nativeAssetUniqueId = `${MATIC_POLYGON_ADDRESS}_${network}`;
      break;
    default:
      nativeAssetUniqueId = ETH_ADDRESS;
  }
  return getAccountAsset(nativeAssetUniqueId);
};

const getNativeAssetForNetwork = async (
  network: Network,
  address: EthereumAddress
): Promise<ParsedAddressAsset | undefined> => {
  const networkNativeAsset = getNetworkNativeAsset(network);
  const { accountAddress } = store.getState().settings;
  let differentWallet = toLower(address) !== toLower(accountAddress);
  let nativeAsset = (!differentWallet && networkNativeAsset) || undefined;

  // If the asset is on a different wallet, or not available in this wallet
  if (differentWallet || !nativeAsset || isTestnetNetwork(network)) {
    const mainnetAddress =
      network === Network.polygon ? MATIC_MAINNET_ADDRESS : ETH_ADDRESS;
    nativeAsset = store.getState().data?.genericAssets?.[mainnetAddress];

    const provider = await getProviderForNetwork(network);
    if (nativeAsset) {
      if (network === Network.polygon) {
        nativeAsset.mainnet_address = mainnetAddress;
        nativeAsset.address = MATIC_POLYGON_ADDRESS;
      }
      const balance = await getOnchainAssetBalance(
        nativeAsset,
        address,
        network,
        provider
      );

      if (balance) {
        const assetWithBalance = {
          ...nativeAsset,
          balance,
        };
        return assetWithBalance;
      }
    }
  }
  return nativeAsset;
};

const getAsset = (
  accountAssets: Record<string, ParsedAddressAsset>,
  uniqueId: EthereumAddress = ETH_ADDRESS
) => {
  const loweredUniqueId = toLower(uniqueId);
  return accountAssets[loweredUniqueId];
};

const getAccountAsset = (
  uniqueId: EthereumAddress
): ParsedAddressAsset | undefined => {
  const loweredUniqueId = toLower(uniqueId);
  const accountAsset = store.getState().data?.accountAssetsData?.[
    loweredUniqueId
  ];
  return accountAsset;
};

const getAssetPrice = (address: EthereumAddress = ETH_ADDRESS): number => {
  const genericAsset = store.getState().data?.genericAssets?.[address];
  const genericPrice = genericAsset?.price?.value;
  return genericPrice || getAccountAsset(address)?.price?.value || 0;
};

export const useEth = (): ParsedAddressAsset => {
  return useSelector(
    ({
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
      data: {
        genericAssets: { [ETH_ADDRESS]: asset },
      },
    }) => asset
  );
};

export const useNativeAssetForNetwork = (
  network: Network
): ParsedAddressAsset => {
  const address =
    network === Network.polygon ? MATIC_MAINNET_ADDRESS : ETH_ADDRESS;
  return useSelector(
    ({
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
      data: {
        genericAssets: { [address]: asset },
      },
    }) => asset
  );
};

export const useEthUSDPrice = (): number => {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  return useSelector(({ data: { ethUSDPrice } }) => ethUSDPrice);
};

export const useEthUSDMonthChart = (): number => {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'charts' does not exist on type 'DefaultR... Remove this comment to see the full error message
  return useSelector(({ charts: { chartsEthUSDMonth } }) => chartsEthUSDMonth);
};

const getPriceOfNativeAssetForNetwork = (network: Network) => {
  return network === Network.polygon ? getMaticPriceUnit() : getEthPriceUnit();
};

const getEthPriceUnit = () => getAssetPrice();

const getMaticPriceUnit = () => getAssetPrice(MATIC_MAINNET_ADDRESS);

const getBalanceAmount = (
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee,
  selected: ParsedAddressAsset
) => {
  const accountAsset = getAccountAsset(selected?.uniqueId);
  let amount = selected?.balance?.amount ?? accountAsset?.balance?.amount ?? 0;

  if (selected?.isNativeAsset) {
    if (!isEmpty(selectedGasFee)) {
      const gasFee = selectedGasFee?.gasFee as GasFee;
      const txFeeRaw =
        gasFee?.maxFee?.value.amount || gasFee?.estimatedFee?.value.amount;
      const txFeeAmount = fromWei(txFeeRaw);
      const remaining = subtract(amount, txFeeAmount);
      amount = greaterThan(remaining, 0) ? remaining : '0';
    }
  }
  return amount;
};

const getHash = (txn: RainbowTransaction) => txn.hash?.split('-').shift();

const formatGenericAsset = (
  asset: ParsedAddressAsset,
  nativeCurrency: string
) => {
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
        asset?.price?.value || 0,
        nativeCurrency
      ),
    },
  };
};

export const checkWalletEthZero = () => {
  const ethAsset = getAccountAsset(ETH_ADDRESS);
  let amount = ethAsset?.balance?.amount ?? 0;
  return isZero(amount);
};

/**
 * @desc remove hex prefix
 * @param  {String} hex
 * @return {String}
 */
const removeHexPrefix = (hex: string) => replace(toLower(hex), '0x', '');

/**
 * @desc pad string to specific width and padding
 * @param  {String} n
 * @param  {Number} width
 * @param  {String} z
 * @return {String}
 */
const padLeft = (n: string, width: number, z = '0') => {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

/**
 * @desc get ethereum contract call data string
 * @param  {String} func
 * @param  {Array}  arrVals
 * @return {String}
 */
const getDataString = (func: string, arrVals: string[]) => {
  let val = '';
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < arrVals.length; i++) val += padLeft(arrVals[i], 64);
  const data = func + val;
  return data;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
const getNetworkFromChainId = (chainId: number): Network => {
  const networkData = chains.find(chain => chain.chain_id === chainId);
  return (networkData?.network as Network) ?? Network.mainnet;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
const getNetworkNameFromChainId = (chainId: number): string | undefined => {
  const networkData = chains.find(chain => chain.chain_id === chainId);
  const networkName = networkInfo[networkData?.network ?? Network.mainnet].name;
  return networkName;
};

/**
 * @desc get chainId from network string
 * @param  {String} network
 */
const getChainIdFromNetwork = (network: Network): number => {
  const chainData = chains.find(chain => chain.network === network);
  return chainData?.chain_id ?? 1;
};

/**
 * @desc get etherscan host from network string
 * @param  {String} network
 */
function getEtherscanHostForNetwork(network: Network): string {
  const base_host = 'etherscan.io';
  if (network === Network.optimism) {
    return OPTIMISM_BLOCK_EXPLORER_URL;
  } else if (network === Network.polygon) {
    return POLYGON_BLOCK_EXPLORER_URL;
  } else if (network === Network.arbitrum) {
    return ARBITRUM_BLOCK_EXPLORER_URL;
  } else if (isTestnetNetwork(network)) {
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
const isEthAddress = (str: string) => {
  const withHexPrefix = addHexPrefix(str);
  return isValidAddress(withHexPrefix);
};

const fetchTxWithAlwaysCache = async (address: EthereumAddress) => {
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

export const daysFromTheFirstTx = (address: EthereumAddress) => {
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
const hasPreviousTransactions = (
  address: EthereumAddress
): Promise<boolean> => {
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

const checkIfUrlIsAScam = async (url: string) => {
  try {
    const { hostname } = new URL(url);
    const exceptions = ['twitter.com'];
    if (exceptions.includes(toLower(hostname))) {
      return false;
    }
    const request = await fetch('https://api.cryptoscamdb.org/v1/scams');
    const { result } = await request.json();
    const found = result.find(
      (s: any) => toLower(s.name) === toLower(hostname)
    );
    if (found) {
      return true;
    }
    return false;
  } catch (e) {
    logger.sentry('Error fetching cryptoscamdb.org list');
    captureException(e);
  }
};

const deriveAccountFromMnemonic = async (mnemonic: string, index = 0) => {
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

const deriveAccountFromPrivateKey = (privateKey: EthereumPrivateKey) => {
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

const deriveAccountFromWalletInput = (input: EthereumWalletSeed) => {
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

function getBlockExplorer(network: Network) {
  switch (network) {
    case Network.mainnet:
      return 'etherscan';
    case Network.polygon:
      return 'polygonscan';
    case Network.optimism:
      return 'etherscan';
    case Network.arbitrum:
      return 'arbiscan';
    default:
      return 'etherscan';
  }
}

function openAddressInBlockExplorer(
  address: EthereumAddress,
  network: Network
) {
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(`https://${etherscanHost}/address/${address}`);
}

function openTokenEtherscanURL(address: EthereumAddress, network: Network) {
  if (!isString(address)) return;
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(`https://${etherscanHost}/token/${address}`);
}

function openNftInBlockExplorer(
  contractAddress: string,
  tokenId: string,
  network: Network
) {
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(
    `https://${etherscanHost}/token/${contractAddress}?a=${tokenId}`
  );
}

function openTransactionInBlockExplorer(hash: string, network: Network) {
  const normalizedHash = hash.replace(/-.*/g, '');
  if (!isString(hash)) return;
  const etherscanHost = getEtherscanHostForNetwork(network);
  Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
}

async function parseEthereumUrl(data: string) {
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
  let address: any = null;
  let nativeAmount: any = null;
  const { nativeCurrency } = store.getState().settings;

  while (store.getState().data.isLoadingAssets) {
    await delay(300);
  }

  if (!functionName) {
    // Send native asset
    asset = getNetworkNativeAsset(network);

    // @ts-ignore
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
    const targetUniqueId = getUniqueId(ethUrl.target_address, network);
    asset = getAccountAsset(targetUniqueId);
    // @ts-ignore
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

  const assetWithPrice = parseAssetNative(asset, nativeCurrency);

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

const getUniqueId = (address: EthereumAddress, network: Network) =>
  network === Network.mainnet ? address : `${address}_${network}`;

const calculateL1FeeOptimism = async (
  tx: RainbowTransaction,
  provider: Provider
): Promise<BigNumberish | undefined> => {
  try {
    if (tx.value) {
      tx.value = toHex(tx.value);
    }
    if (tx.from) {
      tx.nonce = Number(await provider.getTransactionCount(tx.from));
    }
    // @ts-expect-error ts-migrate(100005) FIXME: Remove this comment to see the full error message
    delete tx.from;
    // @ts-expect-error ts-migrate(100006) FIXME: Remove this comment to see the full error message
    delete tx.gas;
    if (tx.to) {
      tx.to = toChecksumAddress(tx.to);
    }
    if (tx.gasLimit) {
      tx.gasLimit = toHex(tx.gasLimit);
    } else {
      tx.gasLimit = toHex(
        tx.data === '0x' ? ethUnits.basic_tx : ethUnits.basic_transfer
      );
    }
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'selectedGasPrice' does not exist on type... Remove this comment to see the full error message
    const currentGasPrice = store.getState().gas.selectedGasPrice?.value
      ?.amount;
    if (currentGasPrice) tx.gasPrice = toHex(currentGasPrice);
    // @ts-expect-error ts-migrate(100005) FIXME: Remove this comment to see the full error message
    const serializedTx = serialize(tx);

    const OVM_GasPriceOracle = new Contract(
      OVM_GAS_PRICE_ORACLE,
      optimismGasOracleAbi,
      provider
    );
    const l1FeeInWei = await OVM_GasPriceOracle.getL1Fee(serializedTx);
    return l1FeeInWei;
  } catch (e) {
    logger.log('error calculating l1 fee', e);
  }
};

export default {
  calculateL1FeeOptimism,
  checkIfUrlIsAScam,
  deriveAccountFromMnemonic,
  deriveAccountFromPrivateKey,
  deriveAccountFromWalletInput,
  formatGenericAsset,
  getAccountAsset,
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
  getNetworkNativeAsset,
  getPriceOfNativeAssetForNetwork,
  getUniqueId,
  hasPreviousTransactions,
  isEthAddress,
  openAddressInBlockExplorer,
  openNftInBlockExplorer,
  openTokenEtherscanURL,
  openTransactionInBlockExplorer,
  padLeft,
  parseEthereumUrl,
  removeHexPrefix,
};
