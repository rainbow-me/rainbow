import ethereumUtils from '@/utils/ethereumUtils';

import { getRequestDisplayDetails } from './requests';

jest.mock('@/features/currency/utils/nativeDisplay', () => ({
  convertAmountAndPriceToNativeDisplay: (amount: unknown) => ({
    amount: String(amount),
    display: 'MOCKED_NATIVE_DISPLAY',
  }),
}));
jest.mock('@/handlers/web3', () => ({
  isHexString: jest.fn(),
}));
jest.mock('@/logger', () => ({
  logger: {
    DebugContext: { dapprequest: 'dapprequest' },
    warn: jest.fn(),
  },
}));
jest.mock('@/utils/ethereumUtils', () => ({
  __esModule: true,
  default: {
    getAccountAsset: jest.fn(),
    getNativeAssetForNetwork: jest.fn(),
  },
}));

const TOKEN_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const RELAY_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const RECIPIENT = '0x1111111111111111111111111111111111111111';
const SENDER = '0x9f8c1a2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b';

// transfer(address,uint256) of 5 whole tokens to RECIPIENT
const TOKEN_TRANSFER_DATA = `0xa9059cbb${'0'.repeat(24)}${RECIPIENT.slice(2)}${'0'.repeat(48)}4563918244f40000`;

const nativeAsset = {
  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  decimals: 18,
  price: { value: 2000 },
  symbol: 'ETH',
};

const heldToken = {
  address: TOKEN_ADDRESS,
  decimals: 18,
  price: { value: 1 },
  symbol: 'DAI',
};

const buildSendTransactionPayload = ({ data, to }: { data: string; to: string }) => ({
  method: 'eth_sendTransaction',
  params: [
    {
      data,
      from: SENDER,
      gasLimit: '0x5208',
      gasPrice: '0x3b9aca00',
      to,
      value: '0x0',
    },
  ],
});

const mockGetAccountAsset = ethereumUtils.getAccountAsset as jest.Mock;
const mockGetNativeAssetForNetwork = ethereumUtils.getNativeAssetForNetwork as jest.Mock;

describe('getRequestDisplayDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNativeAssetForNetwork.mockResolvedValue(nativeAsset);
  });

  it('decodes held-token transfers with the token transfer details', async () => {
    mockGetAccountAsset.mockReturnValue(heldToken);

    const details = (await getRequestDisplayDetails(
      buildSendTransactionPayload({ data: TOKEN_TRANSFER_DATA, to: TOKEN_ADDRESS }),
      'USD',
      1
    )) as { request: unknown } | null;

    expect(mockGetAccountAsset).toHaveBeenCalledWith(`${TOKEN_ADDRESS}_1`);
    expect(details?.request).toMatchObject({
      asset: heldToken,
      to: RECIPIENT,
      value: '5',
    });
  });

  it('falls back to the generic contract-interaction details when the transfer selector targets a contract that is not a held asset', async () => {
    mockGetAccountAsset.mockReturnValue(undefined);

    const details = (await getRequestDisplayDetails(
      buildSendTransactionPayload({ data: TOKEN_TRANSFER_DATA, to: RELAY_ADDRESS }),
      'USD',
      1
    )) as { request: unknown } | null;

    expect(details?.request).toMatchObject({
      asset: nativeAsset,
      data: TOKEN_TRANSFER_DATA,
      to: RELAY_ADDRESS,
      value: '0',
    });
  });
});
