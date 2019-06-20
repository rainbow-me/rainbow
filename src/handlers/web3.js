import { ethers } from 'ethers';
import { get, replace } from 'lodash';
import { REACT_APP_INFURA_PROJECT_ID } from 'react-native-dotenv';
import { ethereumUtils } from '../utils';
import {
  convertAmountToRawAmount,
  convertStringToNumber,
  convertNumberToString,
  convertHexToString,
  convertStringToHex,
  handleSignificantDecimals,
  multiply,
} from '../helpers/utilities';
import ethUnits from '../references/ethereum-units.json';
import smartContractMethods from '../references/smartcontract-methods.json';

const infura_url = `https://network.infura.io/v3/${REACT_APP_INFURA_PROJECT_ID}`;

/**
 * @desc web3 http instance
 */
export let web3Provider = new ethers.providers.JsonRpcProvider(replace(infura_url, 'network', 'mainnet'));

/**
 * @desc set a different web3 provider
 * @param {String} network
 */
export const web3SetHttpProvider = network => {
  // TODO check network is valid network
  web3Provider = new ethers.providers.JsonRpcProvider(replace(infura_url, 'network', network));
};

/**
 * @desc check if hex string
 * @param {String} value
 * @return {Boolean}
 */
export const isHexString = value => ethers.utils.isHexString(value);

/**
 * @desc convert to checksum address
 * @param  {String} address
 * @return {String} checksum address
 */
export const toChecksumAddress = async (address) => {
  try {
    return await ethers.utils.getAddress(address);
  } catch (error) {
    return null;
  }
};

/**
 * @desc convert to hex representation
 * @param  {String|Number} value
 * @return {String} hex value
 */
export const toHex = value => ethers.utils.hexlify(ethers.utils.bigNumberify(value));

/**
 * @desc estimate gas limit
 * @param  {String} address
 * @return {Number} gas limit
 */
export const estimateGas = async (estimateGasData) => {
  try {
    const gasLimit = await web3Provider.estimateGas(estimateGasData);
    return gasLimit.toNumber();
  } catch (error) {
    return 21000;
  };
};

/**
 * @desc get gas price
 * @return {String} gas price
 */
export const getGasPrice = async () => {
  const gasPrice = await web3Provider.getGasPrice();
  return gasPrice.toString();
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
export const getTxDetails = async (transaction) => {
  const from = transaction.from;
  const to = transaction.to;
  const data = transaction.data ? transaction.data : '0x';
  const value = transaction.amount ? toWei(transaction.amount) : '0x00';
  const estimateGasData = { from, to, data, value };
  const _gasLimit =
    transaction.gasLimit || (await estimateGas(estimateGasData));
  const _gasPrice = transaction.gasPrice || (await getGasPrice());
  const nonce = await getTransactionCount(from);
  const tx = {
    data,
    gasLimit: toHex(_gasLimit),
    gasPrice: toHex(_gasPrice),
    nonce: toHex(nonce),
    to,
    value: toHex(value),
  };
  return tx;
};

export const resolveNameOrAddress = async (nameOrAddress) => {
  if (!isHexString(nameOrAddress)) {
    return await web3Provider.resolveName(nameOrAddress);
  }
  return nameOrAddress;
};

/**
 * @desc get transfer nft transaction
 * @param  {Object}  transaction { asset, from, to, gasPrice }
 * @return {Object}
 */
export const getTransferNftTransaction = async (transaction) => {
  let recipient = await resolveNameOrAddress(transaction.to);
  let from = transaction.from;
  const contractAddress = get(transaction, 'asset.asset_contract.address');
  const data = getDataForNftTransfer(from, recipient, transaction.asset);
  return {
    from,
    to: contractAddress,
    data,
    gasPrice: transaction.gasPrice,
    gasLimit: transaction.gasLimit,
  };
};

/**
 * @desc get transfer token transaction
 * @param  {Object}  transaction { asset, from, to, amount, gasPrice }
 * @return {Object}
 */
export const getTransferTokenTransaction = async (transaction) => {
  const value = convertAmountToRawAmount(transaction.amount, transaction.asset.decimals);
  let recipient = await resolveNameOrAddress(transaction.to);
  const data = getDataForTokenTransfer(value, recipient);
  return {
    from: transaction.from,
    to: transaction.asset.address,
    data,
    gasPrice: transaction.gasPrice,
    gasLimit: transaction.gasLimit,
  };
};

/**
 * @desc transform into signable transaction
 * @param {Object} transaction { asset, from, to, amount, gasPrice }
 * @return {Promise}
 */
export const createSignableTransaction = async (transaction) => {
  if (get(transaction, 'asset.address') === 'eth') {
    return await getTxDetails(transaction);
  }
  const isNft = get(transaction, 'asset.isNft', false);
  const result = isNft ? await getTransferNftTransaction(transaction) :
    await getTransferTokenTransaction(transaction);
  return await getTxDetails(result)
};

const estimateAssetBalancePortion = (asset) => {
  if (!asset.isNft) {
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
  if (nftVersion === "3.0") {
    const transferMethodHash = smartContractMethods.nft_transfer_from.hash;
    const data = ethereumUtils.getDataString(transferMethodHash, [
      ethereumUtils.removeHexPrefix(from),
      ethereumUtils.removeHexPrefix(to),
      convertStringToHex(asset.id)
    ]);
    return data;
  }
  const transferMethodHash = smartContractMethods.nft_transfer.hash;
  const data = ethereumUtils.getDataString(transferMethodHash, [
    ethereumUtils.removeHexPrefix(to),
    convertStringToHex(asset.id)
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
  let gasLimit = ethUnits.basic_tx;
  let data = '0x';
  let _amount =
    amount && Number(amount)
      ? convertAmountToRawAmount(amount, asset.decimals)
      : estimateAssetBalancePortion(asset);
  let value = _amount.toString();
  let _recipient = await resolveNameOrAddress(recipient);
  _recipient = _recipient
      ? _recipient
      : '0x737e583620f4ac1842d4e354789ca0c5e0651fbb';
  let estimateGasData = { from: address, to: _recipient, data, value };
  if (asset.isNft) {
    const contractAddress = get(asset, 'asset_contract.address');
    const data = getDataForNftTransfer(address, _recipient, asset);
    estimateGasData = { from: address, to: contractAddress, data };
  } else if (asset.symbol !== 'ETH') {
    const data = getDataForTokenTransfer(value, _recipient);
    estimateGasData = { from: address, to: asset.address, data, value: '0x0' };
  }
  return await estimateGas(estimateGasData);
};
