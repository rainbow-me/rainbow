import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { isHexString as isEthersHexString } from '@ethersproject/bytes';
import { isValidMnemonic as ethersIsValidMnemonic } from '@ethersproject/hdnode';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import UnstoppableResolution from '@unstoppabledomains/resolution';
import { get, startsWith } from 'lodash';
import {
  ARBITRUM_ETH_ADDRESS,
  ETH_ADDRESS,
  ethUnits,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
  smartContractMethods,
} from '../references';

import { isNativeAsset } from './assets';
import { AssetTypes } from '@rainbow-me/entities';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
// eslint-disable-next-line import/no-cycle
import { isUnstoppableAddressFormat } from '@rainbow-me/helpers/validators';

import {
  addBuffer,
  convertAmountToRawAmount,
  convertStringToHex,
  fraction,
  greaterThan,
  handleSignificantDecimals,
  multiply,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

export const networkProviders = {};

const rpcEndpoints = {};

export const setRpcEndpoints = config => {
  rpcEndpoints[NetworkTypes.mainnet] = config.ethereum_mainnet_rpc;
  rpcEndpoints[NetworkTypes.ropsten] = config.ethereum_ropsten_rpc;
  rpcEndpoints[NetworkTypes.kovan] = config.ethereum_kovan_rpc;
  rpcEndpoints[NetworkTypes.rinkeby] = config.ethereum_rinkeby_rpc;
  rpcEndpoints[NetworkTypes.optimism] = config.optimism_mainnet_rpc;
  rpcEndpoints[NetworkTypes.arbitrum] = config.arbitrum_mainnet_rpc;
  rpcEndpoints[NetworkTypes.polygon] = config.polygon_mainnet_rpc;
};

/**
 * @desc web3 http instance
 */
export let web3Provider = null;

/**
 * @desc set a different web3 provider
 * @param {String} network
 */
export const web3SetHttpProvider = async network => {
  web3Provider = await getProviderForNetwork(network);
};

/**
 * @desc returns true if the given network is EIP1559 supported
 * @param {String} network
 */
export const isEIP1559LegacyNetwork = network => {
  switch (network) {
    case NetworkTypes.arbitrum:
    case NetworkTypes.optimism:
    case NetworkTypes.polygon:
      return true;
    default:
      return false;
  }
};

/**
 * @desc returns true if the given network is a Layer 2
 * @param {String} network
 */
export const isL2Network = network => {
  switch (network) {
    case NetworkTypes.arbitrum:
    case NetworkTypes.optimism:
    case NetworkTypes.polygon:
      return true;
    default:
      return false;
  }
};

/**
 * @desc returns whether current provider is hardhat
 * @param {String} providerUrl
 */
export const isHardHat = providerUrl => {
  return providerUrl?.startsWith('http://') && providerUrl?.endsWith('8545');
};

/**
 * @desc returns true if the given network is a testnet
 * @param {String} network
 */
export const isTestnet = network => {
  switch (network) {
    case NetworkTypes.goerli:
    case NetworkTypes.kovan:
    case NetworkTypes.rinkeby:
    case NetworkTypes.ropsten:
      return true;
    default:
      return false;
  }
};

/**
 * @desc returns a web3 provider for the specified network
 * @param {String} network
 */
export const getProviderForNetwork = async (network = NetworkTypes.mainnet) => {
  if (networkProviders[network]) {
    return networkProviders[network];
  }
  if (network.startsWith('http://')) {
    const provider = new StaticJsonRpcProvider(network, NetworkTypes.mainnet);
    networkProviders[NetworkTypes.mainnet] = provider;
    return provider;
  } else {
    const chainId = ethereumUtils.getChainIdFromNetwork(network);
    const provider = new StaticJsonRpcProvider(rpcEndpoints[network], chainId);
    if (!networkProviders[network]) {
      networkProviders[network] = provider;
    }
    await provider.ready;
    return provider;
  }
};

export const sendRpcCall = async (payload, provider = null) =>
  (provider || web3Provider).send(payload.method, payload.params);

/**
 * @desc check if hex string
 * @param {String} value
 * @return {Boolean}
 */
export const isHexString = value => isEthersHexString(value);

export const toHex = value => BigNumber.from(value).toHexString();

export const isHexStringIgnorePrefix = value => {
  if (!value) return false;
  const trimmedValue = value.trim();
  const updatedValue = addHexPrefix(trimmedValue);
  return isHexString(updatedValue);
};

export const addHexPrefix = value =>
  startsWith(value, '0x') ? value : `0x${value}`;

/**
 * @desc is valid mnemonic
 * @param {String} value
 * @return {Boolean}
 */
export const isValidMnemonic = value => ethersIsValidMnemonic(value);

/**
 * @desc convert to checksum address
 * @param  {String} address
 * @return {String} checksum address
 */
export const toChecksumAddress = address => {
  try {
    return getAddress(address);
  } catch (error) {
    return null;
  }
};

/**
 * @desc estimate gas limit
 * @param  {String} address
 * @return {String} gas limit
 */
export const estimateGas = async (estimateGasData, provider = null) => {
  try {
    const p = provider || web3Provider;
    const gasLimit = await p.estimateGas(estimateGasData);
    return gasLimit.toString();
  } catch (error) {
    return null;
  }
};

export const estimateGasWithPadding = async (
  txPayload,
  contractCallEstimateGas = null,
  callArguments = null,
  provider = null,
  paddingFactor = 1.1
) => {
  try {
    const p = provider || web3Provider;
    const txPayloadToEstimate = { ...txPayload };
    const { gasLimit } = await p.getBlock();
    const { to, data } = txPayloadToEstimate;
    // 1 - Check if the receiver is a contract
    const code = to ? await p.getCode(to) : undefined;
    // 2 - if it's not a contract AND it doesn't have any data use the default gas limit
    if (
      (!contractCallEstimateGas && !to) ||
      (to && !data && (!code || code === '0x'))
    ) {
      logger.sentry(
        '⛽ Skipping estimates, using default',
        ethUnits.basic_tx.toString()
      );
      return ethUnits.basic_tx.toString();
    }

    logger.sentry('⛽ Calculating safer gas limit for last block');
    // 3 - If it is a contract, call the RPC method `estimateGas` with a safe value
    const saferGasLimit = fraction(gasLimit.toString(), 19, 20);
    logger.sentry('⛽ safer gas limit for last block is', saferGasLimit);

    txPayloadToEstimate[contractCallEstimateGas ? 'gasLimit' : 'gas'] = toHex(
      saferGasLimit
    );

    const estimatedGas = await (contractCallEstimateGas
      ? contractCallEstimateGas(...callArguments, txPayloadToEstimate)
      : p.estimateGas(txPayloadToEstimate));

    const lastBlockGasLimit = addBuffer(gasLimit.toString(), 0.9);
    const paddedGas = addBuffer(
      estimatedGas.toString(),
      paddingFactor.toString()
    );
    logger.sentry('⛽ GAS CALCULATIONS!', {
      estimatedGas: estimatedGas.toString(),
      gasLimit: gasLimit.toString(),
      lastBlockGasLimit: lastBlockGasLimit,
      paddedGas: paddedGas,
    });
    // If the safe estimation is above the last block gas limit, use it
    if (greaterThan(estimatedGas, lastBlockGasLimit)) {
      logger.sentry(
        '⛽ returning orginal gas estimation',
        estimatedGas.toString()
      );
      return estimatedGas.toString();
    }
    // If the estimation is below the last block gas limit, use the padded estimate
    if (greaterThan(lastBlockGasLimit, paddedGas)) {
      logger.sentry('⛽ returning padded gas estimation', paddedGas);
      return paddedGas;
    }
    // otherwise default to the last block gas limit
    logger.sentry('⛽ returning last block gas limit', lastBlockGasLimit);
    return lastBlockGasLimit;
  } catch (error) {
    logger.error('Error calculating gas limit with padding', error);
    return null;
  }
};

/**
 * @desc convert from ether to wei
 * @param  {String} value in ether
 * @return {String} value in wei
 */
export const toWei = ether => {
  const result = parseEther(ether);
  return result.toString();
};

/**
 * @desc get transaction info
 * @param {String} hash
 * @return {Promise}
 */
export const getTransaction = hash => web3Provider.getTransaction(hash);

/**
 * @desc get address transaction count
 * @param {String} address
 * @return {Promise}
 */
export const getTransactionCount = address =>
  web3Provider.getTransactionCount(address, 'pending');

/**
 * get transaction gas params depending on network
 * @returns - object with `gasPrice` or `maxFeePerGas` and `maxPriorityFeePerGas`
 */
export const getTransactionGasParams = transaction => {
  return isEIP1559LegacyNetwork(transaction.network)
    ? {
        gasPrice: toHex(transaction.gasPrice),
      }
    : {
        maxFeePerGas: toHex(transaction.maxFeePerGas),
        maxPriorityFeePerGas: toHex(transaction.maxPriorityFeePerGas),
      };
};

const getTxDetails = async transaction => {
  const { to } = transaction;
  const data = transaction.data ? transaction.data : '0x';
  const value = transaction.amount ? toHex(toWei(transaction.amount)) : '0x0';
  const gasLimit = transaction.gasLimit
    ? toHex(transaction.gasLimit)
    : undefined;
  const baseTx = {
    data,
    gasLimit,
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

export const resolveUnstoppableDomain = async domain => {
  const resolution = new UnstoppableResolution({
    blockchain: {
      cns: {
        network: 'mainnet',
        url: rpcEndpoints[NetworkTypes.mainnet],
      },
    },
  });

  const res = resolution
    .addr(domain, 'ETH')
    .then(address => {
      return address;
    })
    .catch(error => logger.error(error));
  return res;
};

export const resolveNameOrAddress = async (nameOrAddress, provider) => {
  if (!isHexString(nameOrAddress)) {
    if (isUnstoppableAddressFormat(nameOrAddress)) {
      return resolveUnstoppableDomain(nameOrAddress);
    }
    const p = provider || web3Provider;
    return p.resolveName(nameOrAddress);
  }
  return nameOrAddress;
};

export const getTransferNftTransaction = async transaction => {
  const recipient = await resolveNameOrAddress(transaction.to);
  const { from } = transaction;
  const contractAddress = get(transaction, 'asset.asset_contract.address');
  const data = getDataForNftTransfer(from, recipient, transaction.asset);
  const gasParams = getTransactionGasParams(transaction);
  return {
    data,
    from,
    gasLimit: transaction.gasLimit,
    network: transaction.network,
    to: contractAddress,
    ...gasParams,
  };
};

export const getTransferTokenTransaction = async transaction => {
  const value = convertAmountToRawAmount(
    transaction.amount,
    transaction.asset.decimals
  );
  const recipient = await resolveNameOrAddress(transaction.to);
  const data = getDataForTokenTransfer(value, recipient);
  const gasParams = getTransactionGasParams(transaction);
  return {
    data,
    from: transaction.from,
    gasLimit: transaction.gasLimit,
    network: transaction.network,
    to: transaction.asset.address,
    ...gasParams,
  };
};

/**
 * @desc transform into signable transaction
 * @param {Object} transaction { asset, from, to, amount, gasPrice }
 * @return {Promise}
 */
export const createSignableTransaction = async transaction => {
  if (
    get(transaction, 'asset.address') === ETH_ADDRESS ||
    get(transaction, 'asset.address') === ARBITRUM_ETH_ADDRESS ||
    get(transaction, 'asset.address') === OPTIMISM_ETH_ADDRESS ||
    get(transaction, 'asset.address') === MATIC_POLYGON_ADDRESS
  ) {
    return getTxDetails(transaction);
  }
  const isNft = get(transaction, 'asset.type') === AssetTypes.nft;
  const result = isNft
    ? await getTransferNftTransaction(transaction)
    : await getTransferTokenTransaction(transaction);
  return getTxDetails(result);
};

const estimateAssetBalancePortion = asset => {
  if (!(asset.type === AssetTypes.nft)) {
    const assetBalance = get(asset, 'balance.amount');
    const decimals = get(asset, 'decimals');
    const portion = multiply(assetBalance, 0.1);
    const trimmed = handleSignificantDecimals(portion, decimals);
    return convertAmountToRawAmount(trimmed, decimals);
  }
  return '0';
};

export const getDataForTokenTransfer = (value, to) => {
  const transferMethodHash = smartContractMethods.token_transfer.hash;
  const data = ethereumUtils.getDataString(transferMethodHash, [
    ethereumUtils.removeHexPrefix(to),
    convertStringToHex(value),
  ]);
  return data;
};

export const getDataForNftTransfer = (from, to, asset) => {
  const nftVersion = get(asset, 'asset_contract.nft_version');
  const schema_name = get(asset, 'asset_contract.schema_name');
  if (nftVersion === '3.0') {
    const transferMethodHash = smartContractMethods.nft_transfer_from.hash;
    const data = ethereumUtils.getDataString(transferMethodHash, [
      ethereumUtils.removeHexPrefix(from),
      ethereumUtils.removeHexPrefix(to),
      convertStringToHex(asset.id),
    ]);
    return data;
  } else if (schema_name === 'ERC1155') {
    const transferMethodHash =
      smartContractMethods.erc1155_safe_transfer_from.hash;
    const data = ethereumUtils.getDataString(transferMethodHash, [
      ethereumUtils.removeHexPrefix(from),
      ethereumUtils.removeHexPrefix(to),
      convertStringToHex(asset.id),
      convertStringToHex('1'),
      convertStringToHex('160'),
      convertStringToHex('0'),
    ]);
    return data;
  }
  const transferMethodHash = smartContractMethods.nft_transfer.hash;
  const data = ethereumUtils.getDataString(transferMethodHash, [
    ethereumUtils.removeHexPrefix(to),
    convertStringToHex(asset.id),
  ]);
  return data;
};

/**
 * @desc build transaction object
 * @param {Object} [{address, amount, asset, gasLimit, recipient}]
 * @param {Provider} provider
 * @param {String} network
 * @return {String}
 */

export const buildTransaction = async (
  { address, amount, asset, gasLimit, recipient },
  provider,
  network
) => {
  const _amount =
    amount && Number(amount)
      ? convertAmountToRawAmount(amount, asset.decimals)
      : estimateAssetBalancePortion(asset);
  const value = _amount.toString();
  const _recipient = await resolveNameOrAddress(recipient, provider);
  let txData = {
    data: '0x',
    from: address,
    to: _recipient,
    value,
  };
  if (asset.type === AssetTypes.nft) {
    const contractAddress = get(asset, 'asset_contract.address');
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
 * @desc estimate gas limit
 * @param {Object} [{ address, amount, asset, recipient }]
 * @return {String}
 */
export const estimateGasLimit = async (
  { address, amount, asset, recipient },
  addPadding = false,
  provider = null,
  network = NetworkTypes.mainnet
) => {
  const estimateGasData = await buildTransaction(
    { address, amount, asset, recipient },
    provider,
    network
  );
  if (addPadding) {
    return estimateGasWithPadding(estimateGasData, null, null, provider);
  } else {
    return estimateGas(estimateGasData, provider);
  }
};
