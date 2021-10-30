import { Provider } from '@ethersproject/abstract-provider';
import { BigNumberish } from '@ethersproject/bignumber';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
/**
 * Function to wrap a specific amount of ether for the specified wallet
 *
 * @param {BigNumberish} amount
 * @param {Wallet} wallet
 * @returns {Promise<Transaction>}
 */
export declare const wrapEth: (amount: BigNumberish, wallet: Wallet) => Promise<Transaction>;
/**
 * Function to unwrap a specific amount of ether for the specified wallet
 *
 * @param {BigNumberish} amount
 * @param {Wallet} wallet
 * @returns {Promise<Transaction>}
 */
export declare const unwrapWeth: (amount: BigNumberish, wallet: Wallet) => Promise<Transaction>;
export declare const geWethMethod: (name: string, provider: Provider) => any;
