import { useRoute } from '@react-navigation/core';
import ConditionalWrap from 'conditional-wrap';
import React, { useMemo } from 'react';
import Spinner from '../components/Spinner';
import Avatar from '../components/ens-profile/Avatar/Avatar';
import CoverPhoto from '../components/ens-profile/Cover/Cover';
import GradientOutlineButton from '../components/ens-profile/GradientOutlineButton/GradientOutlineButton';
import MoreButton from '../components/ens-profile/MoreButton/MoreButton';
import RecordTags from '../components/ens-profile/RecordTags/RecordTags';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { sharedCoolModalTopOffset } from '../navigation/config';
import { useTheme } from '@rainbow-me/context';
import {
  AccentColorProvider,
  BackgroundProvider,
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Heading,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import {
  useAccountProfile,
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

  const ensName = params?.address;
  const { isLoading, data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images.avatarUrl;
  const coverUrl = profile?.images.coverUrl;

  const { accountColor, accountSymbol } = useAccountProfile();

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    avatarUrl || ''
  );

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor =
    dominantColor ||
    colors.avatarBackgrounds[accountColor || 0] ||
    colors.appleBlue;

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
              condition={isLoading}
              wrap={children => <Box style={wrapperStyle}>{children}</Box>}
            >
              <>
                {isLoading ? (
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
                      <Inset horizontal="19px">
                        <Columns>
                          <Column width="content">
                            <Avatar
                              accountSymbol={accountSymbol as string}
                              avatarUrl={avatarUrl}
                            />
                          </Column>
                          <Inset top="30px">
                            <Inline alignHorizontal="right" space="10px">
                              <MoreButton />
                              <ColorModeProvider value="darkTinted">
                                <GradientOutlineButton
                                  gradient={colors.gradients.blueToGreen}
                                >
                                  􀨭 Watch
                                </GradientOutlineButton>
                              </ColorModeProvider>
                              <ColorModeProvider value="darkTinted">
                                <GradientOutlineButton
                                  gradient={colors.gradients.blueToGreen}
                                  variant="circular"
                                >
                                  􀈠
                                </GradientOutlineButton>
                              </ColorModeProvider>
                            </Inline>
                          </Inset>
                        </Columns>
                      </Inset>
                    </Bleed>
                    <Inset horizontal="19px">
                      <Stack space="19px">
                        <Heading size="23px">{ensName}</Heading>
                        {profile?.records.description && (
                          <Text weight="medium">
                            {profile?.records.description}
                          </Text>
                        )}
                        {profile?.records && (
                          <RecordTags
                            records={profile?.records}
                            show={[
                              ENS_RECORDS.twitter,
                              ENS_RECORDS.website,
                              ENS_RECORDS.url,
                              ENS_RECORDS.email,
                              ENS_RECORDS.github,
                              ENS_RECORDS.instagram,
                              ENS_RECORDS.reddit,
                              ENS_RECORDS.snapchat,
                              ENS_RECORDS.telegram,
                            ]}
                          />
                        )}
                      </Stack>
                    </Inset>
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
