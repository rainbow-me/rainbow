import { useRoute } from '@react-navigation/core';
import ConditionalWrap from 'conditional-wrap';
import React, { useMemo } from 'react';
import Spinner from '../components/Spinner';
import Avatar from '../components/ens-profile/Avatar/Avatar';
import CoverPhoto from '../components/ens-profile/Cover/Cover';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { sharedCoolModalTopOffset } from '../navigation/config';
import { useTheme } from '@rainbow-me/context';
import {
  AccentColorProvider,
  BackgroundProvider,
  Bleed,
  Box,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import {
  useDimensions,
  useENSProfile,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';

export default function ProfileSheet() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const { height: deviceHeight } = useDimensions();
  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  const profile = useENSProfile(params?.address);
  const avatarUrl = profile.data?.images.avatarUrl;
  const coverUrl = profile.data?.images.coverUrl;

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    avatarUrl || ''
  );

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor = dominantColor || colors.appleBlue;

  return (
    <AccentColorProvider color={accentColor}>
      <BackgroundProvider color="body">
        {({ backgroundColor }) => (
          // @ts-expect-error JavaScript component
          <SlackSheet
            backgroundColor={backgroundColor}
            contentHeight={contentHeight}
            height="100%"
            removeTopPadding
            scrollEnabled
          >
            <ConditionalWrap
              condition={profile.isLoading}
              wrap={children => <Box style={wrapperStyle}>{children}</Box>}
            >
              <>
                {profile.isLoading ? (
                  <Box
                    alignItems="center"
                    height="full"
                    justifyContent="center"
                  >
                    <Spinner color={colors.appleBlue} size="large" />
                  </Box>
                ) : (
                  <Stack space="19px">
                    <CoverPhoto coverUrl={coverUrl} />
                    <Bleed top={{ custom: 38 }}>
                      <Inset left="19px">
                        <Avatar avatarUrl={avatarUrl} />
                      </Inset>
                    </Bleed>
                    <Text color="accent">test</Text>
                  </Stack>
                )}
              </>
            </ConditionalWrap>
          </SlackSheet>
        )}
      </BackgroundProvider>
    </AccentColorProvider>
  );
}
