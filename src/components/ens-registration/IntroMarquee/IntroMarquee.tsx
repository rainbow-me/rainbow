import React, { useCallback, useEffect, useMemo, useState } from 'react';
// @ts-expect-error
import { IS_TESTING } from 'react-native-dotenv';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { MarqueeList } from '../../list';
import { Box, Stack, Text } from '@rainbow-me/design-system';
import { fetchRecords } from '@rainbow-me/handlers/ens';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
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
  const [introMarqueeProfiles, setIntroMarqueeProfiles] = useState<{
    [name: string]: string | undefined;
  }>({});

  const handlePressENS = useCallback(
    (ensName: string) => {
      navigate(Routes.PROFILE_PREVIEW_SHEET, {
        address: ensName,
        descriptionProfilePreviewHeight: estimateDescriptionProfilePreviewHeight(
          introMarqueeProfiles[ensName]
        ),
      });
    },
    [introMarqueeProfiles, navigate]
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

  useEffect(() => {
    const getProfiles = async () => {
      const profiles: { [name: string]: string | undefined } = {};
      await Promise.all(
        ensIntroMarqueeNames.map(async name => {
          const records = await fetchRecords(name);
          profiles[name] = records?.description;
        })
      );
      setIntroMarqueeProfiles(profiles as any);
    };
    if (IS_TESTING !== 'true') getProfiles();
  }, []);

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
        speed={10}
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
      scaleTo={0.95}
      testID={testID}
    >
      <Box paddingHorizontal="8px" testID={testID}>
        <Stack alignHorizontal="center" space="15px">
          <Box
            as={ImgixImage}
            background="action"
            borderRadius={80}
            height={{ custom: 80 }}
            shadow="21px light"
            source={{ uri: ensAvatarUrl(name) }}
            width={{ custom: 80 }}
          />
          <Text align="center" color="secondary70" size="14px" weight="medium">
            {name}
          </Text>
        </Stack>
      </Box>
    </ButtonPressAnimation>
  );
}
