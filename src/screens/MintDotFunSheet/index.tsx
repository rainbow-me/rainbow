import React from 'react';
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
import { Cell, NFT_IMAGE_SIZE, Placeholder } from './Cell';

type Collection = {
  recentMints: any[];
  name: string;
  timeElapsed: number;
  mintsLastHour: number;
};

const Card = ({ collection }: { collection: Collection }) => (
  <CarouselCard
    title={
      <Inline space="3px" alignVertical="center">
        <Text size="11pt" weight="semibold" color="labelQuaternary">
          􀐫
        </Text>
        <Text size="13pt" weight="semibold" color="labelTertiary">
          {`${collection.timeElapsed}h ago`}
        </Text>
        <Text size="13pt" weight="semibold" color="labelTertiary">
          {` · ${collection.mintsLastHour} mints past hour`}
        </Text>
      </Inline>
    }
    data={collection.recentMints}
    carouselItem={{
      renderItem: () => <Cell />,
      keyExtractor: (item: any) => item.id,
      placeholder: <Placeholder />,
      width: NFT_IMAGE_SIZE,
      height: 167,
      padding: 10,
    }}
    button={{
      text: 'Mint',
      style: 'fill',
      onPress: () => {},
    }}
  />
);

export function MintDotFunSheet() {
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
                <Card
                  collection={{
                    name: 'Collection 1',
                    recentMints: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                    timeElapsed: 2,
                    mintsLastHour: 100,
                  }}
                />
                <Card
                  collection={{
                    name: 'Collection 4',
                    recentMints: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                    timeElapsed: 4,
                    mintsLastHour: 200,
                  }}
                />
                <Card
                  collection={{
                    name: 'Collection 3',
                    recentMints: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
                    timeElapsed: 3,
                    mintsLastHour: 300,
                  }}
                />
              </Stack>
            </Stack>
          </Inset>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
