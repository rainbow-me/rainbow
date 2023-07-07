import { BlurView } from '@react-native-community/blur';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import useWallets from '../../hooks/useWallets';
import Routes from '@/navigation/routesNames';

import ImgixImage from '../../components/images/ImgixImage';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../../components/sheet';
import { CardSize } from '../../components/unique-token/CardSize';
import {
  Box,
  ColorModeProvider,
  Row,
  Rows,
  Stack,
  Text,
} from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { magicMemo, watchingAlert } from '@/utils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { maybeSignUri } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { useRoute } from '@react-navigation/native';
import { PoapEvent } from '@/graphql/__generated__/arcDev';
import { format } from 'date-fns';
import { arcDevClient } from '@/graphql';
import Spinner from '@/components/Spinner';
import { delay } from '@/utils/delay';
import { useLegacyNFTs } from '@/resources/nfts';
import { UniqueAsset } from '@/entities';
import { IS_IOS } from '@/env';

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
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();
  const params = useRoute();
  const { data: uniqueTokens } = useLegacyNFTs({
    address: accountAddress,
  });

  const [claimStatus, setClaimStatus] = useState<PoapClaimStatus>('none');
  const [nft, setNft] = useState<UniqueAsset | null>(null);

  const poapEvent: PoapEvent = (params.params as PoapSheetProps)?.event;

  const imageUrl = maybeSignUri(poapEvent.imageUrl);

  const poapGalleryUrl = `https://poap.gallery/event/${poapEvent.id}`;

  const getFormattedDate = () => {
    return format(new Date(poapEvent.createdAt), 'MMMM dd, yyyy');
  };

  const imageColor =
    usePersistentDominantColorFromImage(imageUrl) ?? colors.paleBlue;

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  const claimPoapBySecret = useCallback(async () => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }
    setClaimStatus('claiming');
    const response = await arcDevClient.claimPoapBySecretWord({
      walletAddress: accountAddress,
      secretWord: 'note-remove-couple',
    });
    await delay(1000);
    const isSuccess = response.claimPoapBySecretWord?.success;
    console.log({ isSuccess });
    if (isSuccess) {
      setClaimStatus('claimed');
      await delay(3000);
      goBack();
    } else {
      setClaimStatus('error');
    }
  }, [accountAddress, goBack, isReadOnlyWallet]);

  const isClaiming = claimStatus === 'claiming';
  const isClaimed = claimStatus === 'claimed';
  const isError = claimStatus === 'error';

  const actionOnPress = useCallback(async () => {
    if (isClaimed) {
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
    } else {
      await claimPoapBySecret();
    }
  }, [claimPoapBySecret, isClaimed, navigate, nft]);

  useEffect(() => {
    const nft = uniqueTokens.find(
      item => item.image_original_url === poapEvent.imageUrl
    );
    if (nft) {
      setClaimStatus('claimed');
      setNft(nft);
    }
  }, [imageUrl, poapEvent.imageUrl, uniqueTokens]);

  /* 
    POAPS:
    error states: already minted - mint window is closed


    open qs:
    should there be an account switcher? this would require us to rehit endpoints tho 🤔
  */
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
      {/* @ts-expect-error JavaScript component */}
      <SlackSheet
        backgroundColor={
          isDarkMode
            ? `rgba(22, 22, 22, ${ios ? 0.4 : 1})`
            : `rgba(26, 26, 26, ${ios ? 0.4 : 1})`
        }
        height={'100%'}
        ref={sheetRef}
        scrollEnabled
        testID="unique-token-expanded-state"
        yPosition={yPosition}
      >
        <ColorModeProvider value="darkTinted">
          <Box
            width="full"
            height={{ custom: deviceHeight - (IS_IOS ? 100 : 50) }}
            justifyContent="center"
            alignItems="center"
          >
            <Rows space="20px" alignHorizontal="center">
              <Row height={'content'}>
                <Box paddingTop={'104px'}>
                  <Stack space={'28px'} alignHorizontal="center">
                    <Text size="26pt" color="label" weight="bold">
                      You found a POAP!
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
                <SheetActionButtonRow>
                  <SheetActionButton
                    color={isError ? colors.red : imageColor}
                    onPress={actionOnPress}
                  >
                    {isClaiming && (
                      <Spinner
                        color={colors.white}
                        size={'small'}
                        style={{ paddingRight: 6 }}
                      />
                    )}
                    <Text size="17pt" color="label" weight="bold">
                      {isError
                        ? 'Error Claiming'
                        : isClaimed
                        ? 'Poap Claimed!'
                        : isClaiming
                        ? 'Claiming...'
                        : '􀑒 Claim POAP'}
                    </Text>
                  </SheetActionButton>
                </SheetActionButtonRow>
                <ButtonPressAnimation
                  onPress={() => Linking.openURL(poapGalleryUrl)}
                >
                  <Text size="15pt" color="labelSecondary" weight="bold">
                    View on POAP 􀮶
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

export default magicMemo(PoapSheet, 'eventId');
