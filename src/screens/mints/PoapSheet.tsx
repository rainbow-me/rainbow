import { BlurView } from '@react-native-community/blur';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import useWallets from '../../hooks/useWallets';
import Routes from '@/navigation/routesNames';

import ImgixImage from '../../components/images/ImgixImage';
import { SheetActionButton, SheetActionButtonRow, SlackSheet } from '../../components/sheet';
import { CardSize } from '../../components/unique-token/CardSize';
import { Box, ColorModeProvider, Row, Rows, Stack, Text } from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { watchingAlert } from '@/utils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { maybeSignUri } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { PoapEvent } from '@/graphql/__generated__/arcDev';
import { format } from 'date-fns';
import { arcClient } from '@/graphql';
import Spinner from '@/components/Spinner';
import { delay } from '@/utils/delay';
import { useLegacyNFTs } from '@/resources/nfts';
import { UniqueAsset } from '@/entities';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { PoapMintError } from '@/utils/poaps';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';

const BackgroundBlur = styled(BlurView).attrs({
  blurAmount: 100,
  blurType: 'light',
})({
  ...position.coverAsObject,
});

const BackgroundImage = styled(View)({
  ...position.coverAsObject,
});

interface BlurWrapperProps {
  height: number;
  width: number;
}

const BlurWrapper = styled(View).attrs({
  shouldRasterizeIOS: true,
})({
  // @ts-expect-error missing theme types
  backgroundColor: ({ theme: { colors } }) => colors.trueBlack,
  height: ({ height }: BlurWrapperProps) => height,
  left: 0,
  overflow: 'hidden',
  position: 'absolute',
  width: ({ width }: BlurWrapperProps) => width,
  ...(android ? { borderTopLeftRadius: 30, borderTopRightRadius: 30 } : {}),
});

interface PoapSheetProps {
  event: PoapEvent;
}

type PoapClaimStatus = 'none' | 'claiming' | 'claimed' | 'error';

const PoapSheet = () => {
  const { accountAddress } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate, goBack } = useNavigation();
  const { colors, isDarkMode, lightScheme } = useTheme();
  const { isReadOnlyWallet } = useWallets();
  const params = useRoute();
  const {
    data: { nfts },
  } = useLegacyNFTs({
    address: accountAddress,
  });

  const [claimStatus, setClaimStatus] = useState<PoapClaimStatus>('none');
  const [errorCode, setErrorCode] = useState<PoapMintError | undefined>(undefined);
  const [nft, setNft] = useState<UniqueAsset | null>(null);

  const poapEvent: PoapEvent = (params.params as PoapSheetProps)?.event;

  const poapMintType = poapEvent.secretWord ? 'secretWord' : 'qrHash';

  const imageUrl = maybeSignUri(poapEvent.imageUrl);

  const poapGalleryUrl = `https://poap.gallery/event/${poapEvent.id}`;

  const getFormattedDate = () => {
    return format(new Date(poapEvent.createdAt), 'MMMM dd, yyyy');
  };

  const imageColor = usePersistentDominantColorFromImage(imageUrl) ?? colors.paleBlue;

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  const claimPoapByQrHash = useCallback(async () => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }
    setClaimStatus('claiming');
    if (!poapEvent.secret || !poapEvent.qrHash) return;
    const response = await arcClient.claimPoapByQrHash({
      walletAddress: accountAddress,
      qrHash: poapEvent.qrHash,
      secret: poapEvent.secret,
    });
    await delay(1000);

    const isSuccess = response.claimPoapByQrHash?.success;
    const errorCode = response.claimPoapByQrHash?.error;

    if (isSuccess) {
      analyticsV2.track(event.poapsMintedPoap, {
        eventId: poapEvent.id,
        type: poapMintType,
      });
      setClaimStatus('claimed');
    } else {
      setClaimStatus('error');
      if (errorCode === 'LIMIT_EXCEEDED' || errorCode === 'EVENT_EXPIRED') {
        setErrorCode(errorCode);
      } else {
        setErrorCode('UNKNOWN');
      }
    }
  }, [accountAddress, isReadOnlyWallet, poapEvent.id, poapEvent.qrHash, poapEvent.secret, poapMintType, setClaimStatus]);

  const claimPoapBySecret = useCallback(async () => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }
    if (!poapEvent.secretWord) return;
    setClaimStatus('claiming');

    const response = await arcClient.claimPoapBySecretWord({
      walletAddress: accountAddress,
      secretWord: poapEvent.secretWord,
    });
    await delay(1000);
    const isSuccess = response.claimPoapBySecretWord?.success;
    const errorCode = response.claimPoapBySecretWord?.error;

    if (isSuccess) {
      analyticsV2.track(event.poapsMintedPoap, {
        eventId: poapEvent.id,
        type: poapMintType,
      });
      setClaimStatus('claimed');
    } else {
      setClaimStatus('error');
      if (errorCode === 'LIMIT_EXCEEDED' || errorCode === 'EVENT_EXPIRED') {
        setErrorCode(errorCode);
      } else {
        setErrorCode('UNKNOWN');
      }
    }
  }, [accountAddress, isReadOnlyWallet, poapEvent.id, poapEvent.secretWord, poapMintType]);

  const actionOnPress = useCallback(async () => {
    if (claimStatus === 'claimed') {
      if (nft) {
        navigate(Routes.EXPANDED_ASSET_SHEET, {
          asset: nft,
          backgroundOpacity: 1,
          cornerRadius: 'device',
          external: false,
          springDamping: 1,
          topOffset: 0,
          transitionDuration: 0.25,
          type: 'unique_token',
        });
      }
    } else {
      if (poapMintType === 'secretWord') {
        await claimPoapBySecret();
      } else {
        await claimPoapByQrHash();
      }
    }
  }, [claimPoapByQrHash, claimPoapBySecret, claimStatus, goBack, navigate, nft, poapMintType]);

  useEffect(() => {
    const nft = nfts.find(item => item.image_original_url === poapEvent.imageUrl);
    if (nft) {
      setClaimStatus('claimed');
      setNft(nft);
    }
  }, [imageUrl, nfts, poapEvent.imageUrl]);

  const getErrorMessage = () => {
    if (errorCode === 'LIMIT_EXCEEDED') {
      return i18n.t(i18n.l.poaps.error_messages.limit_exceeded);
    } else if (errorCode === 'EVENT_EXPIRED') {
      return i18n.t(i18n.l.poaps.error_messages.event_expired);
    }
    return i18n.t(i18n.l.poaps.error_messages.event_expired);
  };

  useFocusEffect(() => {
    analyticsV2.track(event.poapsOpenedMintSheet, {
      eventId: poapEvent.id,
      type: poapMintType,
    });
  });

  return (
    <>
      {ios && (
        <BlurWrapper height={deviceHeight} width={deviceWidth}>
          <BackgroundImage>
            <ImgixImage
              source={{ uri: imageUrl }}
              resizeMode="cover"
              size={CardSize}
              style={{ height: deviceHeight - 200, width: deviceWidth }}
            />
            <BackgroundBlur />
          </BackgroundImage>
        </BlurWrapper>
      )}
      <SlackSheet
        backgroundColor={isDarkMode ? `rgba(22, 22, 22, ${ios ? 0.4 : 1})` : `rgba(26, 26, 26, ${ios ? 0.4 : 1})`}
        height={'100%'}
        ref={sheetRef}
        scrollEnabled
        testID="poap-mint-sheet"
        yPosition={yPosition}
      >
        <ColorModeProvider value="darkTinted">
          <Box
            width="full"
            height={{
              custom: deviceHeight - (IS_IOS ? 100 : 50) - (errorCode ? 24 : 0),
            }}
            justifyContent="center"
            alignItems="center"
          >
            <Rows space="20px" alignHorizontal="center">
              <Row height={'content'}>
                <Box paddingTop={'104px'}>
                  <Stack space={'28px'} alignHorizontal="center">
                    <Text size="26pt" color="label" weight="bold">
                      {i18n.t(i18n.l.poaps.title)}
                    </Text>
                    <ImgixImage
                      source={{ uri: imageUrl }}
                      resizeMode="cover"
                      size={CardSize}
                      style={{ height: 250, width: 250, borderRadius: 999 }}
                    />
                  </Stack>
                </Box>
              </Row>

              <Stack space="10px" alignHorizontal="center">
                <Text size="20pt" color="label" weight="heavy">
                  {poapEvent.name}
                </Text>
                <Text size="15pt" color="labelSecondary" weight="bold">
                  {getFormattedDate()}
                </Text>
              </Stack>
              <Stack alignHorizontal="center">
                {errorCode && (
                  <Text size="17pt" weight="medium" color="labelSecondary">
                    {getErrorMessage()}
                  </Text>
                )}
                <SheetActionButtonRow>
                  <SheetActionButton color={claimStatus === 'error' ? colors.red : imageColor} onPress={actionOnPress}>
                    {claimStatus === 'claiming' && <Spinner color={lightScheme.white} size={'small'} style={{ paddingRight: 6 }} />}
                    <Text size="17pt" color="label" weight="bold">
                      {/* eslint-disable-next-line no-nested-ternary*/}
                      {claimStatus === 'claimed'
                        ? i18n.t(i18n.l.poaps.minted)
                        : claimStatus === 'claiming'
                          ? i18n.t(i18n.l.poaps.minting)
                          : claimStatus === 'none'
                            ? i18n.t(i18n.l.poaps.mint_poap)
                            : i18n.t(i18n.l.poaps.error)}
                    </Text>
                  </SheetActionButton>
                </SheetActionButtonRow>
                <ButtonPressAnimation
                  onPress={() => {
                    analyticsV2.track(event.poapsViewedOnPoap, {
                      eventId: poapEvent.id,
                    });
                    Linking.openURL(poapGalleryUrl);
                  }}
                >
                  <Text size="15pt" color="labelSecondary" weight="bold">
                    {i18n.t(i18n.l.poaps.view_on_poap)}
                  </Text>
                </ButtonPressAnimation>
              </Stack>
            </Rows>
          </Box>
        </ColorModeProvider>
      </SlackSheet>
    </>
  );
};

export default PoapSheet;
