import { find, get } from 'lodash';
import chains from '../references/chains.json'

/**
 * @desc remove hex prefix
 * @param  {String} hex
 * @return {String}
 */
export const removeHexPrefix = hex => hex.toLowerCase().replace('0x', '');

/**
 * @desc get ethereum contract call data string
 * @param  {String} func
 * @param  {Array}  arrVals
 * @return {String}
 */
export const getDataString = (func, arrVals) => {
  let val = '';
  for (let i = 0; i < arrVals.length; i++) val += padLeft(arrVals[i], 64);
  const data = func + val;
  return data;
};

/**
 * @desc get network string from chainId
 * @param  {Number} chainId
 */
export const getNetworkFromChainId = (chainId) => {
  const networkData = find(chains, ['chain_id', chainId]);
  return get(networkData, 'network', 'mainnet');
}

/**
 * @desc get chainId from network string
 * @param  {String} network
 */
export const getChainIdFromNetwork = (network) => {
  const chainData = find(chains, ['network', network]);
  return get(chainData, 'chain_id', 1);
}

export default {
  getChainIdFromNetwork,
  getDataString,
  getNetworkFromChainId,
  removeHexPrefix,
};
