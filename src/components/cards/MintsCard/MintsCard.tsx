import React from 'react';
import { CarouselCard } from '../CarouselCard';
import { CollectionCell, NFT_IMAGE_SIZE, Placeholder } from './CollectionCell';
import { Menu } from './Menu';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { mintsQueryKey, useMints, useMintsFilter } from '@/resources/mints';
import { MintableCollection } from '@/graphql/__generated__/arc';
import { queryClient } from '@/react-query';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { Box, Text, useForegroundColor } from '@/design-system';
import { analytics } from '@/analytics';
import * as i18n from '@/languages';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export function MintsCard() {
  const { navigate } = useNavigation();
  const accountAddress = useAccountAddress();
  const {
    data: { mints, featuredMint },
    dataUpdatedAt,
    isFetching,
    isRefetching,
    refetch,
  } = useMints({
    walletAddress: accountAddress,
  });
  const { filter } = useMintsFilter();

  const fillSecondary = useForegroundColor('fillSecondary');
  return (
    <CarouselCard
      title={i18n.t(i18n.l.mints.mints_card.mints)}
      data={mints?.filter(c => c.contractAddress !== featuredMint?.contractAddress)}
      loading={isFetching}
      emptyMessage={filter === 'all' ? 'No mints' : `No ${filter} mints`}
      carouselItem={{
        renderItem: ({ item }) => <CollectionCell collection={item} />,
        keyExtractor: (item: MintableCollection) => item.contractAddress + item.chainId,
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
          onPress={() => {
            analytics.track(analytics.event.mintsPressedViewAllMintsButton);
            navigate(Routes.MINTS_SHEET);
          }}
        >
          <ShimmerAnimation color={fillSecondary} />
          <Text color="label" align="center" size="15pt" weight="bold">
            {i18n.t(i18n.l.mints.mints_card.view_all_mints)}
          </Text>
        </Box>
      }
      menu={<Menu />}
      dataUpdatedAt={dataUpdatedAt}
      refresh={() => {
        queryClient.invalidateQueries(
          mintsQueryKey({
            address: accountAddress,
          })
        );
        refetch();
      }}
      isRefreshing={isRefetching}
    />
  );
}
