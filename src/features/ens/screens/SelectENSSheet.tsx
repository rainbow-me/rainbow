import React, { useCallback, useMemo } from 'react';
import { View, type ListRenderItem } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { FlatList } from 'react-native-gesture-handler';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { Sheet } from '@/components/sheet';
import { AccentColorProvider, Bleed, Box, Heading, Inline, Inset, Stack, Text, useForegroundColor } from '@/design-system';
import { abbreviateName } from '@/features/address/core/formatAddress';
import { useEnsImageStore } from '@/features/ens/data/stores/imageStore';
import { useEnsRecordsStore } from '@/features/ens/data/stores/recordsStore';
import { useEnsNameStore } from '@/features/ens/data/useEnsNameStore';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { deviceUtils } from '@/utils/deviceUtils';

import { useAccountENSDomains } from '../hooks/useAccountENSDomains';

const deviceHeight = deviceUtils.dimensions.height;
const rowHeight = 40;
const rowPadding = 19;
const maxListHeight = deviceHeight - 220;

export function SelectENSSheet() {
  const accountAddress = useAccountAddress();
  const { data: names } = useAccountENSDomains(accountAddress);
  const primaryName = useEnsNameStore(s => s.get(accountAddress));

  const secondary06 = useForegroundColor('secondary06 (Deprecated)');

  const { goBack } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.SELECT_ENS_SHEET>>();

  const handleSelectENS = useCallback(
    (ensName: string) => {
      void Promise.allSettled([
        useEnsImageStore.getState().load({ name: ensName, field: 'avatar' }),
        useEnsImageStore.getState().load({ name: ensName, field: 'header' }),
        useEnsRecordsStore.getState().load(ensName),
      ]);
      goBack();
      params?.onSelectENS(ensName);
    },
    [goBack, params]
  );

  const sortedNames = useMemo(
    () => names?.slice().sort((a, b) => (a === primaryName ? -1 : b === primaryName ? 1 : a.localeCompare(b))),
    [names, primaryName]
  );
  const listHeight = (rowHeight + rowPadding) * (names?.length ?? 0) + 21;
  const scrollEnabled = listHeight > maxListHeight;

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item }) => {
      return (
        <ButtonPressAnimation onPress={() => handleSelectENS(item)} scaleTo={0.95}>
          <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
            <Inline alignVertical="center" wrap={false}>
              <AccentColorProvider color={secondary06}>
                <Box
                  alignItems="center"
                  background="accent"
                  borderRadius={rowHeight / 2}
                  height={{ custom: rowHeight }}
                  justifyContent="center"
                  width={{ custom: rowHeight }}
                >
                  <ENSAvatar name={item} />
                </Box>
                <Box paddingLeft="10px">
                  <Text numberOfLines={1} color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                    {abbreviateName(item, 25)}
                  </Text>
                </Box>
              </AccentColorProvider>
            </Inline>
          </Inline>
        </ButtonPressAnimation>
      );
    },
    [handleSelectENS, secondary06]
  );

  return (
    <Sheet>
      <Inset top="6px">
        <Stack space="24px">
          <Heading align="center" color="primary (Deprecated)" size="18px / 21px (Deprecated)" weight="heavy">
            {i18n.t(i18n.l.profiles.select_ens_name)}
          </Heading>
          {names !== undefined && (
            <Bleed bottom={{ custom: scrollEnabled ? 34 : 26 }}>
              <View style={{ height: Math.min(listHeight, maxListHeight) }}>
                <FlatList
                  ItemSeparatorComponent={() => <Box height={{ custom: rowPadding }} />}
                  data={sortedNames}
                  contentContainerStyle={{
                    paddingBottom: 50,
                    paddingHorizontal: 19,
                  }}
                  initialNumToRender={15}
                  keyExtractor={item => item}
                  maxToRenderPerBatch={10}
                  renderItem={renderItem}
                  scrollEnabled={scrollEnabled}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </Bleed>
          )}
        </Stack>
      </Inset>
    </Sheet>
  );
}

function ENSAvatar({ name }: { name: string }) {
  const { colors } = useTheme();

  const avatar = useEnsImageStore(s => s.get(name ? { name, field: 'avatar' } : undefined));

  if (avatar) {
    return (
      <Box
        as={ImgixImage}
        borderRadius={rowHeight / 2}
        height={{ custom: rowHeight }}
        source={{ uri: avatar }}
        width={{ custom: rowHeight }}
        size={100}
      />
    );
  }

  return (
    <AccentColorProvider color={colors.blueGreyDark30}>
      <Text align="right" color="accent" size="20px / 24px (Deprecated)" weight="bold">
        􀉭
      </Text>
    </AccentColorProvider>
  );
}
