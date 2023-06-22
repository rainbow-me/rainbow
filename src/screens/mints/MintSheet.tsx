import { BlurView } from '@react-native-community/blur';

import React, { useRef } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import useWallets from '../../hooks/useWallets';

import ImgixImage from '../../components/images/ImgixImage';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../../components/sheet';

import { CardSize } from '../../components/unique-token/CardSize';

import {
  AccentColorProvider,
  BackgroundProvider,
  Bleed,
  Box,
  ColorModeProvider,
  Columns,
  Heading,
  HeadingProps,
  Inline,
  Inset,
  MarkdownText,
  MarkdownTextProps,
  Row,
  Rows,
  Separator,
  Space,
  Stack,
  Text,
  TextProps,
} from '@/design-system';
import { useAccountProfile, useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { magicMemo } from '@/utils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { maybeSignUri } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';

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

interface MintSheetProps {
  eventId: string;
}

const MintSheet = ({ eventId }: MintSheetProps) => {
  const { accountAddress } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate, setOptions } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const imageUrl = maybeSignUri(
    'https://assets.poap.xyz/d5979728-1082-49ed-9b3c-e0e806210c8c.png'
  );
  console.log(imageUrl);

  const imageColor =
    usePersistentDominantColorFromImage(imageUrl) ?? colors.paleBlue;

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  return (
    <>
      {ios && (
        <BlurWrapper height={deviceHeight} width={deviceWidth}>
          <BackgroundImage>
            <ImgixImage
              source={{ uri: imageUrl }}
              resizeMode="cover"
              size={CardSize}
              style={{ height: deviceHeight, width: deviceWidth }}
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
        bottomInset={42}
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
        ref={sheetRef}
        scrollEnabled
        testID="unique-token-expanded-state"
        yPosition={yPosition}
        sh
      >
        <ColorModeProvider value="darkTinted">
          <Box
            width="full"
            height={{ custom: deviceHeight - 100 }}
            justifyContent="center"
            alignItems="center"
          >
            <Rows space="20px" alignHorizontal="center">
              <Row height={'content'}>
                <Box paddingTop={'104px'}>
                  <Stack space={'28px'}>
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
                  Babys first POAP
                </Text>
                <Text size="15pt" color="labelSecondary" weight="bold">
                  June 22, 2023
                </Text>
              </Stack>
              <Stack alignHorizontal="center">
                <SheetActionButtonRow>
                  <SheetActionButton color={imageColor} label="􀑒 Claim POAP" />
                </SheetActionButtonRow>
                <ButtonPressAnimation>
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

export default magicMemo(MintSheet, 'asset');
