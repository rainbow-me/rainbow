import { getDappMetadata } from '@/resources/metadata/dapp';
import { useAppSessionsStore } from '@/state/appSessions';
import { ChainId } from '@/state/backendNetworks/types';
import { handleDappBrowserRequest } from '@/utils/requestNavigationHandlers';
import { handleProviderRequest } from '@rainbow-me/provider';

import { handleProviderRequestApp, type ProviderRequestPayload } from './handleProviderRequest';

const mockHandleProviderRequest = handleProviderRequest as jest.Mock;
const mockGetDappMetadata = getDappMetadata as jest.Mock;
const mockHandleDappBrowserRequest = handleDappBrowserRequest as jest.Mock;

const UNISWAP_URL = 'https://app.uniswap.org/swap';
const UNISWAP_HOST = 'app.uniswap.org';
const ADDRESS = '0x0000000000000000000000000000000000000001';

jest.mock('@rainbow-me/provider', () => ({
  handleProviderRequest: jest.fn(),
}));

jest.mock('@/resources/metadata/dapp', () => ({
  getDappMetadata: jest.fn(),
}));

jest.mock('@/handlers/web3', () => ({
  getProvider: jest.fn(),
}));

jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: {
    getState: () => ({ activeRoute: null }),
  },
}));

jest.mock('@/utils/requestNavigationHandlers', () => ({
  handleDappBrowserConnectionPrompt: jest.fn(),
  handleDappBrowserRequest: jest.fn(),
}));

describe('handleProviderRequestApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppSessionsStore.getState().clearSessions();
    mockGetDappMetadata.mockResolvedValue({
      appHost: UNISWAP_HOST,
      appName: 'Uniswap',
      appShortName: 'Uniswap',
      url: UNISWAP_URL,
    });
    mockHandleDappBrowserRequest.mockResolvedValue('0xsigned');
  });

  it('routes Uniswap app signing requests through the active dapp session', async () => {
    const request: ProviderRequestPayload = {
      id: 1,
      method: 'personal_sign',
      meta: {
        sender: {
          title: 'Uniswap App',
          url: UNISWAP_URL,
        },
        topic: 'providerRequest',
      },
      params: ['0x48656c6c6f20556e6973776170', ADDRESS],
    };

    useAppSessionsStore.getState().addSession({
      address: ADDRESS,
      chainId: ChainId.base,
      host: UNISWAP_HOST,
      url: UNISWAP_URL,
    });

    const messenger = {
      available: true,
      listeners: {},
      name: 'testMessenger',
      reply: jest.fn(),
      send: jest.fn(),
    } as Parameters<typeof handleProviderRequestApp>[0]['messenger'] & { listeners: Record<string, unknown> };

    handleProviderRequestApp({
      data: request,
      messenger,
      meta: request.meta,
    });

    const providerConfig = mockHandleProviderRequest.mock.calls[0][0];
    await providerConfig.messengerProviderRequest(request);

    expect(mockGetDappMetadata).toHaveBeenCalledWith({ url: UNISWAP_URL });
    expect(mockHandleDappBrowserRequest).toHaveBeenCalledWith({
      address: ADDRESS,
      chainId: ChainId.base,
      dappName: 'Uniswap',
      dappUrl: UNISWAP_URL,
      imageUrl: '',
      payload: request,
    });
  });
});
