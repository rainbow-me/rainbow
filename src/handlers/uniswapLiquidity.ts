import { arrayify } from '@ethersproject/bytes';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { fill, join } from 'lodash';
import { addHexPrefix, toHex, web3Provider } from './web3';
import { getQuote } from './zeroEx';
import {
  TransactionParams,
  UniswapPair,
  ZeroExPayload,
} from '@rainbow-me/entities';
import {
  ETH_ADDRESS,
  WETH_ADDRESS,
  ZAP_IN_ABI,
  ZAP_IN_ADDRESS,
  ZERO_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';

const determineBuyToken = (
  fromTokenAddress: string,
  pair: UniswapPair
): string => {
  const tokenA = pair.tokens[0];
  const tokenB = pair.tokens[1];
  const isFromETH = fromTokenAddress === ETH_ADDRESS;
  if (!isFromETH && fromTokenAddress === tokenA.address) return tokenA.address;
  if (!isFromETH && fromTokenAddress === tokenB.address) return tokenB.address;
  if (tokenA.address === ETH_ADDRESS || tokenB.address === ETH_ADDRESS)
    return WETH_ADDRESS;
  return tokenB.address;
};

export const depositToPool = async (
  fromTokenAddress: string,
  pair: UniswapPair,
  fromAmount: string,
  network: string,
  transactionParams: TransactionParams,
  estimateGas = false,
  wallet: Wallet | null = null
) => {
  const buyToken = determineBuyToken(fromTokenAddress, pair);

  const firstSwapDetails = await getQuote(
    network,
    fromTokenAddress,
    buyToken,
    fromAmount
  );

  if (!firstSwapDetails) return null;

  const minPoolTokens = '1';
  try {
    const result = await executeDepositZap(
      fromTokenAddress,
      fromAmount,
      pair.address,
      firstSwapDetails,
      minPoolTokens,
      transactionParams,
      estimateGas,
      wallet
    );
    return estimateGas && result ? result.toString() : result;
  } catch (error) {
    logger.log('Error depositing to Uniswap liquidity', error);
    return null;
  }
};

const executeDepositZap = (
  fromTokenAddress: string,
  fromAmount: string,
  pairAddress: string,
  firstSwapDetails: ZeroExPayload,
  minPoolTokens: string,
  transactionParams: TransactionParams,
  estimateGas = false,
  wallet: Wallet | null
) => {
  const fromAddress =
    fromTokenAddress === ETH_ADDRESS ? ZERO_ADDRESS : fromTokenAddress;
  const sellTokenAmount = fromTokenAddress === ETH_ADDRESS ? '0' : fromAmount;
  const ethValue = fromTokenAddress === ETH_ADDRESS ? fromAmount : '0';
  const _transactionParams = {
    ...transactionParams,
    value: toHex(ethValue),
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
    remainingPaddingLength !== 64
      ? join(fill(Array(remainingPaddingLength), '0'), '')
      : '';
  const swapData = `${rawSwapData}${remainingPadding}`;
  const swapDataBytes = arrayify(addHexPrefix(swapData));

  const providerOrSigner = !estimateGas && wallet ? wallet : web3Provider;
  const zapInContract = new Contract(
    ZAP_IN_ADDRESS,
    ZAP_IN_ABI,
    providerOrSigner
  );
  return estimateGas
    ? zapInContract.estimateGas.ZapIn(
        fromAddress,
        pairAddress,
        sellTokenAmount,
        minPoolTokens,
        allowanceTarget,
        swapTarget,
        swapDataBytes,
        _transactionParams
      )
    : zapInContract.ZapIn(
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
