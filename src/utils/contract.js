import { ethers } from 'ethers';
import { web3Provider } from '../handlers/web3';
import { loadWallet } from '../model/wallet';
import erc20ABI from '../references/erc20-abi.json';

export const getAllowance = async (owner, tokenAddress, spender) => {
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, web3Provider);
  const allowance = await tokenContract.allowance(owner, spender);
  return ethers.utils.bigNumberify(allowance.toString());
};

export const approve = async (tokenAddress, spender) => {
  const wallet = await loadWallet();
  if (!wallet) return null;
  const exchange = new ethers.Contract(tokenAddress, erc20ABI, wallet);
  const gasLimit = await exchange.estimate.approve(spender, ethers.constants.MaxUint256);
  return exchange.approve(spender, ethers.constants.MaxUint256, { gasLimit });
};

