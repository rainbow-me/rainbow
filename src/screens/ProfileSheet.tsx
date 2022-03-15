import { useRoute } from '@react-navigation/core';
import ConditionalWrap from 'conditional-wrap';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import Spinner from '../components/Spinner';
import ActionButtons from '../components/ens-profile/ActionButtons/ActionButtons';
import ProfileAvatar from '../components/ens-profile/ProfileAvatar/ProfileAvatar';
import ProfileCover from '../components/ens-profile/ProfileCover/ProfileCover';
import RecordTags from '../components/ens-profile/RecordTags/RecordTags';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import { sharedCoolModalTopOffset } from '../navigation/config';
import { useTheme } from '@rainbow-me/context';
import {
  AccentColorProvider,
  BackgroundProvider,
  Bleed,
  Box,
  Column,
  Columns,
  Divider,
  Heading,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import {
  useDimensions,
  useENSProfile,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { getFirstTransactionTimestamp } from '@rainbow-me/utils/ethereumUtils';
import {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '@rainbow-me/utils/profileUtils';

export default function ProfileSheet() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const { height: deviceHeight } = useDimensions();
  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  const ensName = params?.address || 'moxey.eth';
  const { isLoading, data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images.avatarUrl;
  const coverUrl = profile?.images.coverUrl;
  const profileAddress = profile?.primary.address;

  const {
    data: firstTransactionTimestamp,
    isLoading: isFirstTxnLoading,
  } = useQuery(
    ['first-transaction-timestamp', ensName],
    async () => {
      const address = await web3Provider.resolveName(ensName);
      return getFirstTransactionTimestamp(address);
    },
    {
      enabled: Boolean(ensName),
    }
  );

  const colorIndex = useMemo(
    () => (profileAddress ? addressHashedColorIndex(profileAddress) : 0),
    [profileAddress]
  );
  const emoji = useMemo(
    () => (profileAddress ? addressHashedEmoji(profileAddress) : ''),
    [profileAddress]
  );

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    avatarUrl || ''
  );

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor =
    dominantColor ||
    colors.avatarBackgrounds[colorIndex || 0] ||
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
              condition={isLoading || isFirstTxnLoading}
              wrap={children => <Box style={wrapperStyle}>{children}</Box>}
            >
              <>
                {isLoading || isFirstTxnLoading ? (
                  <Box
                    alignItems="center"
                    height="full"
                    justifyContent="center"
                  >
                    <Spinner color={colors.appleBlue} size="large" />
                  </Box>
                ) : (
                  <Stack space="19px">
                    <ProfileCover coverUrl={coverUrl} />
                    <Bleed top={{ custom: 38 }}>
                      <Inset horizontal="19px">
                        <Columns>
                          <Column width="content">
                            <ProfileAvatar
                              accountSymbol={emoji as string}
                              avatarUrl={avatarUrl}
                            />
                          </Column>
                          <Inset top="30px">
                            <ActionButtons
                              address={profileAddress}
                              ensName={ensName}
                            />
                          </Inset>
                        </Columns>
                      </Inset>
                    </Bleed>
                    <Inset horizontal="19px">
                      <Stack space="19px">
                        <Heading size="23px">{ensName}</Heading>
                        {profile?.records.description && (
                          <Text containsEmoji weight="medium">
                            {profile?.records.description}
                          </Text>
                        )}
                        {profile?.records && (
                          <RecordTags
                            firstTransactionTimestamp={
                              firstTransactionTimestamp
                            }
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
                        <Divider />
                        <Text>INSERT DA ASSET LIST HERE</Text>
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
