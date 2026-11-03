import { getAddress, keccak256, labelhash, stringToHex, toHex, zeroAddress, zeroHash } from 'viem';
import { readContract } from 'viem/actions';

import { USDC_ADDRESS } from '@/references/constants';

import { ensContracts } from '../core/contracts';
import { normalizeEnsName } from '../core/name';
import type { EnsCommitment } from '../types/registration';
import { withEnsClient, type EnsClient } from './client';
import { factoryAbi, legacyAbi, registrarAbi, registryAbi } from './contracts';

export const ENS_PAYMENT_TOKEN = { address: USDC_ADDRESS, decimals: 6, symbol: 'USDC' } as const;
export const RESOLVER_SALT = BigInt(keccak256(stringToHex('rainbow.ens.resolver.v2')));

/**
 * Returns a paid .eth registration label. General ENS names are not registrar inputs.
 */
export function getEthRegistrationLabel(name: string): string {
  const parts = normalizeEnsName(name).split('.');
  if (parts.length === 2 && parts[1] === 'eth') return parts[0];
  throw new Error('Registration requires a second-level .eth name');
}

/**
 * Quotes USDC payment and selects the renewal contract from current registry state.
 */
export function readEnsRegistration(name: string, duration: number, renew: boolean, signal?: AbortSignal) {
  return withEnsClient(async client => {
    const label = getEthRegistrationLabel(name);
    const available = await readContract(client, {
      address: ensContracts.registrar,
      abi: registrarAbi,
      functionName: 'isAvailable',
      args: [label],
    });

    if (available && !renew) {
      const price = await readContract(client, {
        address: ensContracts.registrar,
        abi: registrarAbi,
        functionName: 'getRegisterPrice',
        args: [label, BigInt(duration), ENS_PAYMENT_TOKEN.address],
      });
      return { available, rentPrice: String(price[0] + price[1]), expirationDate: null, registrar: ensContracts.registrar };
    }

    const renewal = await getEnsRenewal(client, label, duration);
    const expiry =
      renewal.registrar === ensContracts.legacyRenewer
        ? await readContract(client, {
            address: ensContracts.legacyRegistrar,
            abi: legacyAbi,
            functionName: 'nameExpires',
            args: [BigInt(labelhash(label))],
          })
        : renewal.expiry;

    return { available, rentPrice: String(renewal.price), expirationDate: Number(expiry), registrar: renewal.registrar };
  }, signal);
}

export async function getEnsRenewal(client: EnsClient, label: string, duration: number) {
  const state = await readContract(client, {
    address: ensContracts.ethRegistry,
    abi: registryAbi,
    functionName: 'getState',
    args: [BigInt(labelhash(label))],
  });

  const registrar = state.latestOwner === zeroAddress ? ensContracts.legacyRenewer : ensContracts.registrar;
  const price = await readContract(client, {
    address: registrar,
    abi: registrarAbi,
    functionName: 'getRenewPrice',
    args: [label, BigInt(duration), ENS_PAYMENT_TOKEN.address],
  });

  return { registrar, price, expiry: state.expiry };
}

/**
 * Fixes the resolver and registration terms before submitting the commitment.
 */
export function createEnsCommitment(owner: string, duration: number): Promise<EnsCommitment> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const secret = toHex(bytes);
  const account = getAddress(owner);

  return withEnsClient(async client => ({
    registrar: ensContracts.registrar,
    owner: account,
    duration,
    secret,
    resolver: await readContract(client, {
      address: ensContracts.factory,
      abi: factoryAbi,
      functionName: 'predictProxyAddress',
      args: [account, RESOLVER_SALT],
    }),
    subregistry: zeroAddress,
    referrer: zeroHash,
  }));
}
