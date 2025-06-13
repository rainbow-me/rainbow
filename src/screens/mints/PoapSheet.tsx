import { analytics } from '@/analytics';
import { ButtonPressAnimation } from '@/components/animations';
import Spinner from '@/components/Spinner';
import { Box, ColorModeProvider, Row, Rows, Stack, Text } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { IS_ANDROID, IS_IOS } from '@/env';
import { arcClient } from '@/graphql';
import { maybeSignUri } from '@/handlers/imgix';
import { useDimensions } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { watchingAlert } from '@/utils';
import { delay } from '@/utils/delay';
import { openInBrowser } from '@/utils/openInBrowser';
import { PoapMintError } from '@/utils/poaps';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { useSharedValue } from 'react-native-reanimated';
import ImgixImage from '../../components/images/ImgixImage';
import { SheetActionButton, SheetActionButtonRow, SlackSheet } from '../../components/sheet';
import { CardSize } from '../../components/unique-token/CardSize';

const BackgroundBlur = styled(BlurView).attrs({
  blurIntensity: 100,
  blurStyle: 'light',
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
  ...(IS_ANDROID ? { borderTopLeftRadius: 30, borderTopRightRadius: 30 } : {}),
});

type PoapClaimStatus = 'none' | 'claiming' | 'claimed' | 'error';

const PoapSheet = () => {
  const accountAddress = useAccountAddress();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const { colors, isDarkMode, lightScheme } = useTheme();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.POAP_SHEET>>();
  const {
    data: { nfts },
  } = useLegacyNFTs({
    address: accountAddress,
  });

  const [claimStatus, setClaimStatus] = useState<PoapClaimStatus>('none');
  const [errorCode, setErrorCode] = useState<PoapMintError | undefined>(undefined);
  const [nft, setNft] = useState<UniqueAsset | null>(null);

  const poapEvent = params.event;

  const poapMintType = poapEvent.secretWord ? 'secretWord' : 'qrHash';

  const imageUrl = maybeSignUri(poapEvent.imageUrl);

  const poapGalleryUrl = `https://poap.gallery/event/${poapEvent.id}`;

  const getFormattedDate = () => {
    return format(new Date(poapEvent.createdAt), 'MMMM dd, yyyy');
  };

  const imageColor = usePersistentDominantColorFromImage(imageUrl) ?? colors.paleBlue;

  const sheetRef = useRef(undefined);
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
      analytics.track(analytics.event.poapsMintedPoap, {
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
      analytics.track(analytics.event.poapsMintedPoap, {
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
  }, [claimPoapByQrHash, claimPoapBySecret, claimStatus, navigate, nft, poapMintType]);

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
    analytics.track(analytics.event.poapsOpenedMintSheet, {
      eventId: poapEvent.id,
      type: poapMintType,
    });
  });

  return (
    <>
      {IS_IOS && (
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
        backgroundColor={isDarkMode ? `rgba(22, 22, 22, ${IS_IOS ? 0.4 : 1})` : `rgba(26, 26, 26, ${IS_IOS ? 0.4 : 1})`}
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
                    analytics.track(analytics.event.poapsViewedOnPoap, {
                      eventId: poapEvent.id,
                    });
                    openInBrowser(poapGalleryUrl);
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
