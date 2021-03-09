import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { isHexString as isEthersHexString } from '@ethersproject/bytes';
import { isValidMnemonic as ethersIsValidMnemonic } from '@ethersproject/hdnode';
import { JsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from '@ethersproject/units';
import UnstoppableResolution from '@unstoppabledomains/resolution';
import { get, replace, startsWith } from 'lodash';
import { INFURA_PROJECT_ID, INFURA_PROJECT_ID_DEV } from 'react-native-dotenv';
import { AssetTypes } from '@rainbow-me/entities';
import NetworkTypes from '@rainbow-me/helpers/networkTypes';
import { ethUnits, smartContractMethods } from '@rainbow-me/references';
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

const infuraProjectId = __DEV__ ? INFURA_PROJECT_ID_DEV : INFURA_PROJECT_ID;
const infuraUrl = `https://network.infura.io/v3/${infuraProjectId}`;
/**
 * @desc web3 http instance
 */
export let web3Provider = new JsonRpcProvider(
  replace(infuraUrl, 'network', NetworkTypes.mainnet),
  NetworkTypes.mainnet
);

/**
 * @desc set a different web3 provider
 * @param {String} network
 */
export const web3SetHttpProvider = async network => {
  if (network.startsWith('http://')) {
    web3Provider = new JsonRpcProvider(network, NetworkTypes.mainnet);
  } else {
    web3Provider = new JsonRpcProvider(
      replace(infuraUrl, 'network', network),
      network
    );
  }
  return web3Provider.ready;
};

export const sendRpcCall = async payload =>
  web3Provider.send(payload.method, payload.params);

export const getTransactionReceipt = txHash =>
  sendRpcCall({
    method: 'eth_getTransactionReceipt',
    params: [txHash],
  });

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
export const estimateGas = async estimateGasData => {
  try {
    const gasLimit = await web3Provider.estimateGas(estimateGasData);
    return gasLimit.toString();
  } catch (error) {
    return null;
  }
};

export const estimateGasWithPadding = async (
  txPayload,
  paddingFactor = 1.1
) => {
  try {
    const txPayloadToEstimate = { ...txPayload };
    const { gasLimit } = await web3Provider.getBlock();
    const { to, data } = txPayloadToEstimate;
    // 1 - Check if the receiver is a contract
    const code = to ? await web3Provider.getCode(to) : undefined;
    // 2 - if it's not a contract AND it doesn't have any data use the default gas limit
    if (!to || (to && !data && (!code || code === '0x'))) {
      logger.log(
        '⛽ Skipping estimates, using default',
        ethUnits.basic_tx.toString()
      );
      return ethUnits.basic_tx.toString();
    }
    logger.log('⛽ Calculating safer gas limit for last block');
    // 3 - If it is a contract, call the RPC method `estimateGas` with a safe value
    const saferGasLimit = fraction(gasLimit.toString(), 19, 20);
    logger.log('⛽ safer gas limit for last block is', saferGasLimit);

    txPayloadToEstimate.gas = toHex(saferGasLimit);
    const estimatedGas = await web3Provider.estimateGas(txPayloadToEstimate);

    const lastBlockGasLimit = addBuffer(gasLimit.toString(), 0.9);
    const paddedGas = addBuffer(
      estimatedGas.toString(),
      paddingFactor.toString()
    );
    logger.log('⛽ GAS CALCULATIONS!', {
      estimatedGas: estimatedGas.toString(),
      gasLimit: gasLimit.toString(),
      lastBlockGasLimit: lastBlockGasLimit,
      paddedGas: paddedGas,
    });
    // If the safe estimation is above the last block gas limit, use it
    if (greaterThan(estimatedGas, lastBlockGasLimit)) {
      logger.log(
        '⛽ returning orginal gas estimation',
        estimatedGas.toString()
      );
      return estimatedGas.toString();
    }
    // If the estimation is below the last block gas limit, use the padded estimate
    if (greaterThan(lastBlockGasLimit, paddedGas)) {
      logger.log('⛽ returning padded gas estimation', paddedGas);
      return paddedGas;
    }
    // otherwise default to the last block gas limit
    logger.log('⛽ returning last block gas limit', lastBlockGasLimit);
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
 * @desc get transaction details
 * @param  {Object} transaction { from, to, data, value, gasPrice, gasLimit }
 * @return {Object}
 */
export const getTxDetails = async transaction => {
  const { to } = transaction;
  const data = transaction.data ? transaction.data : '0x';
  const value = transaction.amount ? toHex(toWei(transaction.amount)) : '0x00';
  const gasLimit = toHex(transaction.gasLimit) || undefined;
  const gasPrice = toHex(transaction.gasPrice) || undefined;
  const tx = {
    data,
    gasLimit,
    gasPrice,
    to,
    value,
  };
  return tx;
};

export const resolveUnstoppableDomain = async domain => {
  const resolution = new UnstoppableResolution({
    blockchain: {
      cns: {
        network: 'mainnet',
        url: replace(infuraUrl, 'network', NetworkTypes.mainnet),
      },
    },
  });

  const res = resolution
    .addr(domain, 'ETH')
    .then(address => {
      return address;
    })
    .catch(logger.error);
  return res;
};

const resolveNameOrAddress = async nameOrAddress => {
  if (!isHexString(nameOrAddress)) {
    if (/^([\w-]+\.)+(crypto)$/.test(nameOrAddress)) {
      return resolveUnstoppableDomain(nameOrAddress);
    }
    return web3Provider.resolveName(nameOrAddress);
  }
  return nameOrAddress;
};

/**
 * @desc get transfer nft transaction
 * @param  {Object}  transaction { asset, from, to, gasPrice }
 * @return {Object}
 */
export const getTransferNftTransaction = async transaction => {
  const recipient = await resolveNameOrAddress(transaction.to);
  const { from } = transaction;
  const contractAddress = get(transaction, 'asset.asset_contract.address');
  const data = getDataForNftTransfer(from, recipient, transaction.asset);
  return {
    data,
    from,
    gasLimit: transaction.gasLimit,
    gasPrice: transaction.gasPrice,
    to: contractAddress,
  };
};

/**
 * @desc get transfer token transaction
 * @param  {Object}  transaction { asset, from, to, amount, gasPrice }
 * @return {Object}
 */
export const getTransferTokenTransaction = async transaction => {
  const value = convertAmountToRawAmount(
    transaction.amount,
    transaction.asset.decimals
  );
  const recipient = await resolveNameOrAddress(transaction.to);
  const data = getDataForTokenTransfer(value, recipient);
  return {
    data,
    from: transaction.from,
    gasLimit: transaction.gasLimit,
    gasPrice: transaction.gasPrice,
    to: transaction.asset.address,
  };
};

/**
 * @desc transform into signable transaction
 * @param {Object} transaction { asset, from, to, amount, gasPrice }
 * @return {Promise}
 */
export const createSignableTransaction = async transaction => {
  if (get(transaction, 'asset.address') === 'eth') {
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
 * @desc estimate gas limit
 * @param {Object} [{selected, address, recipient, amount, gasPrice}]
 * @return {String}
 */
export const estimateGasLimit = async (
  { asset, address, recipient, amount },
  addPadding = false
) => {
  const _amount =
    amount && Number(amount)
      ? convertAmountToRawAmount(amount, asset.decimals)
      : estimateAssetBalancePortion(asset);
  const value = _amount.toString();
  const _recipient = await resolveNameOrAddress(recipient);
  let estimateGasData = {
    data: '0x',
    from: address,
    to: _recipient,
    value,
  };
  if (asset.type === AssetTypes.nft) {
    const contractAddress = get(asset, 'asset_contract.address');
    const data = getDataForNftTransfer(address, _recipient, asset);
    estimateGasData = {
      data,
      from: address,
      to: contractAddress,
    };
  } else if (asset.symbol !== 'ETH') {
    const transferData = getDataForTokenTransfer(value, _recipient);
    estimateGasData = {
      data: transferData,
      from: address,
      to: asset.address,
      value: '0x0',
    };
  }
  if (addPadding) {
    return estimateGasWithPadding(estimateGasData);
  } else {
    return estimateGas(estimateGasData);
  }
};
