import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import { Sheet } from '../components/sheet';
import {
  AccentColorProvider,
  Bleed,
  Box,
  ColorModeProvider,
  Heading,
  Inline,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import {
  useAccountENSDomains,
  useAccountProfile,
  useAccountSettings,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import { deviceUtils } from '@rainbow-me/utils';

export const SelectENSSheetHeight = 400;

const deviceHeight = deviceUtils.dimensions.height;
const rowHeight = 40;
const maxListHeight = deviceHeight - 220;

export default function SelectENSSheet() {
  const { data: domains, isSuccess } = useAccountENSDomains();
  const { accountAddress } = useAccountSettings();
  const { accountENS } = useAccountProfile();

  const accentColor = useForegroundColor('action');
  const secondary06 = useForegroundColor('secondary06');
  const secondary30 = useForegroundColor('secondary30');

  const { goBack } = useNavigation();
  const { params } = useRoute<any>();

  const handleSelectENS = useCallback(
    ensName => {
      goBack();
      params?.onSelectENS(ensName);
    },
    [goBack, params]
  );

  const nonPrimaryDomains = useMemo(() => {
    const ownedDomains = domains?.filter(
      ({ owner }) => owner.id?.toLowerCase() === accountAddress.toLowerCase()
    );
    return ownedDomains?.filter(({ name }) => accountENS !== name) || [];
  }, [accountAddress, accountENS, domains]);

  let listHeight = (rowHeight + 40) * (nonPrimaryDomains?.length || 0);
  let scrollEnabled = false;
  if (listHeight > maxListHeight) {
    listHeight = maxListHeight;
    scrollEnabled = true;
  }

  const renderItem = useCallback(
    ({ item }) => {
      return (
        <ButtonPressAnimation
          onPress={() => handleSelectENS(item.name)}
          scaleTo={0.95}
        >
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
                  {item.images.avatarUrl ? (
                    <Box
                      as={ImgixImage}
                      borderRadius={rowHeight / 2}
                      height={{ custom: rowHeight }}
                      source={{ uri: item.images.avatarUrl }}
                      width={{ custom: rowHeight }}
                    />
                  ) : (
                    <AccentColorProvider color={secondary30}>
                      <Text align="right" color="accent" size="20px" weight="bold">
                        􀉭
                      </Text>
                    </AccentColorProvider>
                  )}
                </Box>
                <Box paddingLeft="10px">
                  <Text size="16px" weight="bold">
                    {item.name}
                  </Text>
                </Box>
              </AccentColorProvider>
            </Inline>
          </Inline>
        </ButtonPressAnimation>
      );
    },
    [handleSelectENS, secondary06, secondary30]
  );

  return (
    // @ts-expect-error JavaScript component
    <Sheet>
      <Inset top="6px">
        <Stack space="24px">
          <Heading align="center" size="18px">
            {lang.t('profiles.select_ens_name')}
          </Heading>
          {isSuccess && (
            <Bleed bottom={{ custom: scrollEnabled ? 34 : 26 }}>
              <Box
                ItemSeparatorComponent={() => <Box height={{ custom: 19 }} />}
                as={FlatList}
                contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 19 }}
                data={nonPrimaryDomains}
                height={{ custom: listHeight }}
                keyExtractor={({ domain }: { domain: string }) => domain}
                renderItem={renderItem}
                scrollEnabled={scrollEnabled}
                showsVerticalScrollIndicator={false}
              />
            </Bleed>
          )}
        </Stack>
      </Inset>
    </Sheet>
  );
}
