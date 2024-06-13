import { getAddress } from '@ethersproject/address';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { isHexString as isEthersHexString } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { isValidMnemonic as ethersIsValidMnemonic } from '@ethersproject/hdnode';
import { Block, Network as EthersNetwork, StaticJsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import Resolution from '@unstoppabledomains/resolution';
import { startsWith } from 'lodash';
import { getRemoteConfig } from '@/model/remoteConfig';
import { AssetType, NewTransaction, ParsedAddressAsset } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { Network } from '@/helpers/networkTypes';
import { isUnstoppableAddressFormat } from '@/helpers/validators';
import {
  ARBITRUM_ETH_ADDRESS,
  ETH_ADDRESS,
  ethUnits,
  MATIC_POLYGON_ADDRESS,
  BNB_BSC_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
  smartContractMethods,
  CRYPTO_KITTIES_NFT_ADDRESS,
  CRYPTO_PUNKS_NFT_ADDRESS,
} from '@/references';
import {
  addBuffer,
  convertAmountToRawAmount,
  convertStringToHex,
  fraction,
  greaterThan,
  handleSignificantDecimals,
  multiply,
  omitFlatten,
} from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { IS_IOS, RPC_PROXY_API_KEY, RPC_PROXY_BASE_URL } from '@/env';
import { getNetworkObj } from '@/networks';
import store from '@/redux/store';

export enum TokenStandard {
  ERC1155 = 'ERC1155',
  ERC721 = 'ERC721',
}

export const networkProviders = new Map<Network, StaticJsonRpcProvider>();

/**
 * Creates an rpc endpoint for a given chain id using the Rainbow rpc proxy.
 * If the firebase config flag is disabled, it will fall back to the deprecated rpc.
 */
export const proxyRpcEndpoint = (chainId: number, customEndpoint?: string) => {
  const {
    rpc_proxy_enabled,
    arbitrum_mainnet_rpc,
    ethereum_goerli_rpc,
    optimism_mainnet_rpc,
    polygon_mainnet_rpc,
    base_mainnet_rpc,
    bsc_mainnet_rpc,
    zora_mainnet_rpc,
    avalanche_mainnet_rpc,
    ethereum_mainnet_rpc,
    blast_mainnet_rpc,
    degen_mainnet_rpc,
  } = getRemoteConfig();
  if (rpc_proxy_enabled) {
    return `${RPC_PROXY_BASE_URL}/${chainId}/${RPC_PROXY_API_KEY}${
      customEndpoint ? `?custom_rpc=${encodeURIComponent(customEndpoint)}` : ''
    }`;
  } else {
    if (customEndpoint) return customEndpoint;
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    switch (network) {
      case Network.arbitrum:
        return arbitrum_mainnet_rpc;
      case Network.goerli:
        return ethereum_goerli_rpc;
      case Network.optimism:
        return optimism_mainnet_rpc;
      case Network.polygon:
        return polygon_mainnet_rpc;
      case Network.base:
        return base_mainnet_rpc;
      case Network.bsc:
        return bsc_mainnet_rpc;
      case Network.zora:
        return zora_mainnet_rpc;
      case Network.avalanche:
        return avalanche_mainnet_rpc;
      case Network.blast:
        return blast_mainnet_rpc;
      case Network.degen:
        return degen_mainnet_rpc;
      case Network.gnosis:
      case Network.mainnet:
      default:
        return ethereum_mainnet_rpc;
    }
  }
};

/**
 * Gas parameter types returned by `getTransactionGasParams`.
 */
type GasParamsReturned = { gasPrice: string } | { maxFeePerGas: string; maxPriorityFeePerGas: string };

/**
 * Gas parameter types taken as input by `getTransactionGasParams`.
 */
type GasParamsInput = { gasPrice: BigNumberish } & {
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
};

/**
 * The input data provied to `getTxDetails`.
 */
type TransactionDetailsInput = Pick<NewTransactionNonNullable, 'from' | 'to' | 'data' | 'gasLimit' | 'network' | 'nonce'> &
  Pick<NewTransaction, 'amount'> &
  GasParamsInput;

/**
 * The format of transaction details returned by functions such as `getTxDetails`.
 */
type TransactionDetailsReturned = {
  data?: TransactionRequest['data'];
  from?: TransactionRequest['from'];
  gasLimit?: string;
  network?: Network | string;
  to?: TransactionRequest['to'];
  value?: TransactionRequest['value'];
  nonce?: TransactionRequest['nonce'];
} & GasParamsReturned;

/**
 * A type with the same keys as `NewTransaction` but without nullable types.
 * This is useful for functions that assume that certain fields are not set
 * to null on a `NewTransaction`.
 */
type NewTransactionNonNullable = {
  [key in keyof NewTransaction]-?: NonNullable<NewTransaction[key]>;
};

/**
 * @desc web3 http instance
 */
export let web3Provider: StaticJsonRpcProvider = null as unknown as StaticJsonRpcProvider;

/**
 * @desc Checks whether or not a `Network | string` union type should be
 * treated as a `Network` based on its prefix, as opposed to a `string` type.
 * @param network The network to check.
 * @return A type predicate of `network is Network`.
 */
const isNetworkEnum = (network: Network | string): network is Network => {
  return !network.startsWith('http://');
};

/**
 * @desc Sets a different web3 provider.
 * @param network The network to set.
 * @return A promise that resolves with an Ethers Network when the provider is ready.
 */
export const web3SetHttpProvider = async (network: Network | string): Promise<EthersNetwork> => {
  web3Provider = await getProviderForNetwork(network);
  return web3Provider.ready;
};

/**
 * @desc Checks if the given network is a Layer 2.
 * @param network The network to check.
 * @return Whether or not the network is a L2 network.
 */
export const isL2Network = (network: Network | string): boolean => {
  return getNetworkObj(network as Network).networkType === 'layer2';
};

/**
 * @desc Checks whether a provider is HardHat.
 * @param providerUrl The provider URL.
 * @return Whether or not the provider is HardHat.
 */
export const isHardHat = (providerUrl: string): boolean => {
  return providerUrl?.startsWith('http://') && providerUrl?.endsWith('8545');
};

/**
 * @desc Checks if the given network is a testnet.
 * @param network The network to check.
 * @return Whether or not the network is a testnet.
 */
export const isTestnetNetwork = (network: Network): boolean => {
  return getNetworkObj(network as Network).networkType === 'testnet';
};

// shoudl figure out better way to include this in networks
export const getFlashbotsProvider = async () => {
  return new StaticJsonRpcProvider(
    proxyRpcEndpoint(
      1,
      'https://rpc.flashbots.net/?hint=hash&builder=flashbots&builder=f1b.io&builder=rsync&builder=beaverbuild.org&builder=builder0x69&builder=titan&builder=eigenphi&builder=boba-builder'
    ),
    Network.mainnet
  );
};

export const getCachedProviderForNetwork = (network: Network = Network.mainnet): StaticJsonRpcProvider | undefined => {
  return networkProviders.get(network);
};

/**
 * @desc Gets or constructs a web3 provider for the specified network.
 * @param network The network as a `Network` or string.
 * @return The provider for the network.
 */
export const getProviderForNetwork = (network: Network | string = Network.mainnet): StaticJsonRpcProvider => {
  const isSupportedNetwork = isNetworkEnum(network);
  const cachedProvider = isSupportedNetwork ? networkProviders.get(network) : undefined;

  if (isSupportedNetwork && cachedProvider) {
    return cachedProvider;
  }

  if (!isSupportedNetwork) {
    const provider = new StaticJsonRpcProvider(network, Network.mainnet);
    networkProviders.set(Network.mainnet, provider);
    return provider;
  } else {
    const provider = new StaticJsonRpcProvider(getNetworkObj(network).rpc(), getNetworkObj(network).id);
    networkProviders.set(network, provider);
    return provider;
  }
};

/**
 * @desc Checks if the active network is Hardhat.
 * @returns boolean: `true` if connected to Hardhat.
 */
export const getIsHardhatConnected = (): boolean => {
  const currentNetwork = store.getState().settings.network;
  const currentProviderUrl = getCachedProviderForNetwork(currentNetwork)?.connection?.url;
  const connectedToHardhat = !!currentProviderUrl && isHardHat(currentProviderUrl);
  return connectedToHardhat;
};

/**
 * @desc Sends an arbitrary RPC call using a given provider, or the default
 * cached provider.
 * @param payload The payload, including a method and parameters, based on
 * the Ethers.js `StaticJsonRpcProvider.send` arguments.
 * @param provider The provider to use. If `null`, the current cached web3
 * provider is used.
 * @return The response from the `StaticJsonRpcProvider.send` call.
 */
export const sendRpcCall = async (
  payload: {
    method: string;
    params: unknown[];
  },
  provider: StaticJsonRpcProvider | null = null
): Promise<unknown> => (provider || web3Provider)?.send(payload.method, payload.params);

/**
 * @desc check if hex string
 * @param value The string to check
 * @return Whether or not the string was a hex string.
 */
export const isHexString = (value: string): boolean => isEthersHexString(value);

/**
 * Converts a number to a hex string.
 * @param value The number.
 * @return The hex string.
 */
export const toHex = (value: BigNumberish): string => BigNumber.from(value).toHexString();

/**
 * Converts a number to a hex string without leading zeros.
 * @param value The number.
 * @return The hex string.
 */
export const toHexNoLeadingZeros = (value: BigNumberish): string => toHex(value).replace(/^0x0*/, '0x');

/**
 * @desc Checks if a hex string, ignoring prefixes and suffixes.
 * @param value The string.
 * @return Whether or not the string is a hex string.
 */
export const isHexStringIgnorePrefix = (value: string): boolean => {
  if (!value) return false;
  const trimmedValue = value.trim();
  const updatedValue = addHexPrefix(trimmedValue);
  return isHexString(updatedValue);
};

/**
 * @desc Adds an "0x" prefix to a string if one is not present.
 * @param value The starting string.
 * @return The prefixed string.
 */
export const addHexPrefix = (value: string): string => (startsWith(value, '0x') ? value : `0x${value}`);

/**
 * @desc is valid mnemonic
 * @param value The string to check.
 * @return Whether or not the string was a valid mnemonic.
 */
export const isValidMnemonic = (value: string): boolean => ethersIsValidMnemonic(value);

/**
 * @desc is valid bluetooth device id
 * @param value The string to check.
 * @return Whether or not the string was a valid bluetooth device id
 */
export const isValidBluetoothDeviceId = (value: string): boolean => {
  return IS_IOS
    ? value.length === 36 && isHexStringIgnorePrefix(value.replaceAll('-', ''))
    : value.length === 17 && isHexStringIgnorePrefix(value.replaceAll(':', ''));
};

/**
 * @desc Converts an address to a checksummed address.
 * @param address The address
 * @return The checksum address, or `null` if the conversion fails.
 */
export const toChecksumAddress = (address: string): string | null => {
  try {
    return getAddress(address);
  } catch (error) {
    return null;
  }
};

/**
 * @desc estimate gas limit
 * @param estimateGasData The transaction request to use for the estimate.
 * @param provider If specified, a provider to use instead of the cached
 * `web3Provider`.
 * @return The gas limit, or `null` if an error occurs.
 */
export const estimateGas = async (
  estimateGasData: TransactionRequest,
  provider: StaticJsonRpcProvider | null = null
): Promise<string | null> => {
  try {
    const p = provider || web3Provider;
    const gasLimit = await p?.estimateGas(estimateGasData);
    return gasLimit?.toString() ?? null;
  } catch (error) {
    return null;
  }
};

/**
 * @desc Estimates gas for a transaction with a padding multiple.
 * @param txPayload The tranasaction payload
 * @param contractCallEstimateGas An optional function to use for gas estimation,
 * defaulting to `null`.
 * @param callArguments Arbitrary arguments passed as the first parameters
 * of `contractCallEstimateGas`, if provided.
 * @param provider The provider to use. If none is specified, the cached
 * `web3Provider` is used instead.
 * @param paddingFactor The padding applied to the gas limit.
 * @return The gas estimation as a string, or `null` if estimation failed
 */
export async function estimateGasWithPadding(
  txPayload: TransactionRequest,
  contractCallEstimateGas: Contract['estimateGas'][string] | null = null,
  callArguments: unknown[] | null = null,
  provider: StaticJsonRpcProvider | null = null,
  paddingFactor = 1.1
): Promise<string | null> {
  try {
    const p = provider || web3Provider;
    if (!p) {
      return null;
    }

    const txPayloadToEstimate: TransactionRequest & { gas?: string } = {
      ...txPayload,
    };

    // `getBlock`'s typing requires a parameter, but passing no parameter
    // works as intended and returns the gas limit.
    const { gasLimit } = await (p.getBlock as () => Promise<Block>)();

    const { to, data } = txPayloadToEstimate;

    // 1 - Check if the receiver is a contract
    const code = to ? await p.getCode(to) : undefined;
    // 2 - if it's not a contract AND it doesn't have any data use the default gas limit
    if ((!contractCallEstimateGas && !to) || (to && !data && (!code || code === '0x'))) {
      logger.debug('⛽ Skipping estimates, using default', {
        ethUnits: ethUnits.basic_tx.toString(),
      });
      return ethUnits.basic_tx.toString();
    }

    logger.debug('⛽ Calculating safer gas limit for last block');
    // 3 - If it is a contract, call the RPC method `estimateGas` with a safe value
    const saferGasLimit = fraction(gasLimit.toString(), 19, 20);
    logger.debug('⛽ safer gas limit for last block is', { saferGasLimit });

    txPayloadToEstimate[contractCallEstimateGas ? 'gasLimit' : 'gas'] = toHex(saferGasLimit);

    // safety precaution: we want to ensure these properties are not used for gas estimation
    const cleanTxPayload = omitFlatten(txPayloadToEstimate, ['gas', 'gasLimit', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
    const estimatedGas = await (contractCallEstimateGas
      ? contractCallEstimateGas(...(callArguments ?? []), txPayloadToEstimate)
      : p.estimateGas(cleanTxPayload));

    const lastBlockGasLimit = addBuffer(gasLimit.toString(), 0.9);
    const paddedGas = addBuffer(estimatedGas.toString(), paddingFactor.toString());
    logger.debug('⛽ GAS CALCULATIONS!', {
      estimatedGas: estimatedGas.toString(),
      gasLimit: gasLimit.toString(),
      lastBlockGasLimit: lastBlockGasLimit,
      paddedGas: paddedGas,
    });

    // If the safe estimation is above the last block gas limit, use it
    if (greaterThan(estimatedGas.toString(), lastBlockGasLimit)) {
      logger.debug('⛽ returning orginal gas estimation', {
        esimatedGas: estimatedGas.toString(),
      });
      return estimatedGas.toString();
    }
    // If the estimation is below the last block gas limit, use the padded estimate
    if (greaterThan(lastBlockGasLimit, paddedGas)) {
      logger.debug('⛽ returning padded gas estimation', { paddedGas });
      return paddedGas;
    }
    // otherwise default to the last block gas limit
    logger.debug('⛽ returning last block gas limit', { lastBlockGasLimit });
    return lastBlockGasLimit;
  } catch (e) {
    /*
     * Reported ~400x per day, but if it's not actionable it might as well be a warning.
     */
    logger.warn('Error calculating gas limit with padding', { message: e instanceof Error ? e.message : 'Unknown error' });
    return null;
  }
}

/**
 * @desc convert from ether to wei
 * @param value The value in ether.
 * @return The value in wei.
 */
export const toWei = (ether: string): string => {
  const result = parseEther(ether);
  return result.toString();
};

/**
 * @desc get transaction info
 * @param hash The transaction hash.
 * @return The corresponding `TransactionResponse`, or `null` if one could not
 * be found.
 */
export const getTransaction = async (hash: string): Promise<TransactionResponse | null> => web3Provider?.getTransaction(hash) ?? null;

/**
 * @desc get address transaction count
 * @param address The address to check.
 * @return The transaction count, or `null` if it could not be found.
 */
export const getTransactionCount = async (address: string): Promise<number | null> =>
  web3Provider?.getTransactionCount(address, 'pending') ?? null;

/**
 * get transaction gas params depending on network
 * @returns - object with `gasPrice` or `maxFeePerGas` and `maxPriorityFeePerGas`
 */
export const getTransactionGasParams = (transaction: Pick<NewTransactionNonNullable, 'network'> & GasParamsInput): GasParamsReturned => {
  return getNetworkObj(transaction.network).gas.gasType === 'legacy'
    ? {
        gasPrice: toHex(transaction.gasPrice),
      }
    : {
        maxFeePerGas: toHex(transaction.maxFeePerGas),
        maxPriorityFeePerGas: toHex(transaction.maxPriorityFeePerGas),
      };
};

/**
 * @desc Gets transaction details for a new transaction.
 * @param transaction The new transaction. In particular, the `from`, `to`,
 * `gasPrice`, `gasLimit`, `amount` fields from a `NewTransaction` are required,
 * as well as an optional `data` field similar to a `TransactionRequest`.
 * @return The transaction details.
 */
export const getTxDetails = async (transaction: TransactionDetailsInput): Promise<TransactionDetailsReturned> => {
  const { nonce, to } = transaction;
  const data = transaction?.data ?? '0x';
  const value = transaction.amount ? toHex(toWei(transaction.amount)) : '0x0';
  const gasLimit = transaction.gasLimit ? toHex(transaction.gasLimit) : undefined;
  const baseTx = {
    data,
    gasLimit,
    nonce,
    to,
    value,
  };

  const gasParams = getTransactionGasParams(transaction);
  const tx = {
    ...baseTx,
    ...gasParams,
  };

  return tx;
};

/**
 * @desc Resolves an Unstoppable domain string.
 * @param domain The domain as a string.
 * @return The resolved address, or undefined if none could be found.
 */
export const resolveUnstoppableDomain = async (domain: string): Promise<string | void> => {
  // This parameter doesn't line up with the `Resolution` type declaration,
  // but it can be casted to `any` as it does match the documentation here:
  // https://unstoppabledomains.github.io/resolution/v2.2.0/classes/resolution.html.
  const resolution = new Resolution();
  const res = resolution
    .addr(domain, 'ETH')
    .then((address: string) => {
      return address;
    })
    .catch(error => {
      logger.error(new RainbowError(`resolveUnstoppableDomain error`), {
        message: error.message,
      });
    });
  return res;
};

/**
 * @desc Resolves a name or address to an Ethereum hex-formatted address.
 * @param nameOrAddress The name or address to resolve.
 * @param provider If provided, a provider to use instead of the cached
 * `web3Provider`.
 * @return The address, or undefined if one could not be resolved.
 */
export const resolveNameOrAddress = async (nameOrAddress: string): Promise<string | void | null> => {
  if (!isHexString(nameOrAddress)) {
    if (isUnstoppableAddressFormat(nameOrAddress)) {
      return resolveUnstoppableDomain(nameOrAddress);
    }
    const p = await getProviderForNetwork(Network.mainnet);
    return p?.resolveName(nameOrAddress);
  }
  return nameOrAddress;
};

/**
 * @desc Gets transaction details for a new transfer NFT transaction.
 * @param transaction The new transaction. The `asset`, `from`, `to`,
 * `gasPrice`, and `gasLimit` fields from a `NewTransaction` are required.
 * @return The transaction details.
 * @throws If the recipient is invalid or could not be found.
 */
export const getTransferNftTransaction = async (
  transaction: Pick<
    NewTransactionNonNullable,
    'asset' | 'from' | 'to' | 'gasPrice' | 'gasLimit' | 'network' | 'nonce' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
  >
): Promise<TransactionDetailsReturned> => {
  const recipient = await resolveNameOrAddress(transaction.to);

  if (!recipient) {
    throw new Error(`Invalid recipient "${transaction.to}"`);
  }

  const { from, nonce } = transaction;
  const contractAddress = transaction.asset.asset_contract?.address;
  const data = getDataForNftTransfer(from, recipient, transaction.asset);
  const gasParams = getTransactionGasParams(transaction);
  return {
    data,
    from,
    gasLimit: transaction.gasLimit?.toString(),
    network: transaction.network,
    nonce,
    to: contractAddress,
    ...gasParams,
  };
};

/**
 * @desc Gets transaction details for a new transfer token transaction.
 * @param transaction The new transaction. The `asset`, `from`, `to`, `amount`,
 * `gasPrice`, and `gasLimit` fields from a `NewTransaction` are required.
 * @return The transaction details.
 */
export const getTransferTokenTransaction = async (
  transaction: Pick<
    NewTransactionNonNullable,
    'asset' | 'from' | 'to' | 'amount' | 'gasPrice' | 'gasLimit' | 'network' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
  >
): Promise<TransactionDetailsReturned> => {
  const value = convertAmountToRawAmount(transaction.amount, transaction.asset.decimals);
  const recipient = (await resolveNameOrAddress(transaction.to)) as string;
  const data = getDataForTokenTransfer(value, recipient);
  const gasParams = getTransactionGasParams(transaction);
  return {
    data,
    from: transaction.from,
    gasLimit: transaction.gasLimit?.toString(),
    network: transaction.network,
    to: transaction.asset.address,
    ...gasParams,
  };
};

/**
 * @desc Transforms a new transaction into signable transaction.
 * @param transaction The new transaction.
 * @return The transaction details.
 */
export const createSignableTransaction = async (transaction: NewTransactionNonNullable): Promise<TransactionDetailsReturned> => {
  // handle native assets seperately
  if (
    transaction.asset.address === ETH_ADDRESS ||
    transaction.asset.address === ARBITRUM_ETH_ADDRESS ||
    transaction.asset.address === OPTIMISM_ETH_ADDRESS ||
    transaction.asset.address === MATIC_POLYGON_ADDRESS ||
    transaction.asset.address === BNB_BSC_ADDRESS
  ) {
    return getTxDetails(transaction);
  }
  const isNft = transaction.asset.type === AssetType.nft;
  const result = isNft ? await getTransferNftTransaction(transaction) : await getTransferTokenTransaction(transaction);

  // `result` will conform to `TransactionDetailsInput`, except it will have
  // either { gasPrice: string } | { maxFeePerGas: string; maxPriorityFeePerGas: string }
  // due to the type of `GasParamsReturned`, not both. This is fine, since
  // `getTxDetails` only needs to use one or the other in `getTransactionGasParams`, but
  // must be casted to conform to the type.
  return getTxDetails(result as TransactionDetailsInput);
};

/**
 * @desc Estimates the balance portion for a given asset.
 * @param asset The asset to check.
 * @return The estimated portion.
 */
const estimateAssetBalancePortion = (asset: ParsedAddressAsset): string => {
  if (asset.type !== AssetType.nft && asset.balance?.amount) {
    const assetBalance = asset.balance?.amount;
    const decimals = asset.decimals;
    const portion = multiply(assetBalance, 0.1);
    const trimmed = handleSignificantDecimals(portion, decimals);
    return convertAmountToRawAmount(trimmed, decimals);
  }
  return '0';
};

/**
 * @desc Generates a transaction data string for a token transfer.
 * @param value The value to transfer.
 * @param to The recipient address.
 * @return The data string for the transaction.
 */
export const getDataForTokenTransfer = (value: string, to: string): string => {
  const transferMethodHash = smartContractMethods.token_transfer.hash;
  const data = ethereumUtils.getDataString(transferMethodHash, [ethereumUtils.removeHexPrefix(to), convertStringToHex(value)]);
  return data;
};

/**
 * @desc Returns a transaction data string for an NFT transfer.
 * @param from The sender's address.
 * @param to The recipient's address.
 * @param asset The asset to transfer.
 * @return The data string if the transfer can be attempted, otherwise undefined.
 */
export const getDataForNftTransfer = (from: string, to: string, asset: ParsedAddressAsset): string | undefined => {
  if (!asset.id || !asset.asset_contract?.address) return;
  const lowercasedContractAddress = asset.asset_contract.address.toLowerCase();
  const standard = asset.asset_contract?.schema_name;
  let data: string | undefined;
  if (lowercasedContractAddress === CRYPTO_KITTIES_NFT_ADDRESS && asset.network === Network.mainnet) {
    const transferMethod = smartContractMethods.token_transfer;
    data = ethereumUtils.getDataString(transferMethod.hash, [ethereumUtils.removeHexPrefix(to), convertStringToHex(asset.id)]);
  } else if (lowercasedContractAddress === CRYPTO_PUNKS_NFT_ADDRESS && asset.network === Network.mainnet) {
    const transferMethod = smartContractMethods.punk_transfer;
    data = ethereumUtils.getDataString(transferMethod.hash, [ethereumUtils.removeHexPrefix(to), convertStringToHex(asset.id)]);
  } else if (standard === TokenStandard.ERC1155) {
    const transferMethodHash = smartContractMethods.erc1155_transfer.hash;
    data = ethereumUtils.getDataString(transferMethodHash, [
      ethereumUtils.removeHexPrefix(from),
      ethereumUtils.removeHexPrefix(to),
      convertStringToHex(asset.id),
      convertStringToHex('1'),
      convertStringToHex('160'),
      convertStringToHex('0'),
    ]);
  } else if (standard === TokenStandard.ERC721) {
    const transferMethod = smartContractMethods.erc721_transfer;
    data = ethereumUtils.getDataString(transferMethod.hash, [
      ethereumUtils.removeHexPrefix(from),
      ethereumUtils.removeHexPrefix(to),
      convertStringToHex(asset.id),
    ]);
  }
  return data;
};

/**
 * @desc Builds a transaction request object.
 * @param [{address, amount, asset, gasLimit, recipient}] The transaction
 * initialization details.
 * @param provider The RCP provider to use.
 * @param network The network for the transaction
 * @return The transaction request.
 */
export const buildTransaction = async (
  {
    address,
    amount,
    asset,
    gasLimit,
    recipient,
  }: {
    asset: ParsedAddressAsset;
    address: string;
    recipient: string;
    amount: number;
    gasLimit?: string;
  },
  provider: StaticJsonRpcProvider | null,
  network: Network
): Promise<TransactionRequest> => {
  const _amount = amount && Number(amount) ? convertAmountToRawAmount(amount, asset.decimals) : estimateAssetBalancePortion(asset);
  const value = _amount.toString();
  const _recipient = (await resolveNameOrAddress(recipient)) as string;
  let txData: TransactionRequest = {
    data: '0x',
    from: address,
    to: _recipient,
    value,
  };
  if (asset.type === AssetType.nft) {
    const contractAddress = asset.asset_contract?.address;
    const data = getDataForNftTransfer(address, _recipient, asset);
    txData = {
      data,
      from: address,
      to: contractAddress,
    };
  } else if (!isNativeAsset(asset.address, network)) {
    const transferData = getDataForTokenTransfer(value, _recipient);
    txData = {
      data: transferData,
      from: address,
      to: asset.address,
      value: '0x0',
    };
  }
  return { ...txData, gasLimit };
};

/**
 * @desc Estimates the gas limit for a transaction.
 * @param options The `asset`, `address`, `recipient`, and `amount` for the
 * transaction.
 * @param addPadding Whether or not to add padding to the gas limit, defaulting
 * to `false`.
 * @param provider If provided, a provider to use instead of the default
 * cached `web3Provider`.
 * @param network The network to use, defaulting to `Network.mainnet`.
 * @returns The estimated gas limit.
 */
export const estimateGasLimit = async (
  {
    asset,
    address,
    recipient,
    amount,
  }: {
    asset: ParsedAddressAsset;
    address: string;
    recipient: string;
    amount: number;
  },
  addPadding = false,
  provider: StaticJsonRpcProvider | null = null,
  network: Network = Network.mainnet
): Promise<string | null> => {
  const estimateGasData = await buildTransaction({ address, amount, asset, recipient }, provider, network);

  if (addPadding) {
    return estimateGasWithPadding(estimateGasData, null, null, provider);
  } else {
    return estimateGas(estimateGasData, provider);
  }
};
