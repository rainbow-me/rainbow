import { Wallet } from '@ethersproject/wallet';
import { EthereumAddress } from '..';
export declare function signPermit(wallet: Wallet, tokenAddress: EthereumAddress, holder: EthereumAddress, spender: EthereumAddress, amount: string, deadline: number): Promise<any>;
