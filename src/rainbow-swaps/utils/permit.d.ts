import { Wallet } from '@ethersproject/wallet';
import { EthereumAddress } from '..';
export interface MessageParam {
    nonce: number;
    spender: EthereumAddress;
    holder?: EthereumAddress;
    allowed?: boolean;
    expiry?: number;
    value?: string;
    deadline?: number;
    owner?: EthereumAddress;
}
export interface DomainParam {
    chainId: number;
    name: string;
    verifyingContract: EthereumAddress;
    version?: string;
}
export declare function signPermit(wallet: Wallet, tokenAddress: EthereumAddress, holder: EthereumAddress, spender: EthereumAddress, amount: string, deadline: number, chainId: number): Promise<any>;
