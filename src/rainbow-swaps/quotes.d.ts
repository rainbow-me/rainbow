import { Provider } from '@ethersproject/abstract-provider';
import { BigNumberish } from '@ethersproject/bignumber';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
export declare enum Sources {
    Aggregator0x = "0x",
    Aggregotor1inch = "1inch"
}
export declare type EthereumAddress = string;
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
    source?: Sources;
    from: EthereumAddress;
    to?: EthereumAddress;
    data?: string;
    value?: BigNumberish;
    sellAmount: BigNumberish;
    sellAmountMinusFees: BigNumberish;
    sellTokenAddress: EthereumAddress;
    buyTokenAddress: EthereumAddress;
    buyAmount: BigNumberish;
    fee: BigNumberish;
    feePercentageBasisPoints: number;
    protocols?: ProtocolShare[];
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
export declare const getQuote: ({ source, chainId, fromAddress, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount, slippage, }: QuoteParams) => Promise<Quote | null>;
export declare const fillQuote: (quote: Quote, transactionOptions: TransactionOptions, wallet: Wallet, permit: boolean, chainId: number) => Promise<Transaction>;
export declare const getQuoteExecutionDetails: (quote: Quote, transactionOptions: TransactionOptions, provider: Provider) => QuoteExecutionDetails;
