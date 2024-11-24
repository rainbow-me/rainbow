import React from 'react';
import { Source } from 'react-native-fast-image';
import GoogleSearchIcon from '@/assets/googleSearchIcon.png';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import { Box, Inline, Stack, Text } from '@/design-system';
import { formatUrl } from '../utils';

export const SearchResult = ({
  iconUrl,
  name,
  onPress,
  suggested,
  url,
}: {
  iconUrl: string;
  name: string;
  onPress: (url: string) => void;
  suggested?: boolean;
  url: string;
}) => {
  return (
    <Box
      as={ButtonPressAnimation}
      padding="8px"
      borderRadius={18}
      background={suggested ? 'fill' : undefined}
      scaleTo={0.95}
      onPress={() => onPress(url)}
    >
      <Inline space="12px" alignVertical="center">
        <Box
          as={ImgixImage}
          source={{ uri: iconUrl }}
          size={40}
          background="surfacePrimary"
          shadow="24px"
          enableFasterImage
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          style={{ borderRadius: 10 }}
        />
        <Stack space="10px">
          <Text size="17pt" weight="bold" color="label">
            {name}
          </Text>
          <Text size="13pt" weight="bold" color="labelTertiary">
            {formatUrl(url)}
          </Text>
        </Stack>
      </Inline>
    </Box>
  );
};

export const GoogleSearchResult = ({ query, onPress }: { query: string; onPress: (query: string) => void }) => {
  return (
    <Box
      as={ButtonPressAnimation}
      padding="8px"
      borderRadius={18}
      scaleTo={0.95}
      onPress={() => onPress(`https://www.google.com/search?q=${query}`)}
    >
      <Inline space="12px" alignVertical="center">
        <Box
          alignItems="center"
          justifyContent="center"
          background="surfacePrimaryElevated"
          shadow="24px"
          width={{ custom: 40 }}
          height={{ custom: 40 }}
          borderRadius={10}
        >
          <ImgixImage source={GoogleSearchIcon as Source} style={{ width: 30, height: 30 }} size={30} />
        </Box>
        <Stack space="10px">
          <Text size="17pt" weight="bold" color="label">
            {`Search "${query}"`}
          </Text>
          <Text size="13pt" weight="bold" color="labelTertiary">
            Google
          </Text>
        </Stack>
      </Inline>
    </Box>
  );
};
