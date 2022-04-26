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
  const { data: accountENSDomains, isSuccess } = useAccountENSDomains();
  const { accountAddress } = useAccountSettings();
  const { accountENS } = useAccountProfile();
  const accentColor = useForegroundColor('action');

  const { goBack } = useNavigation();
  const { params } = useRoute<any>();

  const handleSelectENS = useCallback(
    ensName => {
      goBack();
      params?.onSelectENS(ensName);
    },
    [goBack, params]
  );

  const ownedDomains = useMemo(() => {
    const domains = accountENSDomains
      ?.filter(
        ({ owner, name }) =>
          owner?.id?.toLowerCase() === accountAddress.toLowerCase() &&
          accountENS !== name
      )
      ?.sort((a, b) => (a.name > b.name ? 1 : -1));

    const primaryDomain = accountENSDomains?.find(
      ({ name }) => accountENS === name
    );
    if (primaryDomain) domains?.unshift(primaryDomain);

    return domains;
  }, [accountAddress, accountENS, accountENSDomains]);

  let listHeight = (rowHeight + 40) * (ownedDomains?.length || 0);
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
              <AccentColorProvider color={accentColor + '20'}>
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
                    <AccentColorProvider color={accentColor}>
                      <Text color="accent" size="14px" weight="medium">
                        {` 􀣵 `}
                      </Text>
                    </AccentColorProvider>
                  )}
                </Box>
                <Box paddingLeft="10px">
                  <Text size="16px" weight="medium">
                    {item.name}
                  </Text>
                </Box>
              </AccentColorProvider>
            </Inline>
            <Text color="action" weight="bold">
              􀰒
            </Text>
          </Inline>
        </ButtonPressAnimation>
      );
    },
    [accentColor, handleSelectENS]
  );

  return (
    // @ts-expect-error JavaScript component
    <Sheet>
      <Inset horizontal="19px" top="10px">
        <Stack space="15px">
          <Heading align="center" size="18px">
            {lang.t('profiles.select_ens_name')}
          </Heading>
          {isSuccess && (
            <Bleed bottom="30px">
              <Box
                ItemSeparatorComponent={() => <Box height={{ custom: 15 }} />}
                as={FlatList}
                contentContainerStyle={{ paddingBottom: 40, paddingTop: 15 }}
                data={ownedDomains}
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
