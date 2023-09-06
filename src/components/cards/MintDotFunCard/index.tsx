import React, { useEffect, useState } from 'react';
import { CarouselCard } from '../CarouselCard';
import { CollectionCell, NFT_IMAGE_SIZE, Placeholder } from './CollectionCell';
import { Menu } from './Menu';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  mintableCollectionsQueryKey,
  useMintableCollections,
} from '@/resources/mintdotfun';
import { useAccountSettings, useDimensions } from '@/hooks';
import { MintableCollection } from '@/graphql/__generated__/arc';
import { queryClient } from '@/react-query';
import {
  ButtonPressAnimation,
  ShimmerAnimation,
} from '@/components/animations';
import { Box, Inset, Text, useForegroundColor } from '@/design-system';

export function MintDotFunCard() {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { data, isFetching } = useMintableCollections({
    walletAddress: accountAddress,
  });
  const { width: deviceWidth } = useDimensions();
  const fillSecondary = useForegroundColor('fillSecondary');

  const [canRefresh, setCanRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!canRefresh) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setCanRefresh(true);
      }, 30_000);
    }
  }, [canRefresh]);

  // remove featured mint
  const mints = data?.getMintableCollections.collections?.slice(1);

  return (
    <Inset top={{ custom: 22 }} bottom="10px">
      <CarouselCard
        isLoading={isFetching}
        title="Mints"
        data={mints}
        carouselItem={{
          renderItem: ({ item }) => <CollectionCell collection={item} />,
          keyExtractor: (item: MintableCollection) =>
            item.contractAddress + item.chainId,
          placeholder: <Placeholder />,
          width: NFT_IMAGE_SIZE,
          height: 147,
          padding: 10,
          verticalOverflow: 10,
        }}
        button={
          <Box
            as={ButtonPressAnimation}
            background="fillSecondary"
            height="36px"
            width="full"
            borderRadius={99}
            justifyContent="center"
            alignItems="center"
            style={{
              overflow: 'hidden',
            }}
            onPress={() => navigate(Routes.MINT_DOT_FUN_SHEET)}
          >
            {/* unfortunately shimmer width must be hardcoded */}
            <ShimmerAnimation
              color={fillSecondary}
              width={
                deviceWidth -
                // 40 = 20px padding on each side
                40 -
                // 46 = 36px refresh button width + 10px spacing
                46
              }
            />
            <Text color="label" align="center" size="15pt" weight="bold">
              View All Mints
            </Text>
          </Box>
        }
        menu={<Menu />}
        refresh={() => {
          setCanRefresh(false);
          queryClient.invalidateQueries(
            mintableCollectionsQueryKey({
              address: accountAddress,
            })
          );
        }}
        canRefresh={canRefresh}
        isRefreshing={isRefreshing}
      />
    </Inset>
  );
}
