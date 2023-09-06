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
} from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import {
  mintableCollectionsQueryKey,
  useMintableCollections,
} from '@/resources/mintdotfun';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import { TabBar } from './TabBar';
import { Card } from './card';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';
import { queryClient } from '@/react-query';

export function MintDotFunSheet() {
  const {
    accountAddress,
    accountImage,
    accountColor,
    accountSymbol,
  } = useAccountProfile();
  const {
    data: {
      getMintableCollections: { collections },
    },
    isFetching,
    dataUpdatedAt,
  } = useMintableCollections({
    walletAddress: accountAddress,
  });
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();

  const data = collections ?? [];

  const isNoData = !data.length && !isFetching;

  return (
    <>
      <BackgroundProvider color="surfaceSecondaryElevated">
        {({ backgroundColor }) => (
          <SimpleSheet backgroundColor={backgroundColor as string}>
            <Inset top="20px" bottom={{ custom: 120 }}>
              <Stack space="20px">
                <Inset horizontal="20px">
                  <Stack space="10px">
                    <Columns alignVertical="center">
                      <Column width="content">
                        <AccentColorProvider color={accountColor}>
                          <ButtonPressAnimation
                            onPress={() => navigate(Routes.CHANGE_WALLET_SHEET)}
                          >
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
                                value={accountSymbol}
                              />
                            )}
                          </ButtonPressAnimation>
                        </AccentColorProvider>
                      </Column>
                      <Column>
                        <Text
                          color="label"
                          size="20pt"
                          align="center"
                          weight="heavy"
                        >
                          Mints
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
                    ItemSeparatorComponent={() => (
                      <Inset vertical="20px">
                        <Separator thickness={1} color="separatorTertiary" />
                      </Inset>
                    )}
                    keyExtractor={item => item.contractAddress + item.chainId}
                  />
                )}
              </Stack>
            </Inset>
          </SimpleSheet>
        )}
      </BackgroundProvider>
      {isNoData && (
        <Box
          alignItems="center"
          justifyContent="center"
          height="full"
          position="absolute"
          width="full"
        >
          <Stack space="20px">
            <Text
              size="17pt"
              weight="bold"
              align="center"
              color="labelSecondary"
            >
              No data found.
            </Text>
            <ButtonPressAnimation
              onPress={() => {
                // only allow refresh if data is at least 30 seconds old
                if (!dataUpdatedAt || Date.now() - dataUpdatedAt > 30_000) {
                  queryClient.invalidateQueries({
                    queryKey: mintableCollectionsQueryKey({
                      address: accountAddress,
                    }),
                  });
                }
              }}
            >
              <Text
                align="center"
                color="labelSecondary"
                size="34pt"
                weight="bold"
              >
                􀅈
              </Text>
            </ButtonPressAnimation>
          </Stack>
        </Box>
      )}
      <TabBar />
    </>
  );
}
