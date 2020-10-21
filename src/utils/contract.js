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
    const gasLimit = await exchange.estimateGas.approve(spender, MaxUint256);
    return gasLimit ? gasLimit.toString() : ethUnits.basic_approval;
  } catch (error) {
    logger.sentry('error estimateApproveWithExchange');
    captureException(error);
    return ethUnits.basic_approval;
  }
};

const estimateApprove = (tokenAddress, spender) => {
  const exchange = new Contract(tokenAddress, erc20ABI, web3Provider);
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
  const exchange = new Contract(tokenAddress, erc20ABI, walletToUse);
  const approval = await exchange.approve(spender, MaxUint256, {
    gasLimit: toHex(gasLimit) || undefined,
    gasPrice: toHex(gasPrice) || undefined,
  });
  return {
    approval,
    creationTimestamp: Date.now(),
  };
};

const getRawAllowance = async (owner, token, spender) => {
  try {
    const { address: tokenAddress } = token;
    const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance.toString();
  } catch (error) {
    logger.sentry('error getRawAllowance');
    captureException(error);
    return null;
  }
};

export default {
  approve,
  estimateApprove,
  getRawAllowance,
};
