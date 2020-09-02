import { ethers } from 'ethers';
import { get, replace, startsWith } from 'lodash';
import { INFURA_PROJECT_ID, INFURA_PROJECT_ID_DEV } from 'react-native-dotenv';
import AssetTypes from '../helpers/assetTypes';
import NetworkTypes from '../helpers/networkTypes';
import {
  convertAmountToRawAmount,
  convertStringToHex,
  handleSignificantDecimals,
  multiply,
} from '../helpers/utilities';
import smartContractMethods from '../references/smartcontract-methods.json';
import { ethereumUtils } from '../utils';

const infuraProjectId = __DEV__ ? INFURA_PROJECT_ID_DEV : INFURA_PROJECT_ID;
const infuraUrl = `https://network.infura.io/v3/${infuraProjectId}`;
/**
 * @desc web3 http instance
 */
export let web3Provider = new ethers.providers.JsonRpcProvider(
  replace(infuraUrl, 'network', NetworkTypes.mainnet)
);

/**
 * @desc set a different web3 provider
 * @param {String} network
 */
export const web3SetHttpProvider = async network => {
  if (network.startsWith('http://')) {
    web3Provider = new ethers.providers.JsonRpcProvider(network);
  } else {
    web3Provider = new ethers.providers.JsonRpcProvider(
      replace(infuraUrl, 'network', network)
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
export const isHexString = value => ethers.utils.isHexString(value);

export const isHexStringIgnorePrefix = value => {
  if (!value) return false;
  const trimmedValue = value.trim();
  const updatedValue = addHexPrefix(trimmedValue);
  return isHexString(updatedValue);
};

export const addHexPrefix = value =>
  startsWith(value, '0x') ? value : `0x${value}`;

export const mnemonicToSeed = value =>
  ethers.utils.HDNode.mnemonicToSeed(value);

/**
 * @desc is valid mnemonic
 * @param {String} value
 * @return {Boolean}
 */
export const isValidMnemonic = value =>
  ethers.utils.HDNode.isValidMnemonic(value);

/**
 * @desc convert to checksum address
 * @param  {String} address
 * @return {String} checksum address
 */
export const toChecksumAddress = address => {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    return null;
  }
};

/**
 * @desc convert to hex representation
 * @param  {String|Number} value
 * @return {String} hex value
 */
export const toHex = value =>
  ethers.utils.hexlify(ethers.utils.bigNumberify(value));

/**
 * @desc estimate gas limit
 * @param  {String} address
 * @return {Number} gas limit
 */
export const estimateGas = async estimateGasData => {
  try {
    const gasLimit = await web3Provider.estimateGas(estimateGasData);
    return gasLimit.toNumber();
  } catch (error) {
    return null;
  }
};

/**
 * @desc convert from ether to wei
 * @param  {String} value in ether
 * @return {String} value in wei
 */
export const toWei = ether => {
  const result = ethers.utils.parseEther(ether);
  return result.toString();
};

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
  const { from, to } = transaction;
  const data = transaction.data ? transaction.data : '0x';
  const value = transaction.amount ? toWei(transaction.amount) : '0x00';
  const gasLimit = transaction.gasLimit
    ? toHex(transaction.gasLimit)
    : undefined;
  const gasPrice = transaction.gasPrice
    ? toHex(transaction.gasPrice)
    : undefined;
  const nonce = await getTransactionCount(from);
  const tx = {
    data,
    gasLimit,
    gasPrice,
    nonce: toHex(nonce),
    to,
    value: toHex(value),
  };
  return tx;
};

const resolveNameOrAddress = async nameOrAddress => {
  if (!isHexString(nameOrAddress)) {
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
  if (nftVersion === '3.0') {
    const transferMethodHash = smartContractMethods.nft_transfer_from.hash;
    const data = ethereumUtils.getDataString(transferMethodHash, [
      ethereumUtils.removeHexPrefix(from),
      ethereumUtils.removeHexPrefix(to),
      convertStringToHex(asset.id),
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
export const estimateGasLimit = async ({
  asset,
  address,
  recipient,
  amount,
}) => {
  const _amount =
    amount && Number(amount)
      ? convertAmountToRawAmount(amount, asset.decimals)
      : estimateAssetBalancePortion(asset);
  const value = _amount.toString();
  let _recipient = await resolveNameOrAddress(recipient);
  _recipient = _recipient || '0x737e583620f4ac1842d4e354789ca0c5e0651fbb';
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
  return estimateGas(estimateGasData);
};
