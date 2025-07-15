import { useToastStore } from '@/components/rainbow-toast/useRainbowToasts';
import { Sheet } from '@/components/sheet';
import { Box, Text } from '@/design-system';
import { RainbowTransaction, TransactionDirection, TransactionStatus } from '@/entities';
import { pendingTransactionsStore, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import React from 'react';
import { Button, ScrollView } from 'react-native';

// the RainbowTransaction type is off from real data so i'm casting them:

const exampleSwaps: RainbowTransaction[] = [
  {
    isMocked: true,
    chainId: 1,
    data: '0x3c2b9a7d00000000000000000000000005be1d4c307c19450a6fd7ce7307ce72a3829a6000000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc450000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000007bb0f7b08000000000000000000000000000000000000000000000000000000000000000184ac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000005be1d4c307c19450a6fd7ce7307ce72a3829a600000000000000000000000000000000000000000000000000000000000000bb800000000000000000000000000000000009726632680fb29d3f7a9734e3010e2000000000000000000000000000000000000000000000000000385c3954b780000000000000000000000000000000000000000000000000019e40eccca027a3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d7e44d53',
    from: '0x2e67869829c734ac13723A138a952F7A8B56e774',
    to: '0x00000000009726632680fb29d3f7a9734e3010e2',
    value: '1000000000000000',
    asset: {
      colors: {
        primary: '#5A92AB',
        fallback: '',
        shadow: '',
      },
      icon_url:
        'https://rainbowme-res.cloudinary.com/image/upload/v1721694918/assets/ethereum/0x05be1d4c307c19450a6fd7ce7307ce72a3829a60.png',
      name: 'International Meme Fund',
      networks: {
        '1': {
          address: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60',
          decimals: 18,
        },
      },
      symbol: 'IMF',
      decimals: 18,
      highLiquidity: true,
      isRainbowCurated: false,
      isVerified: true,
      uniqueId: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60_1',
      address: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60',
      market: {
        currency_used: 'usd',
        fdv: 35703121.8186819,
        volume_24h: 615887.287797017,
        circulating_supply: 31881158.77891933,
        total_supply: 33000000,
        max_supply: 33000000,
        market_cap: {
          value: 34492633.2006368,
        },
        price: {
          value: 1.0819127824,
          change_24h: 12.73,
        },
        ath: {
          value: 1.092,
          change_percentage: -0.25183,
          date: '2025-07-09T20:51:07.332Z',
        },
        atl: {
          value: 0.0241715,
          change_percentage: 4407.29351,
          date: '2025-04-07T07:01:13.007Z',
        },
        updated_at: '2025-07-09T22:04:32.10839793Z',
      },
      bridging: {
        bridgeable: false,
        networks: {},
      },
      trending: {
        origin_id: 'rainbow',
        timeframe_id: 3,
        rank: 647,
        trending_since: '2024-12-31T19:15:41.79896Z',
        pool_data: {
          pool_hash: '0x59d813c1d0266278e2f5f146c0e222a6cfea83df',
          currency_used: 'usd',
          reserve: 2507522.3106,
          h1_volume: 24364.6496135043,
          h6_volume: 149173.098513432,
          h24_volume: 615887.287797017,
          m5_price_change: 0,
          h1_price_change: -0.64,
          h6_price_change: 15.64,
          h24_price_change: 12.73,
        },
        swap_data: {
          currency_used: 'usd',
          bought_stats: {
            unique_users: 1,
            total_transactions: 1,
            total_volume: 6001.7191,
          },
          sold_stats: {
            unique_users: 2,
            total_transactions: 3,
            total_volume: 6918.11227581952,
          },
        },
      },
      creationDate: '2024-05-28T11:00:11Z',
      chainId: 1,
      transferable: true,
      isNativeAsset: false,
      mainnetAddress: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60',
      favorite: false,
      sectionId: 'popular',
      listItemType: 'coinRow',
      chainName: 'mainnet',
      native: {
        balance: {
          amount: '0',
          display: '0.00',
        },
      },
      balance: {
        amount: '0',
        display: '0.00',
      },
      color: {
        light: '#5A92AB',
        dark: '#5A92AB',
      },
      shadowColor: {
        light: '#5A92AB',
        dark: '#5A92AB',
      },
      mixedShadowColor: {
        light: '#314550',
        dark: '#000',
      },
      highContrastColor: {
        light: '#5A92AB',
        dark: '#5A92AB',
      },
      tintedBackgroundColor: {
        light: '#fafafa',
        dark: '#0a1013',
      },
      textColor: {
        light: '#FFFFFF',
        dark: '#FFFFFF',
      },
      maxSwappableAmount: '0',
      network: 'mainnet',
    },
    changes: [
      {
        direction: TransactionDirection.OUT,
        asset: {
          address: 'eth',
          uniqueId: 'eth_1',
          chainId: 1,
          chainName: 'mainnet',
          mainnetAddress: 'eth',
          isNativeAsset: true,
          name: 'Ethereum',
          price: {
            value: 3075.05,
          },
          symbol: 'ETH',
          type: 'native',
          decimals: 18,
          icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
          colors: {
            primary: '#808088',
            fallback: '#E8EAF5',
          },
          networks: {
            '1': {
              address: 'eth',
              decimals: 18,
            },
            '10': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '56': {
              address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
              decimals: 18,
            },
            '130': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '324': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '8453': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '42161': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '57073': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '59144': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '81457': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '534352': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
            '7777777': {
              address: '0x0000000000000000000000000000000000000000',
              decimals: 18,
            },
          },
          bridging: {
            isBridgeable: true,
            networks: {
              '10': {
                bridgeable: true,
              },
              '56': {
                bridgeable: true,
              },
              '130': {
                bridgeable: true,
              },
              '324': {
                bridgeable: true,
              },
              '8453': {
                bridgeable: true,
              },
              '42161': {
                bridgeable: true,
              },
              '57073': {
                bridgeable: true,
              },
              '59144': {
                bridgeable: true,
              },
              '81457': {
                bridgeable: true,
              },
              '534352': {
                bridgeable: true,
              },
              '7777777': {
                bridgeable: true,
              },
            },
          },
          balance: {
            amount: '0.79606854831326995',
            display: '0.796 ETH',
          },
          smallBalance: false,
          color: {
            light: '#25292E',
            dark: '#677483',
          },
          shadowColor: {
            light: '#25292E',
            dark: '#677483',
          },
          mixedShadowColor: {
            light: '#25292e',
            dark: '#000',
          },
          highContrastColor: {
            light: '#25292E',
            dark: '#677483',
          },
          tintedBackgroundColor: {
            light: '#f7f7f7',
            dark: '#0c0d0f',
          },
          textColor: {
            light: '#FFFFFF',
            dark: '#FFFFFF',
          },
          nativePrice: 3075.05,
          maxSwappableAmount: '0.79447926401516995',
          network: 'mainnet',
        },
        value: '1000000000000000',
      },
      {
        direction: TransactionDirection.IN,
        asset: {
          colors: {
            primary: '#5A92AB',
            fallback: '',
            shadow: '',
          },
          icon_url:
            'https://rainbowme-res.cloudinary.com/image/upload/v1721694918/assets/ethereum/0x05be1d4c307c19450a6fd7ce7307ce72a3829a60.png',
          name: 'International Meme Fund',
          networks: {
            '1': {
              address: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60',
              decimals: 18,
            },
          },
          symbol: 'IMF',
          decimals: 18,
          highLiquidity: true,
          isRainbowCurated: false,
          isVerified: true,
          uniqueId: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60_1',
          address: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60',
          market: {
            currency_used: 'usd',
            fdv: 35703121.8186819,
            volume_24h: 615887.287797017,
            circulating_supply: 31881158.77891933,
            total_supply: 33000000,
            max_supply: 33000000,
            market_cap: {
              value: 34492633.2006368,
            },
            price: {
              value: 1.0819127824,
              change_24h: 12.73,
            },
            ath: {
              value: 1.092,
              change_percentage: -0.25183,
              date: '2025-07-09T20:51:07.332Z',
            },
            atl: {
              value: 0.0241715,
              change_percentage: 4407.29351,
              date: '2025-04-07T07:01:13.007Z',
            },
            updated_at: '2025-07-09T22:04:32.10839793Z',
          },
          bridging: {
            bridgeable: false,
            networks: {},
          },
          trending: {
            origin_id: 'rainbow',
            timeframe_id: 3,
            rank: 647,
            trending_since: '2024-12-31T19:15:41.79896Z',
            pool_data: {
              pool_hash: '0x59d813c1d0266278e2f5f146c0e222a6cfea83df',
              currency_used: 'usd',
              reserve: 2507522.3106,
              h1_volume: 24364.6496135043,
              h6_volume: 149173.098513432,
              h24_volume: 615887.287797017,
              m5_price_change: 0,
              h1_price_change: -0.64,
              h6_price_change: 15.64,
              h24_price_change: 12.73,
            },
            swap_data: {
              currency_used: 'usd',
              bought_stats: {
                unique_users: 1,
                total_transactions: 1,
                total_volume: 6001.7191,
              },
              sold_stats: {
                unique_users: 2,
                total_transactions: 3,
                total_volume: 6918.11227581952,
              },
            },
          },
          creationDate: '2024-05-28T11:00:11Z',
          chainId: 1,
          transferable: true,
          isNativeAsset: false,
          mainnetAddress: '0x05be1d4c307c19450a6fd7ce7307ce72a3829a60',
          favorite: false,
          sectionId: 'popular',
          listItemType: 'coinRow',
          chainName: 'mainnet',
          balance: {
            amount: '0',
            display: '0.00',
          },
          color: {
            light: '#5A92AB',
            dark: '#5A92AB',
          },
          shadowColor: {
            light: '#5A92AB',
            dark: '#5A92AB',
          },
          mixedShadowColor: {
            light: '#314550',
            dark: '#000',
          },
          highContrastColor: {
            light: '#5A92AB',
            dark: '#5A92AB',
          },
          tintedBackgroundColor: {
            light: '#fafafa',
            dark: '#0a1013',
          },
          textColor: {
            light: '#FFFFFF',
            dark: '#FFFFFF',
          },
          maxSwappableAmount: '0',
          network: 'mainnet',
        },
        value: '1884477190266166868',
      },
    ],
    gasLimit: '194747',
    hash: '0x74b32de0ef6ab3296f00d00910bef1d5d2c93a3c7f17509aabec317d989efc0f',
    network: 'mainnet',
    nonce: 2632,
    status: 'pending',
    type: 'swap',
    swap: {
      type: 'normal',
      fromChainId: 1,
      toChainId: 1,
      isBridge: false,
    },
    maxFeePerGas: '5147132228',
    maxPriorityFeePerGas: '146087701',
    title: 'swap.pending',
    description: 'Ethereum',
    timestamp: 1752607596729,
  } as unknown as RainbowTransaction,
];

const exampleSends: RainbowTransaction[] = [
  {
    isMocked: true,
    amount: '0.0003255',
    asset: {
      isCoin: true,
      isSmall: false,
      address: 'eth',
      balance: {
        amount: '0.79651955346746395',
        display: '0.797 ETH',
      },
      network: 'mainnet',
      name: 'Ethereum',
      chainId: 1,
      color: '#808088',
      colors: {
        primary: '#808088',
        fallback: '#E8EAF5',
      },
      decimals: 18,
      icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
      id: 'eth',
      isNativeAsset: true,
      price: {
        relative_change_24h: 2.2669320852446484,
        value: 3072.1600000000003,
      },
      mainnet_address: 'eth',
      native: {
        balance: {
          amount: '2447.035511380604287587866040239185',
          display: '$2,447.04',
        },
        change: '2.27%',
        price: {
          amount: '3072.1600000000003',
          display: '$3,072.16',
        },
      },
      symbol: 'ETH',
      type: 'native',
      uniqueId: 'eth_1',
    },
    from: '0x2e67869829c734ac13723A138a952F7A8B56e774',
    gasLimit: '21000',
    network: 'mainnet',
    chainId: 1,
    nonce: 2631,
    to: '0x49B1318bF58Fe42FE42cFE0E54B9F82479A857A7',
    maxFeePerGas: '0x019eb9bd6e',
    maxPriorityFeePerGas: '0x03f7aea6',
    hash: '0xc3ebffa32267110609b35674abc36a2f864edb59060d83e165b64fa9454b91e9',
    data: '0x',
    value: '0x01280a5fdfd800',
    txTo: '0x49B1318bF58Fe42FE42cFE0E54B9F82479A857A7',
    type: 'send',
    status: TransactionStatus.pending,
    title: 'send.pending',
    description: 'Ethereum',
    timestamp: 1752606976389,
  } as unknown as RainbowTransaction,
  {
    isMocked: true,
    amount: '0.00065165',
    asset: {
      isCoin: true,
      isSmall: false,
      address: 'eth',
      balance: {
        amount: '0.79780705575339895',
        display: '0.798 ETH',
      },
      network: 'mainnet',
      name: 'Ethereum',
      chainId: 1,
      color: '#808088',
      colors: {
        primary: '#808088',
        fallback: '#E8EAF5',
      },
      decimals: 18,
      icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
      id: 'eth',
      isNativeAsset: true,
      price: {
        relative_change_24h: 2.1664014700105843,
        value: 3069.14,
      },
      mainnet_address: 'eth',
      native: {
        balance: {
          amount: '2448.581547094986853403',
          display: '$2,448.58',
        },
        change: '2.17%',
        price: {
          amount: '3069.14',
          display: '$3,069.14',
        },
      },
      symbol: 'ETH',
      type: 'native',
      uniqueId: 'eth_1',
    },
    from: '0x2e67869829c734ac13723A138a952F7A8B56e774',
    gasLimit: '21000',
    network: 'mainnet',
    chainId: 1,
    nonce: 2629,
    to: '0x49B1318bF58Fe42FE42cFE0E54B9F82479A857A7',
    maxFeePerGas: '0x028f0d67f9',
    maxPriorityFeePerGas: '0x05dadef0',
    hash: '0x0812224d823b1c5448fc986d65946f0e5d493f9874ec9856290e46176a807b8b',
    data: '0x',
    value: '0x0250ac16c49400',
    txTo: '0x49B1318bF58Fe42FE42cFE0E54B9F82479A857A7',
    type: 'send',
    status: TransactionStatus.sending,
    title: 'send.pending',
    description: 'Ethereum',
    timestamp: 1752606363082,
  } as unknown as RainbowTransaction,
];

let lastSend = 0;
let lastSwap = 0;

export function DevActionsSheet() {
  const accountAddress = useAccountAddress();

  const createMockSendTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleSends[lastSend++ % exampleSends.length],
      status,
    };
  };

  const createMockSwapTransaction = (status: TransactionStatus): RainbowTransaction => {
    return {
      ...exampleSwaps[lastSwap++ % exampleSwaps.length],
      status,
    };
  };

  // const createMockMintTransaction = (status: TransactionStatus): RainbowTransaction => {
  //   return {
  //     chainId: ChainId.mainnet,
  //     from: accountAddress,
  //     to: '0x495f947276749ce646f68ac8c248420045cb7b5e',
  //     hash: generateRandomHash(),
  //     nonce: Math.floor(Math.random() * 1000),
  //     network: 'mainnet',
  //     type: 'mint' as const,
  //     status,
  //     description: 'A beautiful NFT',
  //   };
  // };

  const current: RainbowTransaction[] = [];

  function addThenUpdate(transaction: RainbowTransaction) {
    current.push(transaction);
    pendingTransactionsStore.setState(state => ({
      ...state,
      pendingTransactions: {
        [accountAddress]: current,
      },
    }));
  }

  const addSendTransaction = () => {
    addThenUpdate(createMockSendTransaction(TransactionStatus.sending));
  };

  const addSwapTransaction = () => {
    addThenUpdate(createMockSwapTransaction(TransactionStatus.swapping));
  };

  const addMintTransaction = () => {
    // TODO - disabling as i moved to real data
    // addThenUpdate(createMockMintTransaction(TransactionStatus.minting));
  };

  const updateLatestTransactionOfType = (type: 'mint' | 'swap' | 'send', status: TransactionStatus) => {
    const latest = current.findLast(px => px.type === type);
    if (latest) {
      pendingTransactionsStore.setState(state => ({
        ...state,
        pendingTransactions: {
          [accountAddress]: current.map(item => (item === latest ? { ...item, status } : item)),
        },
      }));
    }
  };

  const updateLastSendTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('send', status);
  };

  const updateLastSwapTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('swap', status);
  };

  const updateLastMintTo = (status: TransactionStatus) => {
    updateLatestTransactionOfType('mint', status);
  };

  return (
    <Sheet>
      <Box paddingHorizontal="20px" paddingTop="44px">
        <Text size="20pt" weight="bold" color="label" align="center">
          Transactions
        </Text>

        <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
          <Box gap={12}>
            <Button
              onPress={() => {
                usePendingTransactionsStore.getState().clearPendingTransactions();
                useToastStore.setState(() => ({
                  hiddenToasts: {},
                  toasts: [],
                }));
              }}
              title="Clear All"
            />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Send
            </Text>

            <Button onPress={addSendTransaction} title="Add Send Transaction" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.sending)} title="Update Send → Sending" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.sent)} title="Update Send → Sent" />
            <Button onPress={() => updateLastSendTo(TransactionStatus.failed)} title="Update Send → Failed" />

            <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Swap
            </Text>

            <Button onPress={addSwapTransaction} title="Add Swap Transaction" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.swapping)} title="Update Swap → Swapping" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.swapped)} title="Update Swap → Swapped" />
            <Button onPress={() => updateLastSwapTo(TransactionStatus.failed)} title="Update Swap → Failed" />

            {/* <Text size="17pt" weight="semibold" color="label" style={{ marginTop: 20 }}>
              Mint
            </Text>

            <Button onPress={addMintTransaction} title="Add Mint Transaction" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.minting)} title="Update Mint → Minting" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.minted)} title="Update Mint → Minted" />
            <Button onPress={() => updateLastMintTo(TransactionStatus.failed)} title="Update Mint → Failed" /> */}
          </Box>
        </ScrollView>
      </Box>
    </Sheet>
  );
}
