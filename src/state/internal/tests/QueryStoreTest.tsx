// ⚠️ Uncomment everything below to experiment with the QueryStore creator

// import React, { memo, useEffect, useMemo } from 'react';
// import { StyleSheet, View } from 'react-native';
// import { Address } from 'viem';
// import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
// import { ImgixImage } from '@/components/images';
// import { Text, useForegroundColor } from '@/design-system';
// import { logger, RainbowError } from '@/logger';
// import { SupportedCurrencyKey } from '@/references';
// import { addysHttp } from '@/resources/addys/claimables/query';
// import { parseUserAssets } from '@/__swaps__/screens/Swap/resources/assets/userAssets';
// import { ParsedAssetsDictByChain } from '@/__swaps__/types/assets';
// import { AddressAssetsReceivedMessage } from '@/__swaps__/types/refraction';
// import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
// import { time } from '@/utils';
// import { createQueryStore } from '../createQueryStore';
// import { createRainbowStore } from '../createRainbowStore';

// const ENABLE_LOGS = false;

// type CurrencyStore = {
//   nestedParamTest: {
//     currency: SupportedCurrencyKey;
//   };
//   setCurrency: (currency: SupportedCurrencyKey) => void;
// };

// const useCurrencyStore = createRainbowStore<CurrencyStore>((set, get) => ({
//   nestedParamTest: { currency: 'USD' },
//   setCurrency: (currency: SupportedCurrencyKey) => {
//     set({ nestedParamTest: { currency } });
//     if (ENABLE_LOGS) console.log('[👤 useCurrencyStore 👤] New currency set:', get().nestedParamTest.currency);
//   },
// }));

// type UserAssetsTestStore = {
//   address: Address;
//   setAddress: (address: Address) => void;
// };

// type UserAssetsQueryParams = { address: Address; currency: SupportedCurrencyKey };

// const testAddresses: Address[] = [
//   '0x2e67869829c734ac13723A138a952F7A8B56e774',
//   '0xCFB83E14AEd465c79F3F82f4cfF4ff7965897644',
//   '0x17cd072cBd45031EFc21Da538c783E0ed3b25DCc',
// ];

// export const useUserAssetsTestStore = createQueryStore<ParsedAssetsDictByChain, UserAssetsQueryParams, UserAssetsTestStore>(
//   {
//     fetcher: ({ address, currency }) => simpleUserAssetsQuery({ address, currency }),
//     params: {
//       address: ($, store) => $(store).address,
//       currency: $ => $(useCurrencyStore).nestedParamTest.currency,
//     },
//     staleTime: time.minutes(1),
//   },

//   set => ({
//     address: testAddresses[0],
//     setAddress: (address: Address) => set({ address }),
//   }),

//   { storageKey: 'queryStoreTest' }
// );

// export const UserAssetsTest = memo(function UserAssetsTest() {
//   const data = useUserAssetsTestStore(state => state.getData());
//   const enabled = useUserAssetsTestStore(state => state.enabled);

//   const firstFiveCoinIconUrls = useMemo(() => (data ? getFirstFiveCoinIconUrls(data) : Array.from({ length: 5 }).map(() => '')), [data]);
//   const skeletonColor = useForegroundColor('fillQuaternary');

//   useEffect(() => {
//     if (ENABLE_LOGS && data) {
//       const first5Tokens = Object.values(data)
//         .flatMap(chainAssets => Object.values(chainAssets))
//         .slice(0, 5);
//       console.log('[🔔 UserAssetsTest 🔔] userAssets data updated - first 5 tokens:', first5Tokens.map(token => token.symbol).join(', '));
//     }
//   }, [data]);

//   useEffect(() => {
//     if (ENABLE_LOGS) console.log(`[🔔 UserAssetsTest 🔔] enabled updated to: ${enabled ? '✅ ENABLED' : '🛑 DISABLED'}`);
//   }, [enabled]);

//   return (
//     <View style={styles.container}>
//       <View style={styles.coinIconContainer}>
//         {firstFiveCoinIconUrls.map((url, index) =>
//           url ? (
//             <ImgixImage enableFasterImage key={index} source={{ uri: url }} style={styles.coinIcon} />
//           ) : (
//             <View key={index} style={[styles.coinIcon, { backgroundColor: skeletonColor }]} />
//           )
//         )}
//       </View>
//       <Text align="center" color="label" size="17pt" weight="heavy">
//         {data
//           ? `Number of assets: ${Object.values(data).reduce((acc, chainAssets) => acc + Object.keys(chainAssets).length, 0)}`
//           : 'Loading…'}
//       </Text>
//       <View style={styles.buttonGroup}>
//         <ButtonPressAnimation
//           onPress={() => {
//             const currentAddress = useUserAssetsTestStore.getState().address;
//             switch (currentAddress) {
//               case testAddresses[0]:
//                 useUserAssetsTestStore.getState().setAddress(testAddresses[1]);
//                 break;
//               case testAddresses[1]:
//                 useUserAssetsTestStore.getState().setAddress(testAddresses[2]);
//                 break;
//               case testAddresses[2]:
//                 useUserAssetsTestStore.getState().setAddress(testAddresses[0]);
//                 break;
//             }
//           }}
//           style={styles.button}
//         >
//           <Text align="center" color="label" size="17pt" weight="heavy">
//             Shuffle Address
//           </Text>
//         </ButtonPressAnimation>
//         <ButtonPressAnimation
//           onPress={() => {
//             useUserAssetsTestStore.setState({ enabled: !enabled });
//           }}
//           style={styles.button}
//         >
//           <Text align="center" color="label" size="17pt" weight="heavy">
//             {useUserAssetsTestStore.getState().enabled ? 'Disable Fetching' : 'Enable Fetching'}
//           </Text>
//         </ButtonPressAnimation>
//       </View>
//     </View>
//   );
// });

// if (ENABLE_LOGS) console.log('[💾 UserAssetsTest 💾] Initial data exists:', !!useUserAssetsTestStore.getState().getData());

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function logFetchInfo(params: UserAssetsQueryParams) {
//   const formattedTimeWithSeconds = new Date(Date.now()).toLocaleTimeString('en-US', {
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//   });
//   console.log('[🔄 UserAssetsTest - logFetchInfo 🔄]', '\nTime:', formattedTimeWithSeconds, '\nParams:', {
//     address: params.address,
//     currency: params.currency,
//     raw: JSON.stringify(Object.values(params), null, 2),
//   });
// }

// function getFirstFiveCoinIconUrls(data: ParsedAssetsDictByChain) {
//   const result: string[] = [];
//   outer: for (const chainAssets of Object.values(data)) {
//     for (const token of Object.values(chainAssets)) {
//       if (token.icon_url) {
//         result.push(token.icon_url);
//         if (result.length === 5) {
//           break outer;
//         }
//       }
//     }
//   }
//   return result;
// }

// type FetchUserAssetsArgs = {
//   address: Address | string;
//   currency: SupportedCurrencyKey;
//   testnetMode?: boolean;
// };

// export async function simpleUserAssetsQuery({ address, currency }: FetchUserAssetsArgs): Promise<ParsedAssetsDictByChain> {
//   if (!address) return {};
//   try {
//     const url = `/${useBackendNetworksStore.getState().getSupportedChainIds().join(',')}/${address}/assets?currency=${currency.toLowerCase()}`;
//     const res = await addysHttp.get<AddressAssetsReceivedMessage>(url, {
//       timeout: time.seconds(20),
//     });
//     const chainIdsInResponse = res?.data?.meta?.chain_ids || [];
//     const assets = res?.data?.payload?.assets?.filter(asset => !asset.asset.defi_position) || [];

//     if (assets.length && chainIdsInResponse.length) {
//       return parseUserAssets({
//         assets,
//         chainIds: chainIdsInResponse,
//         currency,
//       });
//     }
//     return {};
//   } catch (e) {
//     logger.error(new RainbowError('[simpleUserAssetsQuery]: Failed to fetch user assets'), {
//       message: (e as Error)?.message,
//     });
//     return {};
//   }
// }

// const styles = StyleSheet.create({
//   button: {
//     alignItems: 'center',
//     backgroundColor: 'blue',
//     borderRadius: 22,
//     height: 44,
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//   },
//   buttonGroup: {
//     alignItems: 'center',
//     flexDirection: 'column',
//     gap: 24,
//     justifyContent: 'center',
//   },
//   coinIcon: {
//     borderRadius: 16,
//     height: 32,
//     width: 32,
//   },
//   coinIconContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   container: {
//     alignItems: 'center',
//     flex: 1,
//     flexDirection: 'column',
//     gap: 32,
//     justifyContent: 'center',
//   },
// });
