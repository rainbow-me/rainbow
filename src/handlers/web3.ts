import { getAddress } from '@ethersproject/address';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { isHexString as isEthersHexString } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { isValidMnemonic as ethersIsValidMnemonic } from '@ethersproject/hdnode';
import { Block, JsonRpcBatchProvider, StaticJsonRpcProvider, TransactionRequest } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import Resolution from '@unstoppabledomains/resolution';
import { startsWith } from 'lodash';
import { AssetType, NewTransaction, ParsedAddressAsset } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { isUnstoppableAddressFormat } from '@/helpers/validators';
import { ethUnits, smartContractMethods, CRYPTO_KITTIES_NFT_ADDRESS, CRYPTO_PUNKS_NFT_ADDRESS } from '@/references';
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
import { ChainId, chainAnvil } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

export enum TokenStandard {
  ERC1155 = 'ERC1155',
  ERC721 = 'ERC721',
}

export const chainsProviders = new Map<ChainId, StaticJsonRpcProvider>();

export const chainsBatchProviders = new Map<ChainId, JsonRpcBatchProvider>();

/**
 * Creates an rpc endpoint for a given chain id using the Rainbow rpc proxy.
 * If the firebase config flag is disabled, it will fall back to the deprecated rpc.
 */
export const proxyCustomRpcEndpoint = (chainId: number, customEndpoint: string) => {
  return `${RPC_PROXY_BASE_URL}/${chainId}/${RPC_PROXY_API_KEY}?custom_rpc=${encodeURIComponent(customEndpoint)}`;
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
type TransactionDetailsInput = Pick<NewTransactionNonNullable, 'from' | 'to' | 'data' | 'gasLimit' | 'chainId' | 'nonce'> &
  Pick<NewTransaction, 'amount'> &
  GasParamsInput;

/**
 * The format of transaction details returned by functions such as `getTxDetails`.
 */
type TransactionDetailsReturned = {
  data?: TransactionRequest['data'];
  from?: TransactionRequest['from'];
  gasLimit?: string;
  chainId?: ChainId | string;
  to?: TransactionRequest['to'];
  value?: TransactionRequest['value'];
  nonce?: TransactionRequest['nonce'];
} & GasParamsReturned;

/**
 * A type with the same keys as `NewTransaction` but without nullable types.
 * This is useful for functions that assume that certain fields are not set
 * to null on a `NewTransaction`.
 */
export type NewTransactionNonNullable = {
  [key in keyof NewTransaction]-?: NonNullable<NewTransaction[key]>;
};

/**
 * @desc Checks if the given network is a Layer 2.
 * @param chainId The network to check.
 * @return Whether or not the network is a L2 network.
 */
export const isL2Chain = ({ chainId = ChainId.mainnet }: { chainId?: ChainId }): boolean => {
  const defaultChains = useBackendNetworksStore.getState().getDefaultChains();
  return defaultChains[chainId]?.id !== ChainId.mainnet && !defaultChains[chainId]?.testnet;
};

/**
 * @desc Checks if the given network is a testnet.
 * @param network The network to check.
 * @return Whether or not the network is a testnet.
 */
export const isTestnetChain = ({ chainId = ChainId.mainnet }: { chainId?: ChainId }): boolean => {
  return !!useBackendNetworksStore.getState().getDefaultChains()[chainId]?.testnet;
};

export const getCachedProviderForNetwork = (chainId: ChainId = ChainId.mainnet): StaticJsonRpcProvider | undefined => {
  return chainsProviders.get(chainId);
};

export const getBatchedProvider = ({ chainId = ChainId.mainnet }: { chainId?: number }): JsonRpcBatchProvider => {
  if (useConnectedToAnvilStore.getState().connectedToAnvil) {
    const provider = new JsonRpcBatchProvider(chainAnvil.rpcUrls.default.http[0], ChainId.mainnet);
    chainsBatchProviders.set(chainId, provider);

    return provider;
  }

  const cachedProvider = chainsBatchProviders.get(chainId);
  const providerUrl = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.rpcUrls?.default?.http?.[0];

  if (cachedProvider && cachedProvider?.connection.url === providerUrl) {
    return cachedProvider;
  }
  const provider = new JsonRpcBatchProvider(providerUrl, chainId);
  chainsBatchProviders.set(chainId, provider);

  return provider;
};

export const getProvider = ({ chainId = ChainId.mainnet }: { chainId?: number }): StaticJsonRpcProvider => {
  if (useConnectedToAnvilStore.getState().connectedToAnvil) {
    const provider = new StaticJsonRpcProvider(chainAnvil.rpcUrls.default.http[0], ChainId.mainnet);
    chainsProviders.set(chainId, provider);

    return provider;
  }

  const cachedProvider = chainsProviders.get(chainId);

  const providerUrl = useBackendNetworksStore.getState().getDefaultChains()[chainId]?.rpcUrls?.default?.http?.[0];

  if (cachedProvider && cachedProvider?.connection.url === providerUrl) {
    return cachedProvider;
  }
  const provider = new StaticJsonRpcProvider(providerUrl, chainId);
  chainsProviders.set(chainId, provider);

  return provider;
};

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
 * @param provider
 * @return The gas limit, or `null` if an error occurs.
 */
export const estimateGas = async (estimateGasData: TransactionRequest, provider: StaticJsonRpcProvider): Promise<string | null> => {
  try {
    const gasLimit = await provider.estimateGas(estimateGasData);
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
 * @param provider The provider to use.
 * @param paddingFactor The padding applied to the gas limit.
 * @return The gas estimation as a string, or `null` if estimation failed
 */
export async function estimateGasWithPadding(
  txPayload: TransactionRequest,
  contractCallEstimateGas: Contract['estimateGas'][string] | null = null,
  callArguments: unknown[] | null = null,
  provider: StaticJsonRpcProvider,
  paddingFactor = 1.1
): Promise<string | null> {
  try {
    const p = provider;
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
      logger.debug('[web3]: ⛽ Skipping estimates, using default', {
        ethUnits: ethUnits.basic_tx.toString(),
      });
      return ethUnits.basic_tx.toString();
    }

    logger.debug('[web3]: ⛽ Calculating safer gas limit for last block');
    // 3 - If it is a contract, call the RPC method `estimateGas` with a safe value
    const saferGasLimit = fraction(gasLimit.toString(), 19, 20);
    logger.debug('[web3]: ⛽ safer gas limit for last block is', { saferGasLimit });

    txPayloadToEstimate[contractCallEstimateGas ? 'gasLimit' : 'gas'] = toHex(saferGasLimit);

    // safety precaution: we want to ensure these properties are not used for gas estimation
    const cleanTxPayload = omitFlatten(txPayloadToEstimate, ['gas', 'gasLimit', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
    const estimatedGas = await (contractCallEstimateGas
      ? contractCallEstimateGas(...(callArguments ?? []), txPayloadToEstimate)
      : p.estimateGas(cleanTxPayload));

    if (!BigNumber.isBigNumber(estimatedGas)) {
      throw new Error('Invalid gas limit type');
    }

    const lastBlockGasLimit = addBuffer(gasLimit.toString(), 0.9);
    const paddedGas = addBuffer(estimatedGas.toString(), paddingFactor.toString());
    logger.debug('[web3]: ⛽ GAS CALCULATIONS!', {
      estimatedGas: estimatedGas.toString(),
      gasLimit: gasLimit.toString(),
      lastBlockGasLimit: lastBlockGasLimit,
      paddedGas: paddedGas,
    });

    // If the safe estimation is above the last block gas limit, use it
    if (greaterThan(estimatedGas.toString(), lastBlockGasLimit)) {
      logger.debug('[web3]: ⛽ returning orginal gas estimation', {
        esimatedGas: estimatedGas.toString(),
      });
      return estimatedGas.toString();
    }
    // If the estimation is below the last block gas limit, use the padded estimate
    if (greaterThan(lastBlockGasLimit, paddedGas)) {
      logger.debug('[web3]: ⛽ returning padded gas estimation', { paddedGas });
      return paddedGas;
    }
    // otherwise default to the last block gas limit
    logger.debug('[web3]: ⛽ returning last block gas limit', { lastBlockGasLimit });
    return lastBlockGasLimit;
  } catch (e) {
    /*
     * Reported ~400x per day, but if it's not actionable it might as well be a warning.
     */
    logger.warn('[web3]: Error calculating gas limit with padding', { message: e instanceof Error ? e.message : 'Unknown error' });
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
 * get transaction gas params depending on network
 * @returns - object with `gasPrice` or `maxFeePerGas` and `maxPriorityFeePerGas`
 */
export const getTransactionGasParams = (transaction: Pick<NewTransactionNonNullable, 'chainId'> & GasParamsInput): GasParamsReturned => {
  return transaction.gasPrice
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
export const resolveUnstoppableDomain = async (domain: string): Promise<string | null> => {
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
      logger.error(new RainbowError(`[web3]: resolveUnstoppableDomain error`), {
        message: error.message,
      });
      return null;
    });
  return res;
};

/**
 * @desc Resolves a name or address to an Ethereum hex-formatted address.
 * @param nameOrAddress The name or address to resolve.
 * @return The address, or null if one could not be resolved.
 */
export const resolveNameOrAddress = async (nameOrAddress: string): Promise<string | null> => {
  if (!isHexString(nameOrAddress)) {
    if (isUnstoppableAddressFormat(nameOrAddress)) {
      const resolvedAddress = await resolveUnstoppableDomain(nameOrAddress);
      return resolvedAddress;
    }
    const p = getProvider({ chainId: ChainId.mainnet });
    const resolvedAddress = await p?.resolveName(nameOrAddress);

    return resolvedAddress;
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
    'asset' | 'from' | 'to' | 'gasPrice' | 'gasLimit' | 'nonce' | 'maxFeePerGas' | 'maxPriorityFeePerGas' | 'chainId'
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
    chainId: transaction.chainId,
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
    'asset' | 'from' | 'to' | 'amount' | 'gasPrice' | 'gasLimit' | 'chainId' | 'maxFeePerGas' | 'maxPriorityFeePerGas'
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
    chainId: transaction.chainId,
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
  if (isNativeAsset(transaction.asset.address, transaction.chainId)) {
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
  if (lowercasedContractAddress === CRYPTO_KITTIES_NFT_ADDRESS && asset.chainId === ChainId.mainnet) {
    const transferMethod = smartContractMethods.token_transfer;
    data = ethereumUtils.getDataString(transferMethod.hash, [ethereumUtils.removeHexPrefix(to), convertStringToHex(asset.id)]);
  } else if (lowercasedContractAddress === CRYPTO_PUNKS_NFT_ADDRESS && asset.chainId === ChainId.mainnet) {
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
 * @param chainId The chainId for the transaction
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
  provider: StaticJsonRpcProvider | undefined,
  chainId: ChainId
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
  } else if (!isNativeAsset(asset.address, chainId)) {
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
 * @param provider
 * @param chainId The chainId to use, defaulting to `ChainId.mainnet`.
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
  provider: StaticJsonRpcProvider,
  chainId: ChainId = ChainId.mainnet
): Promise<string | null> => {
  const estimateGasData = await buildTransaction({ address, amount, asset, recipient }, provider, chainId);

  if (addPadding) {
    return estimateGasWithPadding(estimateGasData, null, null, provider);
  } else {
    return estimateGas(estimateGasData, provider);
  }
};
