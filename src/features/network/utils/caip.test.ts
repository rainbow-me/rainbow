import {
  fromLegacyEvmChainId,
  isNamespaceNativeAddress,
  normalizeForNamespace,
  parseCaipAccountId,
  parseCaipAssetId,
  parseCaipChainId,
  requireCaipAccountId,
  toCaipAccountId,
  toCaipChainId,
  toLegacyEvmChainId,
} from './caip';

/**
 * Every identifier below is one Rainbow's own service contracts document, so the
 * expectations are the services' own examples rather than shapes invented here.
 */
const EVM_MAINNET = 'eip155:1';
const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const EVM_ACCOUNT = 'eip155:1:0x1234567890123456789012345678901234567890';
const SOLANA_ACCOUNT = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj';
const DAI_ASSET = 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f';
const EVM_NATIVE_ASSET = 'eip155:1/native:0x0000000000000000000000000000000000000000';
const USDC_SOLANA_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const NFT_ASSET_WITH_TOKEN_ID = 'eip155:1/erc721:0x06012c8cf97bead5deae237070f9587f8e7a266d/771769';
const CHECKSUMMED_ADDRESS = '0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb';

describe('parseCaipChainId', () => {
  it('parses the two supported namespaces', () => {
    expect(parseCaipChainId(EVM_MAINNET)).toEqual({ namespace: 'eip155', reference: '1' });
    expect(parseCaipChainId(SOLANA_MAINNET)).toEqual({ namespace: 'solana', reference: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' });
  });

  it('rejects unsupported namespaces, uppercase namespaces and malformed input', () => {
    expect(parseCaipChainId('cosmos:cosmoshub-3')).toBeNull();
    expect(parseCaipChainId('EIP155:1')).toBeNull();
    expect(parseCaipChainId('eip155')).toBeNull();
    expect(parseCaipChainId('eip155:')).toBeNull();
    expect(parseCaipChainId(`eip155:${'1'.repeat(33)}`)).toBeNull();
  });
});

describe('toCaipChainId', () => {
  it('joins a namespace and reference', () => {
    expect(toCaipChainId('eip155', '8453')).toBe('eip155:8453');
    expect(toCaipChainId('solana', '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')).toBe(SOLANA_MAINNET);
  });

  it('rejects a reference outside the CAIP-2 grammar', () => {
    expect(toCaipChainId('eip155', '')).toBeNull();
    expect(toCaipChainId('eip155', 'has spaces')).toBeNull();
  });
});

describe('parseCaipAccountId', () => {
  it('splits the chain from the address for both families', () => {
    expect(parseCaipAccountId(EVM_ACCOUNT)).toEqual({
      address: '0x1234567890123456789012345678901234567890',
      chainId: EVM_MAINNET,
      namespace: 'eip155',
      reference: '1',
    });
    expect(parseCaipAccountId(SOLANA_ACCOUNT)).toEqual({
      address: '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj',
      chainId: SOLANA_MAINNET,
      namespace: 'solana',
      reference: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    });
  });

  it('enforces the chain-native address format rather than only the CAIP charset', () => {
    expect(parseCaipAccountId('eip155:1:7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj')).toBeNull();
    expect(parseCaipAccountId('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:0x1234567890123456789012345678901234567890')).toBeNull();
    expect(parseCaipAccountId('eip155:1:0x1234')).toBeNull();
  });

  it('lowercases eip155 addresses and preserves Solana case', () => {
    expect(parseCaipAccountId(`eip155:1:${CHECKSUMMED_ADDRESS}`)?.address).toBe(CHECKSUMMED_ADDRESS.toLowerCase());
    expect(parseCaipAccountId(SOLANA_ACCOUNT)?.address).toBe('7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj');
  });
});

describe('toCaipAccountId', () => {
  it('builds account ids for both families', () => {
    expect(toCaipAccountId(EVM_MAINNET, '0x1234567890123456789012345678901234567890')).toBe(EVM_ACCOUNT);
    expect(toCaipAccountId(SOLANA_MAINNET, '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj')).toBe(SOLANA_ACCOUNT);
  });

  it('refuses an address from the wrong family, in both directions', () => {
    expect(toCaipAccountId(EVM_MAINNET, '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj')).toBeNull();
    expect(toCaipAccountId(SOLANA_MAINNET, '0x1234567890123456789012345678901234567890')).toBeNull();
  });

  it('accepts the eth native-currency alias on eip155 only', () => {
    expect(toCaipAccountId(EVM_MAINNET, 'eth')).toBe('eip155:1:eth');
    expect(toCaipAccountId(SOLANA_MAINNET, 'eth')).toBeNull();
  });
});

describe('requireCaipAccountId', () => {
  it('returns the account id or throws the supplied message', () => {
    expect(requireCaipAccountId(SOLANA_MAINNET, '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj', 'bad account')).toBe(SOLANA_ACCOUNT);
    expect(() => requireCaipAccountId(SOLANA_MAINNET, '0x1234567890123456789012345678901234567890', 'bad account')).toThrow('bad account');
  });
});

describe('parseCaipAssetId', () => {
  it('parses token, native and Solana asset ids', () => {
    expect(parseCaipAssetId(DAI_ASSET)).toEqual({
      assetNamespace: 'erc20',
      assetReference: '0x6b175474e89094c44da98b954eedeac495271d0f',
      chainId: EVM_MAINNET,
      namespace: 'eip155',
      reference: '1',
    });
    expect(parseCaipAssetId(EVM_NATIVE_ASSET)?.assetNamespace).toBe('native');
    expect(parseCaipAssetId(USDC_SOLANA_ASSET)).toEqual({
      assetNamespace: 'token',
      assetReference: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      chainId: SOLANA_MAINNET,
      namespace: 'solana',
      reference: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    });
  });

  it('parses an optional token id and rejects a second one', () => {
    expect(parseCaipAssetId(NFT_ASSET_WITH_TOKEN_ID)?.tokenId).toBe('771769');
    expect(parseCaipAssetId(DAI_ASSET)).not.toHaveProperty('tokenId');
    expect(parseCaipAssetId(`${NFT_ASSET_WITH_TOKEN_ID}/extra`)).toBeNull();
  });

  it('rejects malformed asset ids', () => {
    expect(parseCaipAssetId(EVM_MAINNET)).toBeNull();
    expect(parseCaipAssetId('eip155:1/erc20')).toBeNull();
    expect(parseCaipAssetId('cosmos:cosmoshub-3/slip44:118')).toBeNull();
  });
});

describe('isNamespaceNativeAddress', () => {
  it('applies each family its own rule', () => {
    expect(isNamespaceNativeAddress('eip155', CHECKSUMMED_ADDRESS)).toBe(true);
    expect(isNamespaceNativeAddress('eip155', 'ab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb')).toBe(false);
    expect(isNamespaceNativeAddress('solana', '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj')).toBe(true);
    expect(isNamespaceNativeAddress('solana', '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')).toBe(false);
  });
});

describe('normalizeForNamespace', () => {
  it('lowercases eip155 only', () => {
    expect(normalizeForNamespace('eip155', CHECKSUMMED_ADDRESS)).toBe(CHECKSUMMED_ADDRESS.toLowerCase());
    expect(normalizeForNamespace('solana', '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj')).toBe(
      '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj'
    );
  });
});

describe('legacy chain ids', () => {
  it('round-trips eip155 chains through their decimal form', () => {
    expect(toLegacyEvmChainId(EVM_MAINNET)).toBe(1);
    expect(toLegacyEvmChainId('eip155:8453')).toBe(8453);
    expect(fromLegacyEvmChainId(8453)).toBe('eip155:8453');
  });

  it('has no decimal form for Solana', () => {
    expect(toLegacyEvmChainId(SOLANA_MAINNET)).toBeNull();
  });

  it('rejects non-numeric references and unusable numbers', () => {
    expect(toLegacyEvmChainId('eip155:mainnet')).toBeNull();
    expect(fromLegacyEvmChainId(0)).toBeNull();
    expect(fromLegacyEvmChainId(-1)).toBeNull();
    expect(fromLegacyEvmChainId(1.5)).toBeNull();
  });
});
