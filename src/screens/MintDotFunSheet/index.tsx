import React, { useEffect, useState } from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  BackgroundProvider,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
} from '@/design-system';
import { CarouselCard } from '@/components/cards/CarouselCard';
import { RecentMintCell, NFT_IMAGE_SIZE, Placeholder } from './RecentMintCell';
import { useAccountSettings } from '@/hooks';
import { useMintableCollections } from '@/resources/mintdotfun';
import { MintableCollection, NftSample } from '@/graphql/__generated__/arc';
import { getTimeElapsedFromDate } from './utils';
import { Linking } from 'react-native';

function Card({ collection }: { collection: MintableCollection }) {
  const [timeElapsed, setTimeElapsed] = useState(
    getTimeElapsedFromDate(new Date(collection.firstEvent))
  );

  // update elapsed time every minute if it's less than an hour
  useEffect(() => {
    if (timeElapsed[timeElapsed.length - 1] === 'm') {
      const interval = setInterval(() => {
        setTimeElapsed(getTimeElapsedFromDate(new Date(collection.firstEvent)));
      }, 60_000);
      return () => clearInterval(interval);
    }
  });

  return (
    <CarouselCard
      title={
        <Stack space="12px">
          <Text size="20pt" weight="bold" color="label">
            {collection.name}
          </Text>
          <Inline space="3px" alignVertical="center">
            <Text size="11pt" weight="semibold" color="labelQuaternary">
              􀐫
            </Text>
            <Inline alignVertical="center">
              <Text size="13pt" weight="semibold" color="labelTertiary">
                {`${timeElapsed} ago`}
              </Text>
              <Text size="13pt" weight="semibold" color="labelTertiary">
                {` · ${collection.mintsLastHour} mint${
                  collection.mintsLastHour !== 1 ? 's' : ''
                } past hour`}
              </Text>
            </Inline>
          </Inline>
        </Stack>
      }
      data={collection.recentMints}
      carouselItem={{
        renderItem: ({ item }) => (
          <RecentMintCell recentMint={item} collection={collection} />
        ),
        keyExtractor: (item: NftSample) => item.tokenID,
        placeholder: <Placeholder />,
        width: NFT_IMAGE_SIZE,
        height: NFT_IMAGE_SIZE + 20,
        padding: 10,
      }}
      button={{
        text: 'Mint',
        style: 'fill',
        onPress: () => Linking.openURL(collection.externalURL),
      }}
    />
  );
}

export function MintDotFunSheet() {
  const { accountAddress } = useAccountSettings();
  const { data } = useMintableCollections({
    walletAddress: accountAddress,
    chainId: 8453,
  });

  return (
    <BackgroundProvider color="surfaceSecondaryElevated">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}>
          <Inset top={{ custom: 31 }} bottom="52px" horizontal="20px">
            <Stack space="24px">
              <Text color="label" size="20pt" align="center" weight="heavy">
                All Mints
              </Text>
              <Separator color="separatorTertiary" />
              <Stack
                space="24px"
                separator={<Separator color="separatorTertiary" />}
              >
                {data?.getMintableCollections.collections?.map(collection => (
                  <Card
                    key={collection.contractAddress + collection.chainId}
                    collection={collection}
                  />
                ))}
              </Stack>
            </Stack>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
