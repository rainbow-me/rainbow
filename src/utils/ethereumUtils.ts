import { queryClient } from '@/react-query';
import { BigNumberish } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import { serialize } from '@ethersproject/transactions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AddressOrEth } from '@/__swaps__/types/assets';
import {
  EthereumAddress,
  GasFee,
  LegacySelectedGasFee,
  NewTransaction,
  ParsedAddressAsset,
  RainbowTransaction,
  SelectedGasFee,
} from '@/entities';
import { IS_IOS } from '@/env';
import { getOnchainAssetBalance } from '@/handlers/assets';
import { getProvider, isTestnetChain, toHex } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { add, convertRawAmountToDecimalFormat, fromWei, greaterThan, isZero, subtract } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { parseAssetNative } from '@/parsers';
import store from '@/redux/store';
import { ETH_ADDRESS, ethUnits, optimismGasOracleAbi, OVM_GAS_PRICE_ORACLE } from '@/references';
import {
  externalTokenQueryKey,
  fetchExternalToken,
  FormattedExternalAsset,
  useExternalToken,
} from '@/resources/assets/externalAssetsQuery';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { Contract } from '@ethersproject/contracts';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'eth-... Remove this comment to see the full error message
import { parse } from 'eth-url-parser';
import { addHexPrefix, isValidAddress, toChecksumAddress } from 'ethereumjs-util';
import i18n from '@/languages';
import { cloneDeep, isEmpty, isString, replace } from 'lodash';
import { InteractionManager } from 'react-native';
import { ETHERSCAN_API_KEY } from 'react-native-dotenv';
import { getAccountAddress } from '@/state/wallets/walletsStore';
import { openInBrowser } from './openInBrowser';

/**
 * @deprecated - use `getUniqueId` instead for chainIds
 * @desc Get the unique ID for an address and network
 * @param address - The address to get the unique ID for
 * @param network - The network to get the unique ID for
 * @returns `${address}_${network}`
 */
export const getUniqueIdNetwork = (address: EthereumAddress, network: Network) => `${address}_${network}`;

export const getUniqueId = (address: EthereumAddress, chainId: ChainId) => {
  'worklet';
  return `${address}_${chainId}`;
};

/**
 * @desc Get the address and chainId from a unique ID
 * @param uniqueId - The unique ID to get the address & (chainId || network) from
 * @returns { address: AddressOrEth; chainId: ChainId }
 */
export const getAddressAndChainIdFromUniqueId = (uniqueId: string): { address: AddressOrEth; chainId: ChainId } => {
  const parts = uniqueId.split('_');

  // If the unique ID does not contain '_', it's a mainnet address
  if (parts.length === 1) {
    return { address: parts[0] as AddressOrEth, chainId: ChainId.mainnet };
  }

  const address = parts[0] as AddressOrEth;
  const networkOrChainId = parts[1];
  // if the second part is a string, it's probably a network
  if (isNaN(Number(networkOrChainId))) {
    const chainId = useBackendNetworksStore.getState().getChainsIdByName()[networkOrChainId] || ChainId.mainnet; // Default to mainnet if unknown
    return { address, chainId };
  }

  return { address, chainId: +networkOrChainId };
};

/**
 * Synchronously get native asset from cache. Fast but may return stale/missing data.
 * @param chainId - The chain to get native asset for
 * @param address - Optional wallet address (defaults to global selected wallet)
 * @returns Cached native asset or undefined if not in store
 */
const getNetworkNativeAsset = ({ chainId, address }: { chainId: ChainId; address?: EthereumAddress }) => {
  const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
  if (!nativeAsset) return;
  const nativeAssetUniqueId = getUniqueId(nativeAsset.address, chainId);
  return getAccountAsset(nativeAssetUniqueId, address);
};

/**
 * Asynchronously get native asset with fresh balance. Accurate but slower.
 * Falls back to external API + blockchain if cache miss or different wallet.
 * @param chainId - The chain to get native asset for
 * @param address - Optional wallet address (defaults to global selected wallet)
 * @returns Native asset with up-to-date balance from cache, API, or blockchain
 */
export const getNativeAssetForNetwork = async ({
  chainId,
  address,
}: {
  chainId: ChainId;
  address?: EthereumAddress;
}): Promise<ParsedAddressAsset | undefined> => {
  const networkNativeAsset = getNetworkNativeAsset({ chainId });
  const accountAddress = getAccountAddress();
  const { nativeCurrency } = store.getState().settings;
  const differentWallet = address?.toLowerCase() !== accountAddress?.toLowerCase();
  let nativeAsset = differentWallet ? undefined : networkNativeAsset;

  // If the asset is on a different wallet, or not available in this wallet
  if (differentWallet || !nativeAsset) {
    const chainNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
    const mainnetAddress = chainNativeAsset?.address || ETH_ADDRESS;
    const nativeAssetAddress = chainNativeAsset.address as AddressOrEth;

    const externalAsset = await queryClient.fetchQuery(
      externalTokenQueryKey({ address: nativeAssetAddress, chainId, currency: nativeCurrency }),
      async () => fetchExternalToken({ address: nativeAssetAddress, chainId, currency: nativeCurrency }),
      {
        staleTime: 60000,
      }
    );
    if (externalAsset) {
      nativeAsset = {
        ...externalAsset,
        chainId,
        network: useBackendNetworksStore.getState().getChainsName()[chainId],
        uniqueId: getUniqueId(chainNativeAsset.address, chainId),
        address: chainNativeAsset.address,
        decimals: chainNativeAsset.decimals,
        symbol: chainNativeAsset.symbol,
        price: {
          ...externalAsset.price,
          value: externalAsset.price.value ?? 0,
        },
      };
    }

    const provider = getProvider({ chainId });
    if (nativeAsset) {
      nativeAsset.mainnet_address = mainnetAddress;
      nativeAsset.address = chainNativeAsset.address;

      const balance = await getOnchainAssetBalance(nativeAsset, address, chainId, provider);

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
    logger.warn(`[ethereumUtils]: Error retrieving external asset from cache: ${e}`);
  }
};

const getAssetFromAllAssets = (uniqueId: EthereumAddress | undefined) => {
  const loweredUniqueId = uniqueId?.toLowerCase() ?? '';
  const accountAsset = userAssetsStore.getState().getLegacyUserAsset(loweredUniqueId);
  const externalAsset = getExternalAssetFromCache(loweredUniqueId);
  return accountAsset ?? externalAsset;
};

/**
 * Get asset from a specific wallet's cache.
 * @param uniqueId - The asset's unique identifier (address_chainId)
 * @param address - Optional wallet address (defaults to global selected wallet)
 */
const getAccountAsset = (uniqueId: EthereumAddress, address?: EthereumAddress): ParsedAddressAsset | undefined => {
  const loweredUniqueId = uniqueId.toLowerCase();
  return userAssetsStore.getState(address).getLegacyUserAsset(loweredUniqueId) ?? undefined;
};

const getAssetPrice = (
  { address, chainId }: { address: EthereumAddress; chainId: ChainId } = {
    address: ETH_ADDRESS,
    chainId: ChainId.mainnet,
  }
) => {
  const uniqueId = getUniqueId(address, chainId);
  const externalAsset = getExternalAssetFromCache(uniqueId);
  const genericPrice = externalAsset?.price?.value;
  return genericPrice || getAccountAsset(uniqueId)?.price?.value || 0;
};

export const useNativeAsset = ({ chainId }: { chainId: ChainId }) => {
  const { nativeCurrency } = store.getState().settings;
  const address = (useBackendNetworksStore.getState().getChainsNativeAsset()[chainId]?.address || ETH_ADDRESS) as AddressOrEth;

  const { data: nativeAsset } = useExternalToken({
    address,
    chainId,
    currency: nativeCurrency,
  });

  return nativeAsset;
};

const getPriceOfNativeAssetForNetwork = ({ chainId }: { chainId: ChainId }) => {
  const chainsNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset();
  const address = (chainsNativeAsset[chainId]?.address || ETH_ADDRESS) as AddressOrEth;
  return getAssetPrice({ address, chainId });
};

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
 * @desc get etherscan host from network string
 * @param  {String} network
 */
function getEtherscanHostForNetwork({ chainId }: { chainId: ChainId }): string {
  const base_host = 'etherscan.io';
  const blockExplorer = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.blockExplorers?.default?.url;
  const network = useBackendNetworksStore.getState().getChainsName()[chainId];

  if (network && isTestnetChain({ chainId })) {
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

function getBlockExplorer({ chainId }: { chainId: ChainId }) {
  return useBackendNetworksStore.getState().getDefaultChains()[chainId]?.blockExplorers?.default.name || 'etherscan';
}

function openAddressInBlockExplorer({ address, chainId }: { address: EthereumAddress; chainId: ChainId }) {
  const explorer = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.blockExplorers?.default?.url;
  openInBrowser(`${explorer}/address/${address}`);
}

function openTokenEtherscanURL({ address, chainId }: { address: EthereumAddress; chainId: ChainId }) {
  if (!isString(address)) return;
  const explorer = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.blockExplorers?.default?.url;
  openInBrowser(`${explorer}/token/${address}`);
}

function openNftInBlockExplorer({ contractAddress, tokenId, chainId }: { contractAddress: string; tokenId: string; chainId: ChainId }) {
  const explorer = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.blockExplorers?.default?.url;
  openInBrowser(`${explorer}/token/${contractAddress}?a=${tokenId}`);
}

function openTransactionInBlockExplorer({ hash, chainId }: { hash: string; chainId: ChainId }) {
  const normalizedHash = hash.replace(/-.*/g, '');
  if (!isString(hash)) return;
  const explorer = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.blockExplorers?.default?.url;
  openInBrowser(`${explorer}/tx/${normalizedHash}`);
}

async function parseEthereumUrl(data: string) {
  let ethUrl;
  try {
    ethUrl = parse(data);
  } catch (e) {
    Alert.alert(i18n.wallet.alerts.invalid_ethereum_url());
    return;
  }

  const functionName = ethUrl.function_name;
  let asset = null;
  const chainId = (ethUrl.chain_id as ChainId) || ChainId.mainnet;
  const network = useBackendNetworksStore.getState().getChainsName()[chainId];
  let address: any = null;
  let nativeAmount: any = null;
  const { nativeCurrency } = store.getState().settings;

  if (!functionName) {
    // Send native asset
    const chainId = useBackendNetworksStore.getState().getChainsIdByName()[network];
    asset = getNetworkNativeAsset({ chainId });

    if (!asset || isZero(asset?.balance?.amount ?? '0')) {
      Alert.alert(i18n.wallet.alerts.ooops(), i18n.wallet.alerts.dont_have_asset_in_wallet());
      return;
    }
    address = ethUrl.target_address;
    nativeAmount = ethUrl.parameters?.value && fromWei(ethUrl.parameters.value);
  } else if (functionName === 'transfer') {
    // Send ERC-20
    const targetUniqueId = getUniqueId(ethUrl.target_address, chainId);
    asset = getAccountAsset(targetUniqueId);
    if (!asset || isZero(asset?.balance?.amount ?? '0')) {
      Alert.alert(i18n.wallet.alerts.ooops(), i18n.wallet.alerts.dont_have_asset_in_wallet());
      return;
    }
    address = ethUrl.parameters?.address;
    nativeAmount = ethUrl.parameters?.uint256 && convertRawAmountToDecimalFormat(ethUrl.parameters.uint256, asset.decimals);
  } else {
    Alert.alert(i18n.wallet.alerts.this_action_not_supported());
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

const calculateL1FeeOptimism = async (
  tx: RainbowTransaction | TransactionRequest,
  provider: StaticJsonRpcProvider
): Promise<BigNumberish | undefined> => {
  const newTx = cloneDeep(tx);
  try {
    if (newTx.value) {
      newTx.value = toHex(newTx.value);
    }
    if (newTx.from) {
      newTx.nonce = Number(await provider.getTransactionCount(newTx.from));
    }

    delete newTx?.chainId;
    delete newTx?.from;
    // @ts-expect-error gas is not in type RainbowTransaction
    delete newTx?.gas;
    // @ts-expect-error extParams is not in type RainbowTransaction
    delete newTx?.extParams;

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
  } catch (e) {
    logger.error(new RainbowError(`[ethereumUtils]: error calculating l1 fee`, e), {
      message: e instanceof Error ? e.message : 'Unknown error',
    });
  }
};

const getBasicSwapGasLimit = (chainId: ChainId) => {
  return Number(useBackendNetworksStore.getState().getChainGasUnits(chainId).basic.swap);
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
  getDataString,
  getEtherscanHostForNetwork,
  getHash,
  getNativeAssetForNetwork,
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
