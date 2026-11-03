import assert from 'node:assert/strict';

import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  erc20Abi,
  getAddress,
  http,
  keccak256,
  parseAbi,
  toHex,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { namehash, packetToBytes } from 'viem/ens';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { time } from '@/framework/core/utils/time';

import { ENS_MAX_COMMITMENT_AGE, ENS_MIN_COMMITMENT_AGE, ensContracts } from '../core/contracts';
import type { EnsAction } from '../types/transactions';
import { resolverAbi } from './contracts';
import { readEnsText, resolveEnsAddress, resolveEnsName } from './ens';
import { readEnsOwnership } from './ownership';
import { readEnsPermissions } from './permissions';
import { createEnsCommitment, ENS_PAYMENT_TOKEN, readEnsRegistration } from './registration';
import { currentEnsTokenId } from './registry';
import { estimateEnsRegistration, estimateEnsTransactions, prepareEnsTransactions } from './transactions';

vi.mock('@/features/network/stores/backendNetworksStore', () => ({
  backendNetworksActions: { getChainDefaultRpc: () => 'http://127.0.0.1:18545' },
}));

const transport = http('http://127.0.0.1:18545', { timeout: time.seconds(60) });
const client = createPublicClient({ chain: mainnet, transport });
const node = createTestClient({ chain: mainnet, mode: 'anvil', transport });
const account = privateKeyToAccount(generatePrivateKey()).address;
const recipient = privateKeyToAccount(generatePrivateKey()).address;
const wallet = createWalletClient({ chain: mainnet, account, transport });
const name = `rainbow-${account.slice(2, 14).toLowerCase()}.eth`;

async function execute(action: EnsAction) {
  const calls = await prepareEnsTransactions(action, account);
  for (const call of calls) {
    const gas = await client.estimateGas({ account, to: call.to, data: call.data });
    const hash = await wallet.sendTransaction({ to: call.to, data: call.data, gas });
    const receipt = await client.waitForTransactionReceipt({ hash });
    expect(receipt.status).toBe('success');
  }
  return calls;
}

// Requires an archive ENS_FORK_RPC_URL and a dedicated Anvil instance on port 18545.
// Resets the local node to a fixed mainnet block; no transactions reach the fork source.
describe.skipIf(!process.env.ENS_FORK_RPC_URL)('ENSv2 deployed contracts', () => {
  beforeAll(async () => {
    await node.reset({ jsonRpcUrl: process.env.ENS_FORK_RPC_URL, blockNumber: 26323430n });
    assert.equal(await client.getChainId(), 1);
    const limits = parseAbi(['function MIN_COMMITMENT_AGE() view returns (uint64)', 'function MAX_COMMITMENT_AGE() view returns (uint64)']);
    assert.equal(
      await client.readContract({ address: ensContracts.registrar, abi: limits, functionName: 'MIN_COMMITMENT_AGE' }),
      BigInt(ENS_MIN_COMMITMENT_AGE)
    );
    assert.equal(
      await client.readContract({ address: ensContracts.registrar, abi: limits, functionName: 'MAX_COMMITMENT_AGE' }),
      BigInt(ENS_MAX_COMMITMENT_AGE)
    );
    assert.equal(await client.getCode({ address: account }), undefined);
    await node.impersonateAccount({ address: account });
    await node.setBalance({ address: account, value: 10n ** 20n });
    await node.setStorageAt({
      address: ENS_PAYMENT_TOKEN.address,
      index: keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [account, 9n])),
      value: toHex(1_000_000_000n, { size: 32 }),
    });
    assert.equal(
      await client.readContract({ address: ENS_PAYMENT_TOKEN.address, abi: erc20Abi, functionName: 'balanceOf', args: [account] }),
      1_000_000_000n
    );
  }, time.seconds(60));

  it(
    'registers, resolves, renews and clears one shared name without clearing its sibling',
    async () => {
      const commitment = await createEnsCommitment(account, 365 * 24 * 60 * 60);
      const action: Extract<EnsAction, { type: 'register' }> = {
        type: 'register',
        name,
        commitment,
        records: { description: 'kept on sibling' },
        setReverseRecord: true,
      };
      const estimate = await estimateEnsRegistration(action, account);
      expect(BigInt(estimate.total)).toBeGreaterThan(BigInt(estimate.step));
      await execute({ type: 'commit', name, commitment });
      await node.increaseTime({ seconds: 61 });
      await node.mine({ blocks: 1 });
      const calls = await execute(action);
      expect(calls.map(call => call.operation)).toEqual(['deployResolver', 'approve', 'register', 'primary']);
      expect(await resolveEnsAddress(name, 1)).toBe(account);
      expect(await resolveEnsName(account, 1)).toBe(name);
      const ownership = await readEnsOwnership(name);
      expect(ownership).toMatchObject({ version: 2, owner: account, token: { contractAddress: getAddress(ensContracts.ethRegistry) } });
      assert(ownership?.expiryDate);
      const before = ownership.expiryDate;
      await execute({ type: 'renew', name, duration: 365 * 24 * 60 * 60 });
      expect((await readEnsOwnership(name))?.expiryDate).toBe(before + 365 * 24 * 60 * 60);

      const sibling = `sibling-${account.slice(2, 14).toLowerCase()}.eth`;
      const siblingCommitment = await createEnsCommitment(account, 365 * 24 * 60 * 60);
      await execute({ type: 'commit', name: sibling, commitment: siblingCommitment });
      await node.increaseTime({ seconds: 61 });
      await node.mine({ blocks: 1 });
      await execute({ type: 'register', name: sibling, commitment: siblingCommitment, records: {}, setReverseRecord: false });
      const recordId = await client.readContract({
        address: commitment.resolver,
        abi: parseAbi(['function getRecordId(bytes32 node) view returns (uint256)']),
        functionName: 'getRecordId',
        args: [namehash(name)],
      });
      const hash = await wallet.writeContract({
        address: commitment.resolver,
        abi: resolverAbi,
        functionName: 'linkToRecord',
        args: [toHex(packetToBytes(sibling)), recordId],
        gas: 150000n,
      });
      await client.waitForTransactionReceipt({ hash });
      expect(await readEnsText(sibling, 'description')).toBe('kept on sibling');
      assert(ownership.token);
      const prepareTransfer = {
        type: 'transfer',
        name,
        toAddress: recipient,
        token: ownership.token,
        clearRecords: true,
        setAddress: true,
        transferControl: false,
      } as const;
      await expect(prepareEnsTransactions({ ...prepareTransfer, name: sibling }, account)).rejects.toThrow('selected NFT');
      await execute(prepareTransfer);
      expect(await readEnsText(name, 'description')).toBeNull();
      expect(await readEnsText(sibling, 'description')).toBe('kept on sibling');
      expect(await resolveEnsAddress(name, 1)).toBe(recipient);
      const rolesAbi = parseAbi([
        'function grantRoles(uint256 resource, uint256 roles, address account)',
        'function revokeRoles(uint256 resource, uint256 roles, address account)',
        'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
      ]);
      const beforeRoleChange = (await readEnsOwnership(name))?.token;
      assert(beforeRoleChange);
      for (const functionName of ['grantRoles', 'revokeRoles'] as const) {
        const hash = await wallet.writeContract({
          address: beforeRoleChange.contractAddress,
          abi: rolesAbi,
          functionName,
          args: [BigInt(beforeRoleChange.tokenId), 1n << 24n, recipient],
          gas: 300000n,
        });
        expect((await client.waitForTransactionReceipt({ hash })).status).toBe('success');
      }
      const currentId = await currentEnsTokenId(beforeRoleChange, account);
      expect(currentId).not.toBe(beforeRoleChange.tokenId);
      const transfer = await wallet.writeContract({
        address: beforeRoleChange.contractAddress,
        abi: rolesAbi,
        functionName: 'safeTransferFrom',
        args: [account, recipient, BigInt(currentId), 1n, '0x'],
        gas: 300000n,
      });
      expect((await client.waitForTransactionReceipt({ hash: transfer })).status).toBe('success');
      expect((await readEnsOwnership(name))?.owner).toBe(recipient);
      expect((await readEnsPermissions(name, recipient)).canEditRecords).toBe(false);
      expect((await readEnsPermissions(name, account)).canEditRecords).toBe(true);

      const legacy = await readEnsOwnership('vitalik.eth');
      expect(legacy?.version).toBe(1);
      assert(legacy?.owner);
      expect(
        BigInt(await estimateEnsTransactions({ type: 'records', name: 'vitalik.eth', records: { ETH: '' } }, legacy.owner))
      ).toBeGreaterThan(0n);
      assert(legacy?.expiryDate);
      const renewal = await execute({ type: 'renew', name: 'vitalik.eth', duration: 31536000 });
      expect(renewal.at(-1)?.to).toBe(ensContracts.legacyRenewer);
      expect((await readEnsOwnership('vitalik.eth'))?.expiryDate).toBe(legacy.expiryDate + 31536000);

      const snapshot = await node.snapshot();
      await node.setNextBlockTimestamp({ timestamp: BigInt(legacy.expiryDate + 31536000 + 1) });
      await node.mine({ blocks: 1 });
      expect(await readEnsOwnership('vitalik.eth')).toMatchObject({
        version: 1,
        expiryDate: legacy.expiryDate + 31536000,
        registrant: null,
      });
      assert(legacy.token);
      await expect(prepareEnsTransactions({ ...prepareTransfer, name: 'vitalik.eth', token: legacy.token }, legacy.owner)).rejects.toThrow(
        'no longer owns'
      );
      await node.revert({ id: snapshot });

      const expiry = (await readEnsOwnership(name))?.expiryDate;
      assert(expiry);
      await node.setNextBlockTimestamp({ timestamp: BigInt(expiry + 1) });
      await node.mine({ blocks: 1 });
      expect((await readEnsRegistration(name, 31536000, true)).available).toBe(false);
      expect(await readEnsOwnership(name)).toMatchObject({ version: 2, owner: null });
    },
    time.minutes(2)
  );
});
