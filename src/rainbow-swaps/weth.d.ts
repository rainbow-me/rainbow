import { BigNumberish } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
export declare const wrapEth: (amount: BigNumberish, wallet: Wallet) => Promise<Transaction>;
export declare const unwrapWeth: (amount: BigNumberish, wallet: Wallet) => Promise<Transaction>;
export declare const geWethMethod: (name: string, provider: Provider) => any;
