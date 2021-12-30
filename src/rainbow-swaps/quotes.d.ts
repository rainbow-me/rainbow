import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import { ChainId, Quote, QuoteExecutionDetails, QuoteParams, TransactionOptions } from './types';
/**
 * Function to get a quote from rainbow's swap aggregator backend
 *
 * @param {QuoteParams} params
 * @param {Source} params.source
 * @param {ChainId} params.chainId
 * @param {EthereumAddress} params.fromAddress
 * @param {EthereumAddress} params.sellTokenAddress
 * @param {EthereumAddress} params.buyTokenAddress
 * @param {BigNumberish} params.sellAmount
 * @param {BigNumberish} params.buyAmount
 * @param {number} params.slippage
 * @returns {Promise<Quote | null>}
 */
export declare const getQuote: ({ source, chainId, fromAddress, sellTokenAddress, buyTokenAddress, sellAmount, buyAmount, slippage, }: QuoteParams) => Promise<Quote | null>;
/**
 * Function that fills a quote onchain via rainbow's swap aggregator smart contract
 *
 * @param {Quote} quote
 * @param {TransactionOptions} transactionOptions
 * @param {Wallet} wallet
 * @param {boolean} permit
 * @param {number} ChainId
 * @returns {Promise<Transaction>}
 */
export declare const fillQuote: (quote: Quote, transactionOptions: TransactionOptions, wallet: Wallet, permit: boolean, chainId: ChainId) => Promise<Transaction>;
export declare const getQuoteExecutionDetails: (quote: Quote, transactionOptions: TransactionOptions, provider: StaticJsonRpcProvider) => QuoteExecutionDetails;
