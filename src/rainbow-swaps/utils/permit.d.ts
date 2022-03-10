import { BigNumberish } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { ChainId, EthereumAddress } from '../types';
export interface MessageParam {
    nonce: number;
    spender: EthereumAddress;
    holder?: EthereumAddress;
    allowed?: boolean;
    expiry?: number;
    value?: BigNumberish;
    deadline?: number;
    owner?: EthereumAddress;
}
export interface DomainParam {
    chainId: ChainId;
    name: string;
    verifyingContract: EthereumAddress;
    version?: string;
}
export declare function signPermit(wallet: Wallet, tokenAddress: EthereumAddress, owner: EthereumAddress, spender: EthereumAddress, value: BigNumberish, deadline: BigNumberish, chainId: number): Promise<any>;
