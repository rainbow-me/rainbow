import { arrayify } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { ChainId, Pair, Token, WETH } from '@uniswap/sdk';
import { fill, join } from 'lodash';
import { addHexPrefix, web3Provider } from './web3';
import { getQuote } from './zeroEx';
import { TransactionParams, ZeroExPayload } from '@rainbow-me/entities';
import {
  ETH_ADDRESS,
  WETH_ADDRESS,
  ZAP_IN_ABI,
  ZapInAddress,
  ZERO_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

const determineBuyToken = (
  tokenA: Token,
  tokenB: Token,
  chainId: ChainId
): string => {
  if (tokenA.equals(WETH[chainId]) || tokenB.equals(WETH[chainId]))
    return WETH_ADDRESS;
  return tokenB.address;
};

export const depositToPool = async (
  fromTokenAddress: string,
  tokenA: Token,
  tokenB: Token,
  chainId: ChainId,
  fromAmount: string,
  network: string,
  transactionParams: TransactionParams
) => {
  const buyToken = determineBuyToken(tokenA, tokenB, chainId);

  const firstSwapDetails = await getQuote(
    network,
    fromTokenAddress,
    buyToken,
    fromAmount
  );

  if (!firstSwapDetails) return null;

  const pairAddress = Pair.getAddress(tokenA, tokenB);
  const minPoolTokens = '1';
  try {
    const result = executeDepositZap(
      fromTokenAddress,
      fromAmount,
      pairAddress,
      firstSwapDetails,
      minPoolTokens,
      transactionParams
    );
    return result;
  } catch (error) {
    logger.log('Error depositing ETH to zap', error);
    return null;
  }
};

export const executeDepositZap = (
  fromTokenAddress: string,
  fromAmount: string,
  pairAddress: string,
  firstSwapDetails: ZeroExPayload,
  minPoolTokens: string,
  transactionParams: TransactionParams
) => {
  const fromAddress =
    fromTokenAddress === ETH_ADDRESS ? ZERO_ADDRESS : fromTokenAddress;
  const sellTokenAmount = fromTokenAddress === ETH_ADDRESS ? '0' : fromAmount;
  const ethValue = fromTokenAddress === ETH_ADDRESS ? fromAmount : '0';
  const _transactionParams = {
    ...transactionParams,
    value: ethValue,
  };

  const { swapTarget, allowanceTarget, swapPayload } = firstSwapDetails;
  const rawSwapPayload = ethereumUtils.removeHexPrefix(swapPayload);

  // 224 bytes = 7 (6 args and offset indicator itself) * 32 bytes
  const offsetBytes = 224;
  const dataBytes = rawSwapPayload.length / 2;

  const offset = ethereumUtils.padLeft(offsetBytes.toString(16), 64);
  const dataLength = ethereumUtils.padLeft(dataBytes.toString(16), 64);

  const rawSwapData = `${offset}${dataLength}${rawSwapPayload}`;
  const remainingPaddingLength = 64 - (rawSwapData.length % 64);
  const remainingPadding =
    remainingPaddingLength === 64
      ? join(fill(Array(remainingPaddingLength), '0'), '')
      : '';
  const swapData = `${rawSwapData}${remainingPadding}`;
  const swapDataBytes = arrayify(addHexPrefix(swapData));

  const zapInContract = new Contract(ZapInAddress, ZAP_IN_ABI, web3Provider);
  return zapInContract.callStatic.ZapIn(
    fromAddress,
    pairAddress,
    sellTokenAmount,
    minPoolTokens,
    allowanceTarget,
    swapTarget,
    swapDataBytes,
    _transactionParams
  );
};
