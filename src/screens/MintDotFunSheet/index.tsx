import React from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  BackgroundProvider,
  Inset,
  Separator,
  Stack,
  Text,
} from '@/design-system';
import { MintDotFunCard } from '@/components/cards/MintDotFunCard';
import { CarouselCard } from '@/components/cards/CarouselCard';
import { Cell, NFT_IMAGE_SIZE, Placeholder } from './Cell';

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
                <CarouselCard
                  title="Collection Name"
                  data={[]}
                  carouselItem={{
                    renderItem: () => <Cell />,
                    keyExtractor: (item: any) => item.id,
                    placeholder: <Placeholder />,
                    width: NFT_IMAGE_SIZE,
                    height: 167,
                    padding: 10,
                  }}
                  button={{
                    text: 'View All Mints',
                    style: 'fill',
                    onPress: () => {},
                  }}
                />
                <CarouselCard
                  title="Collection Name"
                  data={[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]}
                  carouselItem={{
                    renderItem: () => <Placeholder />,
                    keyExtractor: (item: any) => item.id,
                    placeholder: <></>,
                    width: NFT_IMAGE_SIZE,
                    height: 167,
                    padding: 10,
                  }}
                  button={{
                    text: 'View All Mints',
                    style: 'fill',
                    onPress: () => {},
                  }}
                />
                <CarouselCard
                  title="Collection Name"
                  data={[{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]}
                  carouselItem={{
                    renderItem: () => <Placeholder />,
                    keyExtractor: (item: any) => item.id,
                    placeholder: <></>,
                    width: NFT_IMAGE_SIZE,
                    height: 167,
                    padding: 10,
                  }}
                  button={{
                    text: 'View All Mints',
                    style: 'fill',
                    onPress: () => {},
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
