import { BigNumberish } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import { ChainId } from '.';
/**
 * Function to wrap a specific amount of ether for the specified wallet
 * @param {BigNumberish} amount
 * @param {Wallet} wallet
 * @returns {Promise<Transaction>}
 */
export declare const wrapEth: (amount: BigNumberish, wallet: Wallet, chainId?: ChainId) => Promise<Transaction>;
/**
 * Function to unwrap a specific amount of ether for the specified wallet
 * (MAINNET ONLY!)
 * @param {BigNumberish} amount
 * @param {Wallet} wallet
 * @returns {Promise<Transaction>}
 */
export declare const unwrapWeth: (amount: BigNumberish, wallet: Wallet, chainId?: ChainId) => Promise<Transaction>;
/**
 * Function that returns a pointer to the smart contract
 * function that wraps or unwraps, to be used by estimateGas calls
 * (MAINNET ONLY!)
 * @param {string} name
 * @param {StaticJsonRpcProvider} provider]
 * @returns {Promise<Transaction>}
 */
export declare const geWethMethod: (name: string, provider: StaticJsonRpcProvider, chainId?: ChainId) => any;
