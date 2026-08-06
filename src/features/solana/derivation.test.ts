import { ed25519 } from '@noble/curves/ed25519';
import { mnemonicToSeedSync } from 'bip39';

import { base58Decode, SOLANA_ADDRESS_BYTE_LENGTH } from './address';
import { deriveHardenedEd25519Node, deriveSolanaAddress, deriveSolanaSigner, SOLANA_COIN_TYPE, solanaDerivationPath } from './derivation';

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');
const fromHex = (value: string) => new Uint8Array(Buffer.from(value, 'hex'));

/**
 * SLIP-0010's own ed25519 test vectors, transcribed from the specification at
 * `satoshilabs/slips@7f09881` (`slip-0010.md`, "Test vector 1 for ed25519" and
 * "Test vector 2 for ed25519").
 *
 * These are the only authoritative correctness evidence available for this
 * machinery, and they exercise paths that are not Solana paths, which is why
 * `deriveHardenedEd25519Node` is exported. The specification prefixes each public
 * key with a `00` byte; the raw key is the remaining 32.
 */
const SLIP_0010_ED25519_VECTORS = [
  {
    name: 'test vector 1',
    seed: '000102030405060708090a0b0c0d0e0f',
    steps: [
      {
        path: [],
        privateKey: '2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7',
        chainCode: '90046a93de5380a72b5e45010748567d5ea02bbf6522f979e05c0d8d8ca9fffb',
      },
      {
        path: [0],
        privateKey: '68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3',
        chainCode: '8b59aa11380b624e81507a27fedda59fea6d0b779a778918a2fd3590e16e9c69',
      },
      {
        path: [0, 1],
        privateKey: 'b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2',
        chainCode: 'a320425f77d1b5c2505a6b1b27382b37368ee640e3557c315416801243552f14',
      },
      {
        path: [0, 1, 2],
        privateKey: '92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9',
        chainCode: '2e69929e00b5ab250f49c3fb1c12f252de4fed2c1db88387094a0f8c4c9ccd6c',
      },
      {
        path: [0, 1, 2, 2],
        privateKey: '30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662',
        chainCode: '8f6d87f93d750e0efccda017d662a1b31a266e4a6f5993b15f5c1f07f74dd5cc',
      },
      {
        path: [0, 1, 2, 2, 1000000000],
        privateKey: '8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793',
        chainCode: '68789923a0cac2cd5a29172a475fe9e0fb14cd6adb5ad98a3fa70333e7afa230',
      },
    ],
    publicKeys: [
      '00a4b2856bfec510abab89753fac1ac0e1112364e7d250545963f135f2a33188ed',
      '008c8a13df77a28f3445213a0f432fde644acaa215fc72dcdf300d5efaa85d350c',
      '001932a5270f335bed617d5b935c80aedb1a35bd9fc1e31acafd5372c30f5c1187',
      '00ae98736566d30ed0e9d2f4486a64bc95740d89c7db33f52121f8ea8f76ff0fc1',
      '008abae2d66361c879b900d204ad2cc4984fa2aa344dd7ddc46007329ac76c429c',
      '003c24da049451555d51a7014a37337aa4e12d41e485abccfa46b47dfb2af54b7a',
    ],
  },
  {
    name: 'test vector 2',
    seed: 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542',
    steps: [
      {
        path: [],
        privateKey: '171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012',
        chainCode: 'ef70a74db9c3a5af931b5fe73ed8e1a53464133654fd55e7a66f8570b8e33c3b',
      },
      {
        path: [0],
        privateKey: '1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635',
        chainCode: '0b78a3226f915c082bf118f83618a618ab6dec793752624cbeb622acb562862d',
      },
      {
        path: [0, 2147483647],
        privateKey: 'ea4f5bfe8694d8bb74b7b59404632fd5968b774ed545e810de9c32a4fb4192f4',
        chainCode: '138f0b2551bcafeca6ff2aa88ba8ed0ed8de070841f0c4ef0165df8181eaad7f',
      },
      {
        path: [0, 2147483647, 1],
        privateKey: '3757c7577170179c7868353ada796c839135b3d30554bbb74a4b1e4a5a58505c',
        chainCode: '73bd9fff1cfbde33a1b846c27085f711c0fe2d66fd32e139d3ebc28e5a4a6b90',
      },
      {
        path: [0, 2147483647, 1, 2147483646],
        privateKey: '5837736c89570de861ebc173b1086da4f505d4adb387c6a1b1342d5e4ac9ec72',
        chainCode: '0902fe8a29f9140480a00ef244bd183e8a13288e4412d8389d140aac1794825a',
      },
      {
        path: [0, 2147483647, 1, 2147483646, 2],
        privateKey: '551d333177df541ad876a60ea71f00447931c0a9da16f227c11ea080d7391b8d',
        chainCode: '5d70af781f3a37b829f0d060924d5e960bdc02e85423494afc0b1a41bbe196d4',
      },
    ],
    publicKeys: [
      '008fe9693f8fa62a4305a140b9764c5ee01e455963744fe18204b4fb948249308a',
      '0086fab68dcb57aa196c77c5f264f215a112c22a912c10d123b0d03c3c28ef1037',
      '005ba3b9ac6e90e83effcd25ac4e58a1365a9e35a3d3ae5eb07b9e4d90bcf7506d',
      '002e66aa57069c86cc18249aecf5cb5a9cebbfd6fadeab056254763874a9352b45',
      '00e33c0f7d81d843c572275f287498e8d408654fdf0d1e065b84e2e6f157aab09b',
      '0047150c75db263559a70d5778bf36abbab30fb061ad69f69ece61a72b0cfa4fc0',
    ],
  },
] as const;

/**
 * The BIP-39 test mnemonic, used here because it is the one seed phrase whose
 * derived values can be compared against other implementations by anyone. It holds
 * nothing and is not a Rainbow wallet.
 */
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

/**
 * The addresses this app derives for the first three accounts of that mnemonic at
 * the ruled path. Pinned so that a change to the derivation shows up here as a
 * failing test rather than as stranded funds: these are the values a user's Phantom
 * or Solflare wallet shows for the same seed phrase.
 */
const EXPECTED_ADDRESSES = [
  'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk',
  'Hh8QwFUA6MtVu1qAoq12ucvFHNwCcVTV7hpWjeY1Hztb',
  '7WktogJEd2wQ9eH2oWusmcoFTgeYi6rS632UviTBJ2jm',
] as const;

const testSeed = () => new Uint8Array(mnemonicToSeedSync(TEST_MNEMONIC));

const ed25519Verify = (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => ed25519.verify(signature, message, publicKey);

describe('deriveHardenedEd25519Node', () => {
  for (const vector of SLIP_0010_ED25519_VECTORS) {
    describe(`SLIP-0010 ${vector.name} for ed25519`, () => {
      vector.steps.forEach((step, stepIndex) => {
        const label = step.path.length ? `m/${step.path.map(index => `${index}'`).join('/')}` : 'm';
        it(`matches the specification at ${label}`, () => {
          const node = deriveHardenedEd25519Node(fromHex(vector.seed), step.path);
          expect(toHex(node.privateKey)).toBe(step.privateKey);
          expect(toHex(node.chainCode)).toBe(step.chainCode);
        });

        it(`derives the specification's public key at ${label}`, () => {
          // The specification prefixes ed25519 public keys with a 00 byte. Checking
          // this as well as the private key covers the whole chain from seed to
          // address, rather than stopping where the curve arithmetic begins.
          const node = deriveHardenedEd25519Node(fromHex(vector.seed), step.path);
          expect('00' + toHex(ed25519.getPublicKey(node.privateKey))).toBe(vector.publicKeys[stepIndex]);
        });
      });
    });
  }

  it('rejects a seed outside the 16-to-64-byte range the specification allows', () => {
    expect(() => deriveHardenedEd25519Node(new Uint8Array(15), [])).toThrow('seed must be 16-64 bytes');
    expect(() => deriveHardenedEd25519Node(new Uint8Array(65), [])).toThrow('seed must be 16-64 bytes');
    expect(() => deriveHardenedEd25519Node(new Uint8Array(16), [])).not.toThrow();
    expect(() => deriveHardenedEd25519Node(new Uint8Array(64), [])).not.toThrow();
  });

  it('rejects an index that is not a whole number below 2^31, so the hardened bit cannot be smuggled in', () => {
    const seed = testSeed();
    expect(() => deriveHardenedEd25519Node(seed, [0x80000000])).toThrow('path index must be an integer');
    expect(() => deriveHardenedEd25519Node(seed, [-1])).toThrow('path index must be an integer');
    expect(() => deriveHardenedEd25519Node(seed, [1.5])).toThrow('path index must be an integer');
    expect(() => deriveHardenedEd25519Node(seed, [0x7fffffff])).not.toThrow();
  });

  it('hardens every step, so index 0 is not the non-hardened child SLIP-0010 forbids', () => {
    // The non-hardened child of a node is what an EVM-shaped implementation would
    // reach for. It is a different key, and it is unreachable through this function.
    const parent = deriveHardenedEd25519Node(testSeed(), [44, SOLANA_COIN_TYPE, 0]);
    const hardenedChild = deriveHardenedEd25519Node(testSeed(), [44, SOLANA_COIN_TYPE, 0, 0]);
    expect(toHex(hardenedChild.privateKey)).not.toBe(toHex(parent.privateKey));
  });

  it('derives each account index from the seed rather than from a shared parent', () => {
    const seed = testSeed();
    const first = deriveHardenedEd25519Node(seed, [44, SOLANA_COIN_TYPE, 0, 0]);
    const second = deriveHardenedEd25519Node(seed, [44, SOLANA_COIN_TYPE, 1, 0]);
    expect(toHex(first.privateKey)).not.toBe(toHex(second.privateKey));
    expect(toHex(first.chainCode)).not.toBe(toHex(second.chainCode));
  });
});

describe('solanaDerivationPath', () => {
  it('renders the ruled path with both trailing components hardened', () => {
    expect(solanaDerivationPath(0)).toBe("m/44'/501'/0'/0'");
    expect(solanaDerivationPath(7)).toBe("m/44'/501'/7'/0'");
  });

  it('names SLIP-0044 coin type 501', () => {
    expect(SOLANA_COIN_TYPE).toBe(501);
  });

  it('refuses to render an account index the derivation itself would refuse', () => {
    // Rendering `m/44'/501'/NaN'/0'` for an index no key can be derived at would put
    // a path in a log or a record that names nothing.
    for (const invalid of [NaN, Infinity, -1, 1.5, 0x80000000]) {
      expect(() => solanaDerivationPath(invalid)).toThrow('path index must be an integer');
    }
    expect(solanaDerivationPath(0x7fffffff)).toBe("m/44'/501'/2147483647'/0'");
  });
});

describe('deriveSolanaAddress', () => {
  it('derives the addresses Phantom and Solflare show for the BIP-39 test mnemonic', () => {
    const seed = testSeed();
    EXPECTED_ADDRESSES.forEach((expected, accountIndex) => {
      expect(deriveSolanaAddress(seed, accountIndex)).toBe(expected);
    });
  });

  it('produces a 32-byte base58 value, which is what makes it an address', () => {
    const address = deriveSolanaAddress(testSeed(), 0);
    expect(base58Decode(address)).toHaveLength(SOLANA_ADDRESS_BYTE_LENGTH);
  });

  it('gives every account index a different address', () => {
    const seed = testSeed();
    const addresses = [0, 1, 2, 3, 4].map(index => deriveSolanaAddress(seed, index));
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it('is deterministic across calls', () => {
    expect(deriveSolanaAddress(testSeed(), 0)).toBe(deriveSolanaAddress(testSeed(), 0));
  });

  it('gives a different address for a different seed', () => {
    const other = new Uint8Array(mnemonicToSeedSync('legal winner thank year wave sausage worth useful legal winner thank yellow'));
    expect(deriveSolanaAddress(other, 0)).not.toBe(deriveSolanaAddress(testSeed(), 0));
  });
});

describe('deriveSolanaSigner', () => {
  it('carries the same address deriveSolanaAddress produces', () => {
    const seed = testSeed();
    expect(deriveSolanaSigner(seed, 0).address).toBe(deriveSolanaAddress(seed, 0));
    expect(deriveSolanaSigner(seed, 2).address).toBe(deriveSolanaAddress(seed, 2));
  });

  it('produces a 64-byte signature that verifies against the derived address', () => {
    const signer = deriveSolanaSigner(testSeed(), 0);
    const message = new TextEncoder().encode('a serialized Solana transaction message would go here');
    const signature = signer.sign(message);

    expect(signature).toHaveLength(64);

    // Verifying against the address rather than a retained public key is the check
    // that matters: it proves the signature is attributable to the account the app
    // would show the user.
    const publicKey = base58Decode(signer.address);
    expect(publicKey).not.toBeNull();
    expect(ed25519Verify(signature, message, publicKey as Uint8Array)).toBe(true);
  });

  it('produces a signature that fails verification for a different message', () => {
    const signer = deriveSolanaSigner(testSeed(), 0);
    const message = new TextEncoder().encode('the message that was signed');
    const signature = signer.sign(message);
    const tampered = new TextEncoder().encode('the message that was not signed');

    expect(ed25519Verify(signature, tampered, base58Decode(signer.address) as Uint8Array)).toBe(false);
  });

  it('does not verify one account signature against another account address', () => {
    const seed = testSeed();
    const message = new TextEncoder().encode('signed by account 0');
    const signature = deriveSolanaSigner(seed, 0).sign(message);
    const otherAddress = deriveSolanaSigner(seed, 1).address;

    expect(ed25519Verify(signature, message, base58Decode(otherAddress) as Uint8Array)).toBe(false);
  });

  it('does not expose the private key on the signer', () => {
    const signer = deriveSolanaSigner(testSeed(), 0);
    expect(Object.keys(signer).sort()).toEqual(['address', 'sign']);
  });

  it('signs deterministically, as ed25519 requires', () => {
    const message = new TextEncoder().encode('ed25519 signatures are deterministic');
    const first = deriveSolanaSigner(testSeed(), 0).sign(message);
    const second = deriveSolanaSigner(testSeed(), 0).sign(message);
    expect(toHex(first)).toBe(toHex(second));
  });
});
