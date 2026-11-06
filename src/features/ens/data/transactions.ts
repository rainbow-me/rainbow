import { encodeFunctionData, erc20Abi, getAddress, isAddressEqual, zeroHash, type Address, type Hex } from 'viem';
import { estimateGas, getBlock, getCode, readContract, simulateBlocks, simulateCalls } from 'viem/actions';

import { ENS_MIN_COMMITMENT_AGE, ensContracts } from '../core/contracts';
import { normalizeEnsName } from '../core/name';
import type { EnsAction, EnsTransaction } from '../types/transactions';
import { withEnsClient, type EnsClient } from './client';
import { factoryAbi, legacyAbi, registrarAbi, resolverAbi } from './contracts';
import { getEnsOwnership, isNameToken } from './ownership';
import { ENS_PAYMENT_TOKEN, getEnsRenewal, getEthRegistrationLabel, RESOLVER_SALT } from './registration';
import { encodeEnsRecordClear, encodeEnsRecordWrites, getEnsWriteResolver, getLegacyRecordClears } from './resolver';

// EAC assigns four bits per role. This grants all 32 regular roles and their 32 admin roles.
const ALL_RESOLVER_ROLES = BigInt(`0x${'1'.repeat(64)}`);

/**
 * Builds the transactions used for both fee estimation and execution.
 * Each transaction targets the discovered contract and contains its final calldata.
 */
export function prepareEnsTransactions(action: EnsAction, account: Address): Promise<EnsTransaction[]> {
  return withEnsClient(async client => {
    const name = normalizeEnsName(action.name);
    const transactions: EnsTransaction[] = [];

    switch (action.type) {
      case 'commit': {
        const commitment = action.commitment;
        const hash = await readContract(client, {
          address: commitment.registrar,
          abi: registrarAbi,
          functionName: 'makeCommitment',
          args: [
            getEthRegistrationLabel(name),
            commitment.owner,
            commitment.secret,
            commitment.subregistry,
            commitment.resolver,
            BigInt(commitment.duration),
            commitment.referrer,
          ],
        });

        transactions.push({
          to: commitment.registrar,
          data: encodeFunctionData({ abi: registrarAbi, functionName: 'commit', args: [hash] }),
          operation: 'commit',
        });
        break;
      }
      case 'register':
        return prepareRegistration(client, name, action, account);

      case 'renew': {
        const label = getEthRegistrationLabel(name);
        const renewal = await getEnsRenewal(client, label, action.duration);

        const approval = await prepareApproval(client, account, renewal.registrar, renewal.price);
        if (approval) transactions.push(approval);

        transactions.push({
          to: renewal.registrar,
          data: encodeFunctionData({
            abi: registrarAbi,
            functionName: 'renew',
            args: [{ label, duration: BigInt(action.duration), referrer: zeroHash }, ENS_PAYMENT_TOKEN.address],
          }),
          operation: 'renew',
        });
        break;
      }
      case 'records': {
        if (Object.keys(action.records).length) {
          const resolver = await getEnsWriteResolver(client, name);
          if (!resolver) throw new Error('ENS name has no writable resolver');

          transactions.push(recordTransaction(resolver.address, encodeEnsRecordWrites(name, action.records, resolver.permissioned)));
        }
        if (action.setReverseRecord) transactions.push(primaryNameTransaction(name));
        break;
      }
      case 'primary':
        transactions.push(primaryNameTransaction(name));
        break;
      case 'transfer':
        return prepareTransferChanges(client, name, action, account);
    }

    return transactions;
  });
}

// ============ Gas Estimation ================================================= //

/**
 * Simulates dependent transactions together, so approvals and resolver deployment
 * are reflected in the calls that follow them.
 */
export async function estimateEnsTransactions(action: EnsAction, account: Address): Promise<string> {
  const transactions = await prepareEnsTransactions(action, account);
  if (!transactions.length) return '0';

  return withEnsClient(async client => {
    if (transactions.length === 1) {
      const tx = transactions[0];
      const gas = await estimateGas(client, { account, to: tx.to, data: tx.data });
      return String(padGasLimit(gas));
    }

    const simulation = await simulateCalls(client, {
      account,
      calls: transactions.map(transaction => ({ to: transaction.to, data: transaction.data })),
    });

    let gas = 0n;
    for (const result of simulation.results) {
      if (result.status === 'failure') throw result.error;
      gas += result.gasUsed;
    }

    return String(padGasLimit(gas));
  });
}

/**
 * Estimates the complete registration before committing, including the wait
 * between commit and reveal. The simulated state is never submitted onchain.
 */
export async function estimateEnsRegistration(action: Extract<EnsAction, { type: 'register' }>, account: Address) {
  const commit = await prepareEnsTransactions({ type: 'commit', name: action.name, commitment: action.commitment }, account);
  const registration = await prepareEnsTransactions(action, account);

  return withEnsClient(async client => {
    const block = await getBlock(client);
    const result = await simulateBlocks(client, {
      blocks: [
        { calls: commit.map(transaction => ({ to: transaction.to, data: transaction.data, account })) },
        {
          blockOverrides: { time: block.timestamp + BigInt(ENS_MIN_COMMITMENT_AGE + 1) },
          calls: registration.map(transaction => ({ to: transaction.to, data: transaction.data, account })),
        },
      ],
    });

    const gasLimits = result.map(block => {
      let gas = 0n;
      for (const call of block.calls) {
        if (call.status === 'failure') throw call.error;
        gas += call.gasUsed;
      }
      return padGasLimit(gas);
    });

    return { stepGasLimit: String(gasLimits[0]), totalGasLimit: String(gasLimits[0] + gasLimits[1]) };
  });
}

// ============ Transaction Preparation ======================================== //

async function prepareRegistration(
  client: EnsClient,
  name: string,
  action: Extract<EnsAction, { type: 'register' }>,
  account: Address
): Promise<EnsTransaction[]> {
  const commitment = action.commitment;
  if (!isAddressEqual(account, commitment.owner)) throw new Error('Switch to the wallet that committed this registration');

  const label = getEthRegistrationLabel(name);
  const price = await readContract(client, {
    address: commitment.registrar,
    abi: registrarAbi,
    functionName: 'getRegisterPrice',
    args: [label, BigInt(commitment.duration), ENS_PAYMENT_TOKEN.address],
  });

  const transactions: EnsTransaction[] = [];
  const records = { ETH: account, ...action.records };
  const writes = encodeEnsRecordWrites(name, records, true);
  if (!(await getCode(client, { address: commitment.resolver }))) {
    const initialization = encodeFunctionData({
      abi: resolverAbi,
      functionName: 'initialize',
      args: [[{ account, roleBitmap: ALL_RESOLVER_ROLES }], writes],
    });
    transactions.push({
      to: ensContracts.factory,
      data: encodeFunctionData({
        abi: factoryAbi,
        functionName: 'deployProxy',
        args: [ensContracts.resolverImplementation, RESOLVER_SALT, initialization],
      }),
      operation: 'deployResolver',
    });
  } else {
    transactions.push(recordTransaction(commitment.resolver, writes));
  }

  const approval = await prepareApproval(client, account, commitment.registrar, price[0] + price[1]);
  if (approval) transactions.push(approval);

  transactions.push({
    to: commitment.registrar,
    data: encodeFunctionData({
      abi: registrarAbi,
      functionName: 'register',
      args: [
        label,
        commitment.owner,
        commitment.secret,
        commitment.subregistry,
        commitment.resolver,
        BigInt(commitment.duration),
        ENS_PAYMENT_TOKEN.address,
        commitment.referrer,
      ],
    }),
    operation: 'register',
  });

  if (action.setReverseRecord) transactions.push(primaryNameTransaction(name));

  return transactions;
}

async function prepareTransferChanges(
  client: EnsClient,
  name: string,
  action: Extract<EnsAction, { type: 'transfer' }>,
  account: Address
): Promise<EnsTransaction[]> {
  const transactions: EnsTransaction[] = [];
  const ownership = await getEnsOwnership(client, name);
  if (!ownership || !isNameToken(ownership, action.token)) throw new Error('ENS name does not identify the selected NFT');

  const holder = ownership.version === 1 ? ownership.registrant : ownership.owner;
  if (!holder || !isAddressEqual(holder, account)) throw new Error('Sender no longer owns this ENS token');

  if (action.clearRecords || action.setAddress) {
    const resolver = await getEnsWriteResolver(client, name);
    if (!resolver) throw new Error('ENS name has no writable resolver');

    let writes: Hex[] = [];
    if (action.clearRecords) {
      writes = resolver.permissioned ? encodeEnsRecordClear(name) : await getLegacyRecordClears(name, resolver.address);
    }
    if (action.setAddress) writes.push(...encodeEnsRecordWrites(name, { ETH: action.toAddress }, resolver.permissioned));
    if (writes.length) transactions.push(recordTransaction(resolver.address, writes));
  }

  // Only an unwrapped v1 registration has separate registry control.
  if (
    action.transferControl &&
    ownership.version === 1 &&
    ownership.token &&
    isAddressEqual(ownership.token.contractAddress, ensContracts.legacyRegistrar)
  ) {
    transactions.push({
      to: ensContracts.legacyRegistrar,
      data: encodeFunctionData({
        abi: legacyAbi,
        functionName: 'reclaim',
        args: [BigInt(ownership.token.tokenId), getAddress(action.toAddress)],
      }),
      operation: 'reclaim',
    });
  }

  return transactions;
}

async function prepareApproval(client: EnsClient, account: Address, spender: Address, amount: bigint): Promise<EnsTransaction | null> {
  const allowance = await readContract(client, {
    address: ENS_PAYMENT_TOKEN.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account, spender],
  });
  if (allowance >= amount) return null;

  return {
    to: ENS_PAYMENT_TOKEN.address,
    data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender, amount] }),
    operation: 'approve',
  };
}

function recordTransaction(to: Address, writes: Hex[]): EnsTransaction {
  return {
    to,
    data: writes.length === 1 ? writes[0] : encodeFunctionData({ abi: resolverAbi, functionName: 'multicall', args: [writes] }),
    operation: 'records',
  };
}

function primaryNameTransaction(name: string): EnsTransaction {
  return {
    to: ensContracts.reverseRegistrar,
    data: encodeFunctionData({ abi: legacyAbi, functionName: 'setName', args: [name] }),
    operation: 'primary',
  };
}

/**
 * Adds a 10% gas margin, rounding up to a whole gas unit.
 */
function padGasLimit(gas: bigint): bigint {
  return (gas * 110n + 99n) / 100n;
}
