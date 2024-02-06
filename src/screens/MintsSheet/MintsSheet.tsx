import React from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Column,
  Columns,
  Inset,
  Separator,
  Stack,
  Text,
  globalColors,
  useColorMode,
} from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { mintsQueryKey, useMints } from '@/resources/mints';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import { TabBar } from './TabBar';
import { Card } from './card/Card';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';
import { queryClient } from '@/react-query';
import ActivityIndicator from '@/components/ActivityIndicator';
import { IS_ANDROID, IS_IOS } from '@/env';
import Spinner from '@/components/Spinner';
import * as i18n from '@/languages';

const LoadingSpinner = IS_ANDROID ? Spinner : ActivityIndicator;

export function MintsSheet() {
  const { accountAddress, accountImage, accountColor, accountSymbol } = useAccountProfile();
  const {
    data: { mints },
    isFetching,
    dataUpdatedAt,
  } = useMints({
    walletAddress: accountAddress,
  });
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();
  const { colorMode } = useColorMode();

  const data = mints ?? [];

  const isNoData = !data.length && !isFetching;

  return (
    <>
      <BackgroundProvider color="surfaceSecondaryElevated">
        {({ backgroundColor }) => (
          <SimpleSheet backgroundColor={backgroundColor as string}>
            <Inset top="20px" bottom={{ custom: IS_IOS ? 110 : 150 }}>
              <Inset horizontal="20px">
                <Stack space="10px">
                  <Columns alignVertical="center">
                    <Column width="content">
                      <AccentColorProvider color={accountColor ?? globalColors.grey100}>
                        <ButtonPressAnimation onPress={() => navigate(Routes.CHANGE_WALLET_SHEET)} disabled={IS_ANDROID}>
                          {accountImage ? (
                            <Box
                              as={ImgixImage}
                              background="surfaceSecondaryElevated"
                              size={36}
                              source={{ uri: accountImage }}
                              width={{ custom: 36 }}
                              height="36px"
                              borderRadius={36}
                              shadow="12px accent"
                            />
                          ) : (
                            <Box
                              as={ContactAvatar}
                              background="surfacePrimary"
                              shadow="12px accent"
                              color={accountColor}
                              size="smedium"
                              borderRadius={36}
                              value={accountSymbol}
                            />
                          )}
                        </ButtonPressAnimation>
                      </AccentColorProvider>
                    </Column>
                    <Column>
                      <Text color="label" size="20pt" align="center" weight="heavy">
                        {i18n.t(i18n.l.mints.mints_sheet.mints)}
                      </Text>
                    </Column>
                    <Column width="content">
                      <Box width={{ custom: 36 }} />
                    </Column>
                  </Columns>
                  <Separator thickness={1} color="separatorTertiary" />
                </Stack>
              </Inset>
              {!isNoData && (
                <FlashList
                  data={data}
                  estimatedItemSize={222}
                  estimatedListSize={{
                    height: deviceHeight,
                    width: deviceWidth,
                  }}
                  renderItem={({ item }) => <Card collection={item} />}
                  ItemSeparatorComponent={() => <Separator thickness={1} color="separatorTertiary" />}
                  keyExtractor={item => item.contractAddress + item.chainId}
                />
              )}
            </Inset>
          </SimpleSheet>
        )}
      </BackgroundProvider>
      {!data.length && (
        <Box alignItems="center" justifyContent="center" height="full" position="absolute" width="full">
          {!isFetching ? (
            <Stack space="20px">
              <Text size="17pt" weight="bold" align="center" color="labelSecondary">
                {i18n.t(i18n.l.mints.mints_sheet.no_data_found)}
              </Text>
              <ButtonPressAnimation
                onPress={() => {
                  // only allow refresh if data is at least 30 seconds old
                  if (!dataUpdatedAt || Date.now() - dataUpdatedAt > 30_000) {
                    queryClient.invalidateQueries({
                      queryKey: mintsQueryKey({
                        address: accountAddress,
                      }),
                    });
                  }
                }}
              >
                <Text align="center" color="labelSecondary" size="34pt" weight="bold">
                  􀅈
                </Text>
              </ButtonPressAnimation>
            </Stack>
          ) : (
            <LoadingSpinner color={colorMode === 'light' ? 'black' : 'white'} size={36} />
          )}
        </Box>
      )}
      <TabBar />
    </>
  );
}
