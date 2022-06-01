import React, { useCallback, useMemo } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { MarqueeList } from '../../list';
import { Box, Stack, Text } from '@rainbow-me/design-system';
import { ensProfileQueryKey, useENSProfile } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { ensIntroMarqueeNames } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';

export const ensAvatarUrl = (ensName: string) =>
  `https://metadata.ens.domains/mainnet/avatar/${ensName}?v=1.0`;

const lineHeight = 30;
const estimateDescriptionProfilePreviewHeight = (description?: string) => {
  return description ? Math.ceil(description.length / 50) * lineHeight : 0;
};

export default function IntroMarquee() {
  const { navigate } = useNavigation();

  const handlePressENS = useCallback(
    (ensName: string) => {
      const profile = queryClient.getQueryData<
        ReturnType<typeof useENSProfile>['data']
      >(ensProfileQueryKey(ensName));
      const description = profile?.records?.description || '';
      navigate(Routes.PROFILE_PREVIEW_SHEET, {
        address: ensName,
        descriptionProfilePreviewHeight: estimateDescriptionProfilePreviewHeight(
          description
        ),
        fromDiscover: true,
      });
    },
    [navigate]
  );

  const renderItem = useCallback(
    ({ item, onPressStart, onPressCancel, testID }) => (
      <ENSAvatarPlaceholder
        name={item.name}
        onPress={item.onPress}
        onPressCancel={onPressCancel}
        onPressStart={onPressStart}
        testID={testID}
      />
    ),
    []
  );

  const items = useMemo(
    () =>
      ensIntroMarqueeNames.map((name, index) => ({
        name,
        onPress: () => handlePressENS(name),
        testID: `ens-names-marquee-item-${index}`,
      })),
    [handlePressENS]
  );

  return (
    <Box height={{ custom: 100 }}>
      <MarqueeList
        items={items}
        renderItem={renderItem}
        speed={-15}
        testID="ens-names-marquee"
      />
    </Box>
  );
}

function ENSAvatarPlaceholder({
  name,
  onPress,
  onPressCancel,
  onPressStart,
  testID,
}: {
  name: string;
  onPress: () => void;
  onPressCancel: () => void;
  onPressStart: () => void;
  testID?: string;
}) {
  return (
    <ButtonPressAnimation
      onCancel={({ nativeEvent: { state, close } }: any) => {
        // Ensure the press has been triggered
        if (state === 5 && close) {
          ReactNativeHapticFeedback.trigger('selection');
          onPress();
        }
      }}
      onPress={onPress}
      onPressCancel={onPressCancel}
      onPressStart={onPressStart}
      reanimatedButton={false}
      scaleTo={0.8}
      testID={testID}
    >
      <Box paddingHorizontal="12px">
        <Stack alignHorizontal="center" space={{ custom: 13 }}>
          <Box
            as={ImgixImage}
            background="body"
            borderRadius={80}
            height={{ custom: 80 }}
            shadow="15px light"
            source={{ uri: ensAvatarUrl(name) }}
            width={{ custom: 80 }}
          />
          <Text
            align="center"
            color="secondary50"
            size="12px"
            weight="semibold"
          >
            {name}
          </Text>
        </Stack>
      </Box>
    </ButtonPressAnimation>
  );
}
