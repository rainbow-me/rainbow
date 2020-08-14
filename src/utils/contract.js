import { MaxUint256 } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { toHex, web3Provider } from '../handlers/web3';
import { loadWallet } from '../model/wallet';
import { ethUnits } from '../references';
import erc20ABI from '../references/erc20-abi.json';
import logger from 'logger';

const estimateApproveWithExchange = async (spender, exchange) => {
  try {
    logger.sentry('exchange estimate approve', { exchange, spender });
    console.log('HI - use the constant', MaxUint256);
    const gasLimit = await exchange.estimate.approve(spender, MaxUint256);
    console.log('HI - gas limit', gasLimit);
    return gasLimit ? gasLimit.toString() : ethUnits.basic_approval;
  } catch (error) {
    logger.sentry('error estimateApproveWithExchange');
    captureException(error);
    return ethUnits.basic_approval;
  }
};

const estimateApprove = (tokenAddress, spender) => {
  console.log('HI - gonna make a contract', tokenAddress);
  const exchange = new Contract(tokenAddress, erc20ABI, web3Provider);
  console.log('HI - exchnage contract', exchange);
  return estimateApproveWithExchange(spender, exchange);
};

const approve = async (
  tokenAddress,
  spender,
  gasLimit,
  gasPrice,
  wallet = null
) => {
  const walletToUse = wallet || (await loadWallet());
  if (!walletToUse) return null;
  console.log('HI - gonna make a contract', tokenAddress);
  const exchange = new Contract(tokenAddress, erc20ABI, walletToUse);
  console.log('HI - exchange contrac tagain', exchange);
  const approval = await exchange.approve(spender, MaxUint256, {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    gasPrice: gasPrice ? toHex(gasPrice) : undefined,
  });
  console.log('HI - approval', approval);
  return {
    approval,
    creationTimestamp: Date.now(),
  };
};

const getRawAllowance = async (owner, token, spender) => {
  const { address: tokenAddress } = token;
  console.log('HI - creating token contract', tokenAddress);
  const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);
  console.log('HI - token contract', tokenContract);
  const allowance = await tokenContract.allowance(owner, spender);
  return allowance.toString();
};

export default {
  approve,
  estimateApprove,
  getRawAllowance,
};
