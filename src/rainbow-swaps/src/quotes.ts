/* eslint-disable import/no-extraneous-dependencies */
import { Provider } from '@ethersproject/abstract-provider';
import { BigNumberish } from '@ethersproject/bignumber';
import { Transaction } from '@ethersproject/transactions';
import { ethers, Wallet } from 'ethers';
import RainbowRouterABI from './abi/RainbowRouter.json';
import {
  API_BASE_URL,
  ETH_ADDRESS,
  RAINBOW_ROUTER_CONTRACT_ADDRESS,
} from './utils/constants';

export enum Sources {
  Aggregator0x = '0x',
  Aggregotor1inch = '1inch',
}

export type EthereumAddress = string;

export interface QuoteParams {
  source?: Sources;
  chainId: number;
  fromAddress: EthereumAddress;
  sellTokenAddress: EthereumAddress;
  buyTokenAddress: EthereumAddress;
  sellAmount?: BigNumberish;
  buyAmount?: BigNumberish;
  slippage: number;
}

export interface ProtocolShare {
  name: string;
  part: number;
}

export interface Quote {
  source: Sources;
  from: EthereumAddress;
  to: EthereumAddress;
  data: string;
  value: BigNumberish;
  allowanceTarget: EthereumAddress;
  sellAmount: BigNumberish;
  sellAmountMinusFees: BigNumberish;
  sellTokenAddress: EthereumAddress;
  buyTokenAddress: EthereumAddress;
  buyAmount: BigNumberish;
  fee: BigNumberish;
  feePercentageBasisPoints: number;
  protocols: ProtocolShare[];
  inputTokenDecimals?: number;
  outputTokenDecimals?: number;
}

export interface TransactionOptions {
  gasLimit?: string | number;
  gasPrice?: string;
  nonce?: number;
  value?: number | BigNumberish;
  from?: EthereumAddress;
}

export interface QuoteExecutionDetails {
  method: any;
  methodArgs: (string | number | BigNumberish)[];
  params: TransactionOptions;
}

export const getQuote = async ({
  source,
  chainId = 1,
  fromAddress,
  sellTokenAddress,
  buyTokenAddress,
  sellAmount,
  buyAmount,
  slippage,
}: QuoteParams): Promise<Quote> => {
  let url = `${API_BASE_URL}/quote?chainId=${chainId}&fromAddress=${fromAddress}&buyToken=${buyTokenAddress}&sellToken=${sellTokenAddress}&slippage=${slippage}`;
  if (source) {
    url += `&source=${source}`;
  }
  if (sellAmount) {
    url += `&sellAmount=${sellAmount}`;
  } else if (buyAmount) {
    url += `&buyAmount=${buyAmount}`;
  }
  const response = await fetch(url);
  const quote = await response.json();
  if (!quote.data) {
    Logger.log('ERROR from API', quote);
  }
  return quote;
};

export const fillQuote = async (
  quote: Quote,
  transactionOptions: TransactionOptions,
  wallet: Wallet
): Promise<Transaction> => {
  const instance = new ethers.Contract(
    RAINBOW_ROUTER_CONTRACT_ADDRESS,
    RainbowRouterABI,
    wallet
  );
  let swapTx;

  const {
    sellTokenAddress,
    buyTokenAddress,
    to,
    data,
    sellAmountMinusFees,
    fee,
    value,
    sellAmount,
    feePercentageBasisPoints,
    allowanceTarget,
  } = quote;

  if (sellTokenAddress?.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    console.log('ETH TO TOKEN ===> ', quote);
    swapTx = await instance.fillQuoteEthToToken(
      buyTokenAddress,
      to,
      data,
      sellAmountMinusFees,
      fee,
      {
        ...transactionOptions,
        value: sellAmount,
      }
    );
  } else if (buyTokenAddress?.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    console.log('TOKEN TO ETH ===> ', quote);
    swapTx = await instance.fillQuoteTokenToEth(
      sellTokenAddress,
      allowanceTarget,
      to,
      data,
      sellAmount,
      feePercentageBasisPoints,
      {
        ...transactionOptions,
        value: value,
      }
    );
  } else {
    console.log('TOKEN TO TOKEN ===> ', quote);
    swapTx = await instance.fillQuoteTokenToToken(
      sellTokenAddress,
      buyTokenAddress,
      allowanceTarget,
      to,
      data,
      sellAmount,
      fee,
      {
        ...transactionOptions,
        value: value,
      }
    );
  }
  return swapTx;
};

export const getQuoteExecutionDetails = (
  quote: Quote,
  transactionOptions: TransactionOptions,
  provider: Provider
): QuoteExecutionDetails => {
  const instance = new ethers.Contract(
    RAINBOW_ROUTER_CONTRACT_ADDRESS,
    RainbowRouterABI,
    provider
  );

  const {
    sellTokenAddress,
    buyTokenAddress,
    to,
    data,
    sellAmountMinusFees,
    fee,
    value,
    sellAmount,
    feePercentageBasisPoints,
    allowanceTarget,
  } = quote;

  if (sellTokenAddress?.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    console.log('ETH TO TOKEN ===> ', quote);
    return {
      method: instance.estimateGas['fillQuoteEthToToken'],
      methodArgs: [buyTokenAddress, to, data, sellAmountMinusFees, fee],
      params: {
        ...transactionOptions,
        value: sellAmount,
      },
    };
  } else if (buyTokenAddress?.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    console.log('TOKEN TO ETH ===> ', quote);
    return {
      method: instance.estimateGas['fillQuoteTokenToEth'],
      methodArgs: [
        sellTokenAddress,
        allowanceTarget,
        to,
        data,
        sellAmount,
        feePercentageBasisPoints,
      ],
      params: {
        ...transactionOptions,
        value: value,
      },
    };
  } else {
    console.log('TOKEN TO TOKEN ===> ', quote);
    return {
      method: instance.estimateGas['fillQuoteTokenToToken'],
      methodArgs: [
        sellTokenAddress,
        buyTokenAddress,
        allowanceTarget,
        to,
        data,
        sellAmount,
        fee,
      ],
      params: {
        ...transactionOptions,
        value: value,
      },
    };
  }
};
