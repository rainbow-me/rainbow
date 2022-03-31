import { useRoute } from '@react-navigation/core';
import React, { useCallback } from 'react';
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
import { useAccountENSDomains } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import { deviceUtils } from '@rainbow-me/utils';

export const SelectENSSheetHeight = 400;

const deviceHeight = deviceUtils.dimensions.height;
const rowHeight = 40;
const maxListHeight = deviceHeight - 220;

export default function SelectENSSheet() {
  const { data: domains, isSuccess } = useAccountENSDomains();

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

  let listHeight = (rowHeight + 30) * (domains?.length || 0);
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
            Select ENS Name
          </Heading>
          {isSuccess && (
            <Bleed bottom="30px">
              <Box
                ItemSeparatorComponent={() => <Box height={{ custom: 15 }} />}
                as={FlatList}
                contentContainerStyle={{ paddingBottom: 40, paddingTop: 15 }}
                data={domains}
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
