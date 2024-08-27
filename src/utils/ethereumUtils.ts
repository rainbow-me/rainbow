import { BigNumberish } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { serialize } from '@ethersproject/transactions';
import { RainbowAddressAssets } from '@/resources/assets/types';
import { userAssetsQueryKey } from '@/resources/assets/UserAssetsQuery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '@/react-query';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'eth-... Remove this comment to see the full error message
import { parse } from 'eth-url-parser';
import { addHexPrefix, isValidAddress, toChecksumAddress } from 'ethereumjs-util';
import { Contract } from '@ethersproject/contracts';
import lang from 'i18n-js';
import { cloneDeep, isEmpty, isString, replace } from 'lodash';
import { InteractionManager, Linking } from 'react-native';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import { WrappedAlert as Alert } from '@/helpers/alert';
import {
  EthereumAddress,
  GasFee,
  LegacySelectedGasFee,
  NewTransaction,
  ParsedAddressAsset,
  RainbowTransaction,
  SelectedGasFee,
} from '@/entities';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { getIsHardhatConnected, getProviderForNetwork, isTestnetNetwork, toHex } from '@/handlers/web3';
import { Network } from '@/helpers/networkTypes';
import { convertRawAmountToDecimalFormat, fromWei, greaterThan, isZero, subtract, add } from '@/helpers/utilities';
import { Navigation } from '@/navigation';
import { parseAssetNative } from '@/parsers';
import store from '@/redux/store';
import {
  ETH_ADDRESS,
  ethUnits,
  MATIC_MAINNET_ADDRESS,
  optimismGasOracleAbi,
  OVM_GAS_PRICE_ORACLE,
  BNB_MAINNET_ADDRESS,
  AVAX_AVALANCHE_ADDRESS,
  DEGEN_CHAIN_DEGEN_ADDRESS,
} from '@/references';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { IS_IOS } from '@/env';
import { RainbowNetworks, getNetworkObj, getNetworkObject } from '@/networks';
import {
  externalTokenQueryKey,
  FormattedExternalAsset,
  fetchExternalToken,
  useExternalToken,
} from '@/resources/assets/externalAssetsQuery';
import { ChainId } from '@/__swaps__/types/chains';

const getNetworkNativeAsset = (chainId: ChainId): ParsedAddressAsset | undefined => {
  const nativeAssetAddress = getNetworkObject({ chainId }).nativeCurrency.address;
  const nativeAssetUniqueId = getUniqueId(nativeAssetAddress, chainId);
  return getAccountAsset(nativeAssetUniqueId);
};

export const getNativeAssetForNetwork = async (chainId: ChainId, address?: EthereumAddress): Promise<ParsedAddressAsset | undefined> => {
  const network = getNetworkFromChainId(chainId);
  const networkNativeAsset = getNetworkNativeAsset(chainId);
  const { accountAddress, nativeCurrency } = store.getState().settings;
  const differentWallet = address?.toLowerCase() !== accountAddress?.toLowerCase();
  let nativeAsset = differentWallet ? undefined : networkNativeAsset;

  // If the asset is on a different wallet, or not available in this wallet
  if (differentWallet || !nativeAsset) {
    const mainnetAddress = getNetworkObject({ chainId })?.nativeCurrency?.mainnetAddress || ETH_ADDRESS;
    const nativeAssetAddress = getNetworkObject({ chainId }).nativeCurrency.address;

    const externalAsset = await queryClient.fetchQuery(
      externalTokenQueryKey({ address: nativeAssetAddress, chainId, currency: nativeCurrency }),
      async () => fetchExternalToken({ address: nativeAssetAddress, chainId, currency: nativeCurrency }),
      {
        staleTime: 60000,
      }
    );
    if (externalAsset) {
      // @ts-ignore
      nativeAsset = {
        ...externalAsset,
        network,
        uniqueId: getUniqueId(getNetworkObject({ chainId }).nativeCurrency.address, chainId),
        address: getNetworkObject({ chainId }).nativeCurrency.address,
        decimals: getNetworkObject({ chainId }).nativeCurrency.decimals,
        symbol: getNetworkObject({ chainId }).nativeCurrency.symbol,
      };
    }

    const provider = getProviderForNetwork(network);
    if (nativeAsset) {
      nativeAsset.mainnet_address = mainnetAddress;
      nativeAsset.address = getNetworkObject({ chainId }).nativeCurrency.address;

      const balance = await getOnchainAssetBalance(nativeAsset, address, network, provider);

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

const getAsset = (accountAssets: Record<string, ParsedAddressAsset>, uniqueId: EthereumAddress = ETH_ADDRESS) => {
  const loweredUniqueId = uniqueId.toLowerCase();
  return accountAssets[loweredUniqueId];
};

const getUserAssetFromCache = (uniqueId: string) => {
  const { accountAddress, nativeCurrency } = store.getState().settings;
  const connectedToHardhat = getIsHardhatConnected();

  const cache = queryClient.getQueryCache();

  const cachedAddressAssets = (cache.find(
    userAssetsQueryKey({
      address: accountAddress,
      currency: nativeCurrency,
      connectedToHardhat,
    })
  )?.state?.data || {}) as RainbowAddressAssets;
  return cachedAddressAssets?.[uniqueId];
};

const getExternalAssetFromCache = (uniqueId: string) => {
  const { nativeCurrency } = store.getState().settings;
  const { address, chainId } = getAddressAndChainIdFromUniqueId(uniqueId);

  try {
    const cachedExternalAsset = queryClient.getQueryData<FormattedExternalAsset>(
      externalTokenQueryKey({
        address,
        currency: nativeCurrency,
        chainId,
      })
    );

    return cachedExternalAsset;
  } catch (e) {
    console.log(e);
  }
};

const getAssetFromAllAssets = (uniqueId: EthereumAddress | undefined) => {
  const loweredUniqueId = uniqueId?.toLowerCase() ?? '';
  const accountAsset = getUserAssetFromCache(loweredUniqueId);
  const externalAsset = getExternalAssetFromCache(loweredUniqueId);
  return accountAsset ?? externalAsset;
};

const getAccountAsset = (uniqueId: EthereumAddress | undefined): ParsedAddressAsset | undefined => {
  const loweredUniqueId = uniqueId?.toLowerCase() ?? '';
  const accountAsset = getUserAssetFromCache(loweredUniqueId);
  return accountAsset;
};

const getAssetPrice = (address: EthereumAddress = ETH_ADDRESS): number => {
  const externalAsset = getExternalAssetFromCache(address);
  const genericPrice = externalAsset?.price?.value;
  return genericPrice || getAccountAsset(address)?.price?.value || 0;
};

export const useNativeAsset = ({ chainId }: { chainId: ChainId }) => {
  let address = getNetworkObject({ chainId }).nativeCurrency?.mainnetAddress || ETH_ADDRESS;
  let internalChainId = ChainId.mainnet;
  const { nativeCurrency } = store.getState().settings;
  if (chainId === ChainId.avalanche || chainId === ChainId.degen) {
    address = getNetworkObject({ chainId }).nativeCurrency?.address;
    internalChainId = chainId;
  }
  const { data: nativeAsset } = useExternalToken({
    address,
    chainId: internalChainId,
    currency: nativeCurrency,
  });

  return nativeAsset;
};

// anotha 1
const getPriceOfNativeAssetForNetwork = (network: Network) => {
  if (network === Network.polygon) {
    return getMaticPriceUnit();
  } else if (network === Network.bsc) {
    return getBnbPriceUnit();
  } else if (network === Network.avalanche) {
    return getAvaxPriceUnit();
  } else if (network === Network.degen) {
    return getDegenPriceUnit();
  }
  return getEthPriceUnit();
};

const getEthPriceUnit = () => getAssetPrice();

const getMaticPriceUnit = () => getAssetPrice(MATIC_MAINNET_ADDRESS);
const getBnbPriceUnit = () => getAssetPrice(BNB_MAINNET_ADDRESS);
const getAvaxPriceUnit = () => getAssetPrice(getUniqueId(AVAX_AVALANCHE_ADDRESS, ChainId.avalanche));
const getDegenPriceUnit = () => getAssetPrice(getUniqueId(DEGEN_CHAIN_DEGEN_ADDRESS, ChainId.degen));

const getBalanceAmount = (
  selectedGasFee: SelectedGasFee | LegacySelectedGasFee,
  selected: ParsedAddressAsset,
  l1GasFeeOptimism?: BigNumberish
) => {
  const accountAsset = getAccountAsset(selected?.uniqueId);
  let amount = selected?.balance?.amount ?? accountAsset?.balance?.amount ?? '0';
  if (selected?.isNativeAsset) {
    if (!isEmpty(selectedGasFee)) {
      const gasFee = selectedGasFee?.gasFee as GasFee;
      let txFeeRaw = gasFee?.maxFee?.value.amount || gasFee?.estimatedFee?.value.amount;
      if (l1GasFeeOptimism) {
        txFeeRaw = add(l1GasFeeOptimism.toString(), txFeeRaw);
      }
      const txFeeAmount = fromWei(txFeeRaw);

      const remaining = subtract(amount, txFeeAmount);
      amount = greaterThan(remaining, 0) ? remaining : '0';
    }
  }
  return amount;
};

const getHash = (txn: RainbowTransaction | NewTransaction) => txn.hash?.split('-').shift();

export const checkWalletEthZero = () => {
  const ethAsset = getAccountAsset(ETH_ADDRESS);
  const amount = ethAsset?.balance?.amount ?? 0;
  return isZero(amount);
};

/**
 * @desc remove hex prefix
 * @param  {String} hex
 * @return {String}
 */
const removeHexPrefix = (hex: string) => replace(hex.toLowerCase(), '0x', '');

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
export const getNetworkFromChainId = (chainId: ChainId): Network => {
  return RainbowNetworks.find(network => network.id === chainId)?.value || getNetworkObject({ chainId: ChainId.mainnet }).value;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
const getNetworkNameFromChainId = (chainId: ChainId): string => {
  return RainbowNetworks.find(network => network.id === chainId)?.name || getNetworkObject({ chainId: ChainId.mainnet }).name;
};

/**
 * @desc get chainId from network string
 * @param  {String} network
 */
const getChainIdFromNetwork = (network?: Network): ChainId => {
  return network ? getNetworkObj(network).id : ChainId.mainnet;
};

/**
 * @desc get etherscan host from network string
 * @param  {String} network
 */
function getEtherscanHostForNetwork(chainId: ChainId): string {
  const base_host = 'etherscan.io';
  const networkObject = getNetworkObject({ chainId });
  const blockExplorer = networkObject.blockExplorers?.default?.url;
  const network = networkObject.network as Network;

  if (network && isTestnetNetwork(network)) {
    return `${network}.${base_host}`;
  } else {
    return blockExplorer || base_host;
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

export const fetchContractABI = async (address: EthereumAddress) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
  const cachedAbi = await AsyncStorage.getItem(`abi-${address}`);
  if (cachedAbi) {
    return cachedAbi;
  }
  const response = await fetch(url);
  const parsedResponse = await response.json();
  const abi = parsedResponse.result;
  AsyncStorage.setItem(`abi-${address}`, abi);
  return abi;
};

/**
 * @desc Checks if a an address has previous transactions
 * @param  {String} address
 * @return {Promise<Boolean>}
 */
const hasPreviousTransactions = (address: EthereumAddress): Promise<boolean> => {
  return new Promise(async resolve => {
    try {
      const url = `https://aha.rainbow.me/?address=${address}`;
      const response = await fetch(url);

      if (!response.ok) {
        resolve(false);
        return;
      }

      const parsedResponse: {
        data: {
          addresses: Record<string, boolean>;
        };
      } = await response.json();

      resolve(parsedResponse?.data?.addresses[address.toLowerCase()] === true);
    } catch (e) {
      resolve(false);
    }
  });
};

/**
 * @desc Fetches the address' first transaction timestamp (in ms)
 * @param  {String} address
 * @return {Promise<number>}
 */
export const getFirstTransactionTimestamp = async (address: EthereumAddress): Promise<number | undefined> => {
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey=${ETHERSCAN_API_KEY}`;
  const response = await fetch(url);
  const parsedResponse = await response.json();
  const timestamp = parsedResponse.result[0]?.timeStamp;
  return timestamp ? timestamp * 1000 : undefined;
};

function getBlockExplorer(chainId: ChainId) {
  return getNetworkObject({ chainId }).blockExplorers?.default.name || 'etherscan';
}

function openAddressInBlockExplorer(address: EthereumAddress, chainId: ChainId) {
  const explorer = getNetworkObject({ chainId })?.blockExplorers?.default?.url;
  Linking.openURL(`${explorer}/address/${address}`);
}

function openTokenEtherscanURL(address: EthereumAddress, network: Network) {
  if (!isString(address)) return;
  const chainId = getChainIdFromNetwork(network);
  const explorer = getNetworkObject({ chainId })?.blockExplorers?.default?.url;
  Linking.openURL(`${explorer}/token/${address}`);
}

function openNftInBlockExplorer(contractAddress: string, tokenId: string, network: Network) {
  const chainId = getChainIdFromNetwork(network);
  const explorer = getNetworkObject({ chainId })?.blockExplorers?.default?.url;
  Linking.openURL(`${explorer}/token/${contractAddress}?a=${tokenId}`);
}

function openTransactionInBlockExplorer(hash: string, network: Network) {
  const normalizedHash = hash.replace(/-.*/g, '');
  if (!isString(hash)) return;
  const chainId = getChainIdFromNetwork(network);
  const explorer = getNetworkObject({ chainId })?.blockExplorers?.default?.url;
  Linking.openURL(`${explorer}/tx/${normalizedHash}`);
}

async function parseEthereumUrl(data: string) {
  let ethUrl;
  try {
    ethUrl = parse(data);
  } catch (e) {
    Alert.alert(lang.t('wallet.alerts.invalid_ethereum_url'));
    return;
  }

  const functionName = ethUrl.function_name;
  let asset = null;
  const chainId = (ethUrl.chain_id as ChainId) || ChainId.mainnet;
  const network = getNetworkFromChainId(chainId);
  let address: any = null;
  let nativeAmount: any = null;
  const { nativeCurrency } = store.getState().settings;

  if (!functionName) {
    // Send native asset
    const chainId = getChainIdFromNetwork(network);
    asset = getNetworkNativeAsset(chainId);

    // @ts-ignore
    if (!asset || asset?.balance.amount === 0) {
      Alert.alert(lang.t('wallet.alerts.ooops'), lang.t('wallet.alerts.dont_have_asset_in_wallet'));
      return;
    }
    address = ethUrl.target_address;
    nativeAmount = ethUrl.parameters?.value && fromWei(ethUrl.parameters.value);
  } else if (functionName === 'transfer') {
    // Send ERC-20
    const targetUniqueId = getUniqueId(ethUrl.target_address, chainId);
    asset = getAccountAsset(targetUniqueId);
    // @ts-ignore
    if (!asset || asset?.balance.amount === 0) {
      Alert.alert(lang.t('wallet.alerts.ooops'), lang.t('wallet.alerts.dont_have_asset_in_wallet'));
      return;
    }
    address = ethUrl.parameters?.address;
    nativeAmount = ethUrl.parameters?.uint256 && convertRawAmountToDecimalFormat(ethUrl.parameters.uint256, asset.decimals);
  } else {
    Alert.alert(lang.t('wallet.alerts.this_action_not_supported'));
    return;
  }

  const assetWithPrice = parseAssetNative(asset, nativeCurrency);

  InteractionManager.runAfterInteractions(() => {
    const params = { address, asset: assetWithPrice, nativeAmount };
    if (IS_IOS) {
      Navigation.handleAction(Routes.SEND_FLOW, {
        params,
        screen: Routes.SEND_SHEET,
      });
    } else {
      Navigation.handleAction(Routes.SEND_FLOW, params);
    }
  });
}

export const getUniqueIdNetwork = (address: EthereumAddress, network: Network) => `${address}_${network}`;

export const getUniqueId = (address: EthereumAddress, chainId: ChainId) => `${address}_${chainId}`;

export const getAddressAndChainIdFromUniqueId = (uniqueId: string): { address: EthereumAddress; chainId: ChainId } => {
  const parts = uniqueId.split('_');

  // If the unique ID does not contain '_', it's a mainnet address
  if (parts.length === 1) {
    return { address: parts[0], chainId: ChainId.mainnet };
  }

  // If the unique ID contains '_', the last part is the network and the rest is the address
  const network = parts[1] as Network; // Assuming the last part is a valid Network enum value
  const address = parts[0];
  const chainId = getChainIdFromNetwork(network);

  return { address, chainId };
};

const calculateL1FeeOptimism = async (tx: RainbowTransaction, provider: Provider): Promise<BigNumberish | undefined> => {
  const newTx = cloneDeep(tx);
  try {
    if (newTx.value) {
      newTx.value = toHex(newTx.value);
    }
    if (newTx.from) {
      newTx.nonce = Number(await provider.getTransactionCount(newTx.from));
    }

    // @ts-expect-error operand should be optional
    delete newTx?.from;
    // @ts-expect-error gas is not in type RainbowTransaction
    delete newTx?.gas;

    // contract call will fail if these are passed
    delete newTx.maxPriorityFeePerGas;
    delete newTx.maxFeePerGas;

    if (newTx.to) {
      newTx.to = toChecksumAddress(newTx.to);
    }
    if (newTx.gasLimit) {
      newTx.gasLimit = toHex(newTx.gasLimit);
    } else {
      newTx.gasLimit = toHex(newTx.data === '0x' ? ethUnits.basic_tx : ethUnits.basic_transfer);
    }
    // @ts-expect-error ts-migrate(2551) FIXME: Property 'selectedGasPrice' does not exist on type... Remove this comment to see the full error message
    const currentGasPrice = store.getState().gas.selectedGasPrice?.value?.amount;
    if (currentGasPrice) newTx.gasPrice = toHex(currentGasPrice);
    // @ts-expect-error ts-migrate(100005) FIXME: Remove this comment to see the full error message
    const serializedTx = serialize(newTx);

    const OVM_GasPriceOracle = new Contract(OVM_GAS_PRICE_ORACLE, optimismGasOracleAbi, provider);
    const l1FeeInWei = await OVM_GasPriceOracle.getL1Fee(serializedTx);
    return l1FeeInWei;
  } catch (e: any) {
    logger.error(new RainbowError(`[ethereumUtils]: error calculating l1 fee`), {
      message: e.message,
    });
  }
};

const getBasicSwapGasLimit = (chainId: ChainId) => {
  switch (chainId) {
    case getChainIdFromNetwork(Network.arbitrum):
      return ethUnits.basic_swap_arbitrum;
    case getChainIdFromNetwork(Network.polygon):
      return ethUnits.basic_swap_polygon;
    case getChainIdFromNetwork(Network.bsc):
      return ethUnits.basic_swap_bsc;
    case getChainIdFromNetwork(Network.optimism):
      return ethUnits.basic_swap_optimism;
    default:
      return ethUnits.basic_swap;
  }
};

export default {
  calculateL1FeeOptimism,
  getAssetFromAllAssets,
  getAccountAsset,
  getAsset,
  getAssetPrice,
  getBalanceAmount,
  getBasicSwapGasLimit,
  getBlockExplorer,
  getChainIdFromNetwork,
  getDataString,
  getEtherscanHostForNetwork,
  getEthPriceUnit,
  getHash,
  getMaticPriceUnit,
  getBnbPriceUnit,
  getAvaxPriceUnit,
  getDegenPriceUnit,
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
