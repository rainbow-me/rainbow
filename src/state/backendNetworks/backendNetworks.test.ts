import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId, type BackendNetwork } from '@/state/backendNetworks/types';

const mockFetchBackendNetworks = jest.fn();

jest.mock('@/resources/metadata/backendNetworks', () => ({
  fetchBackendNetworks: () => mockFetchBackendNetworks(),
}));

jest.mock('@/references/networks.json', () => ({ networks: [] }), { virtual: true });

function buildTeaNetwork(): BackendNetwork {
  return {
    id: '6122',
    name: 'tea',
    label: 'Tea',
    colors: {
      light: '#00A86B',
      dark: '#00C781',
    },
    icons: {
      badgeURL: 'https://example.com/tea-badge.png',
    },
    testnet: false,
    internal: false,
    opStack: true,
    defaultExplorer: {
      url: 'https://explorer.tea.xyz',
      label: 'Tea Explorer',
      transactionURL: 'https://explorer.tea.xyz/tx/{hash}',
      tokenURL: 'https://explorer.tea.xyz/token/{address}',
    },
    defaultRPC: {
      enabledDevices: ['APP'],
      url: 'https://rpc.tea.xyz',
    },
    gasUnits: {
      basic: {
        approval: '60000',
        eoaTransfer: '21000',
        swap: '200000',
        swapPermit: '200000',
        tokenTransfer: '65000',
      },
      wrapped: {
        wrap: '50000',
        unwrap: '50000',
      },
    },
    nativeAsset: {
      address: 'eth',
      name: 'Tea',
      symbol: 'TEA',
      decimals: 18,
      iconURL: 'https://example.com/tea.png',
      colors: {
        primary: '#00A86B',
        fallback: '#E4FFF3',
        shadow: '#00A86B',
      },
    },
    nativeWrappedAsset: {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Wrapped Tea',
      symbol: 'WTEA',
      decimals: 18,
      iconURL: 'https://example.com/wtea.png',
      colors: {
        primary: '#00A86B',
        fallback: '#E4FFF3',
        shadow: '#00A86B',
      },
    },
    enabledServices: {
      addys: {
        approvals: true,
        assets: true,
        interactionsWith: true,
        positions: false,
        transactions: true,
      },
      launcher: {
        v1: {
          enabled: false,
          contractAddress: '0x0000000000000000000000000000000000000000',
        },
      },
      meteorology: {
        enabled: true,
      },
      nftProxy: {
        enabled: false,
      },
      notifications: {
        enabled: true,
      },
      sponsorship: {
        enabled: true,
      },
      swap: {
        bridge: false,
        bridgeExactOutput: false,
        enabled: false,
        swap: false,
        swapExactOutput: false,
      },
      tokenSearch: {
        enabled: true,
      },
    },
  };
}

describe('backendNetworks', () => {
  beforeEach(() => {
    mockFetchBackendNetworks.mockReset();
    useBackendNetworksStore.setState({
      backendChains: [],
      backendNetworks: [],
      enabled: true,
    });
  });

  afterEach(() => {
    useBackendNetworksStore.getState().reset();
  });

  it('supports Tea mainnet metadata from backend networks', async () => {
    mockFetchBackendNetworks.mockResolvedValue({
      networks: [buildTeaNetwork()],
    });

    await useBackendNetworksStore.getState().fetch(undefined, { force: true });

    expect(useBackendNetworksStore.getState().getSupportedMainnetChainIds()).toContain(ChainId.tea);
    expect(useBackendNetworksStore.getState().getNeedsL1SecurityFeeChains()).toContain(ChainId.tea);
    expect(useBackendNetworksStore.getState().getChainsName()[ChainId.tea]).toBe('tea');
    expect(useBackendNetworksStore.getState().getDefaultChains()[ChainId.tea]).toMatchObject({
      id: 6122,
      name: 'Tea',
      nativeCurrency: {
        decimals: 18,
        name: 'Tea',
        symbol: 'TEA',
      },
      blockExplorers: {
        default: {
          name: 'Tea Explorer',
          url: 'https://explorer.tea.xyz',
        },
      },
    });
  });
});
