import { ethers } from 'ethers';
import { web3Provider } from '../handlers/web3';
import { convertRawAmountToDecimalFormat } from '../helpers/utilities';
import { loadWallet } from '../model/wallet';
import erc20ABI from '../references/erc20-abi.json';

const estimateApproveWithExchange = (spender, exchange) =>
  exchange.estimate.approve(spender, ethers.constants.MaxUint256);

const estimateApprove = (tokenAddress, spender) => {
  const exchange = new ethers.Contract(tokenAddress, erc20ABI, web3Provider);
  return estimateApproveWithExchange(spender, exchange);
};

const approve = async (tokenAddress, spender) => {
  const wallet = await loadWallet();
  if (!wallet) return null;
  const exchange = new ethers.Contract(tokenAddress, erc20ABI, wallet);
  const gasLimit = await estimateApproveWithExchange(spender, exchange);
  return exchange.approve(spender, ethers.constants.MaxUint256, { gasLimit });
};

const getAllowance = async (owner, token, spender) => {
  const { address: tokenAddress, decimals } = token;
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20ABI,
    web3Provider
  );
  const allowance = await tokenContract.allowance(owner, spender);
  const rawAllowance = ethers.utils.bigNumberify(allowance.toString());
  return convertRawAmountToDecimalFormat(rawAllowance, decimals);
};

export default {
  approve,
  estimateApprove,
  getAllowance,
};
