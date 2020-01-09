import { ethers } from 'ethers';
import { toHex, web3Provider } from '../handlers/web3';
import { convertRawAmountToDecimalFormat } from '../helpers/utilities';
import { loadWallet } from '../model/wallet';
import erc20ABI from '../references/erc20-abi.json';

const estimateApproveWithExchange = async (spender, exchange) => {
  try {
    const gasLimit = await exchange.estimate.approve(
      spender,
      ethers.constants.MaxUint256
    );
    return gasLimit ? gasLimit.toString() : null;
  } catch (error) {
    console.log('error estimating approval', error);
    return null;
  }
};

const estimateApprove = (tokenAddress, spender) => {
  const exchange = new ethers.Contract(tokenAddress, erc20ABI, web3Provider);
  return estimateApproveWithExchange(spender, exchange);
};

const approve = async (tokenAddress, spender, gasLimit, gasPrice) => {
  const wallet = await loadWallet();
  if (!wallet) return null;
  const exchange = new ethers.Contract(tokenAddress, erc20ABI, wallet);
  const approval = await exchange.approve(
    spender,
    ethers.constants.MaxUint256,
    {
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      gasPrice: gasPrice ? toHex(gasPrice) : undefined,
    }
  );
  return {
    approval,
    creationTimestamp: Date.now(),
  };
};

const getAllowance = async (owner, token, spender) => {
  const { address: tokenAddress, decimals } = token;
  const tokenContract = new ethers.Contract(
    tokenAddress,
    erc20ABI,
    web3Provider
  );
  const allowance = await tokenContract.allowance(owner, spender);
  return convertRawAmountToDecimalFormat(allowance.toString(), decimals);
};

export default {
  approve,
  estimateApprove,
  getAllowance,
};
