// import { dequal } from 'dequal';
// import { atom, useAtom, useAtomValue } from 'jotai';
// import { DevTools } from 'jotai-devtools';
// import React, { memo, useEffect, useRef, useState } from 'react';
// import { StyleSheet } from 'react-native';
// import { Address } from 'viem';
// import { ButtonPressAnimation } from '@/components/animations';
// import { Box, Text, globalColors } from '@/design-system';
// import { useQueryAtom } from './useQueryAtom';
// import { useQuery } from './useQuery';
// import { useUserAssetsStore } from '@/state/assets/userAssets';
// import { time } from '@/utils';
// import { useStableAtom, useStableAtomValue } from './useStableAtom';
// import { ChainId } from '@/state/backendNetworks/types';
// import { atomWithDefault, selectAtom } from 'jotai/utils';

// const ADDRESSES: Address[] = [
//   '0x2e67869829c734ac13723A138a952F7A8B56e774',
//   '0xCFB83E14AEd465c79F3F82f4cfF4ff7965897644',
//   '0x17cd072cBd45031EFc21Da538c783E0ed3b25DCc',
// ];

// const addressAtom = atom<Address>(ADDRESSES[0]);

// // export const UserAssetsQueryTest = memo(function UserAssetsQueryTest() {
// //   const [address, setAddress] = useAtom(addressAtom);
// //   const queryAtom = useUserAssetsQuery(address);
// //   const { data, loading } = useAtomValue(queryAtom);

// //   return (
// //     <Box alignItems="center" gap={28} height="full" justifyContent="center" width="full">
// //       <Text align="center" color={loading ? 'label' : data ? 'green' : 'red'} containsEmoji size="20pt" weight="heavy">
// //         {loading ? '🔄 Loading…' : data ? '✅ Success' : '❌ Error or Stuck'}
// //       </Text>
// //       <Text align="center" color="label" size="20pt" weight="heavy">
// //         Address: {`${address.slice(0, 6)}…${address.slice(-4)}`}
// //       </Text>
// //       <Text align="center" color="label" size="20pt" weight="heavy">
// //         Assets: {data?.length}
// //       </Text>
// //       <ButtonPressAnimation onPress={() => setAddress(getNextAddress(address))} style={styles.button}>
// //         <Text align="center" color={{ custom: globalColors.white100 }} size="17pt" weight="heavy">
// //           Shuffle Address
// //         </Text>
// //       </ButtonPressAnimation>
// //     </Box>
// //   );
// // });

// // const EMPTY_CHAIN_IDS: ChainId[] = [];

// export const UserAssetsQueryTest = memo(function UserAssetsQueryTest() {
//   const [address, setAddress] = useAtom(addressAtom);

//   // const queryAtom = useQueryAtom(useUserAssetsStore, {
//   //   options: {
//   //     debugMode: true,
//   //     useStoreCache: true,
//   //   },
//   //   params: { address: ADDRESSES[0] },
//   // });

//   // const renderCounts = useRef({
//   //   addressChangeCount: -1,
//   //   dataChangeCount: -1,
//   //   isFetchingChangeCount: -1,
//   //   renderCount: -1,
//   // });

//   // const data2 = useStableAtomValue(() => selectAtom(queryAtom, state => state.data));

//   // const address = ADDRESSES[0];

//   const data = useQuery(useUserAssetsStore, state => state.data, {
//     options: {
//       debugMode: true,
//       disableAutoRefetching: true,
//       staleTime: time.minutes(15),
//     },
//     params: { address },
//   });

//   // const [isFetching] = useStableAtomValue(selectAtom(queryAtom, state => state.isFetching, dequal));

//   console.log('[🚨🚨 RERENDER 🚨🚨]');
//   console.log('typeof data', typeof data);

//   useEffect(() => {
//     console.log('⚠️🌀🌀 data changed 🌀🌀', JSON.stringify(data).length.toLocaleString());
//   }, [data]);

//   const isFetching = false;

//   // renderCounts.current.renderCount += 1;
//   // if (renderCounts.current.renderCount >= 0) console.log('renderCount', renderCounts.current.renderCount);

//   // useEffect(() => {
//   //   renderCounts.current.dataChangeCount += 1;
//   //   if (renderCounts.current.dataChangeCount === 0) return;
//   //   console.log(
//   //     'data changed - count:',
//   //     renderCounts.current.dataChangeCount,
//   //     'data length:',
//   //     JSON.stringify(data).length.toLocaleString()
//   //   );
//   // }, [data]);

//   // useEffect(() => {
//   //   renderCounts.current.isFetchingChangeCount += 1;
//   //   if (renderCounts.current.isFetchingChangeCount === 0) return;
//   //   console.log('isFetching changed - count:', renderCounts.current.isFetchingChangeCount, 'isFetching:', isFetching);
//   // }, [isFetching]);

//   // useEffect(() => {
//   //   renderCounts.current.addressChangeCount += 1;
//   //   if (renderCounts.current.addressChangeCount === 0) return;
//   //   console.log('address changed - count:', renderCounts.current.addressChangeCount);
//   // }, [address]);

//   return (
//     <Box alignItems="center" gap={28} justifyContent="center" style={styles.container} width="full">
//       <Text align="center" color={isFetching ? 'label' : data ? 'green' : 'red'} containsEmoji size="20pt" weight="heavy">
//         {isFetching ? '🔄 Loading…' : data ? '✅ Success' : '❌ Error or Stuck'}
//       </Text>
//       <Text align="center" color="label" size="20pt" weight="heavy">
//         Address: {`${address.slice(0, 6)}…${address.slice(-4)}`}
//       </Text>
//       <Text align="center" color="label" size="20pt" weight="heavy">
//         Assets: {data?.userAssets?.length}
//       </Text>
//       <ButtonPressAnimation onPress={() => setAddress(getNextAddress(address))} style={styles.button}>
//         {/* <ButtonPressAnimation style={styles.button}> */}
//         <Text align="center" color={{ custom: globalColors.white100 }} size="17pt" weight="heavy">
//           Shuffle Address
//         </Text>
//       </ButtonPressAnimation>
//     </Box>
//   );
// });

// function getNextAddress(address: Address): Address {
//   const index = ADDRESSES.indexOf(address);
//   return ADDRESSES[index + 1] ?? ADDRESSES[0];
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
//   container: {
//     flex: 1,
//   },
// });
