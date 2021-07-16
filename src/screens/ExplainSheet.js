import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { Centered, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { useDimensions } from '@rainbow-me/hooks';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';

export const ExplainSheetHeight = android ? 454 : 434;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const Gradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  steps: [0, 0.5, 1],
  weight: 'heavy',
})``;

const GAS_EXPLAINER = `This is the "gas fee" used by the Ethereum blockchain to securely validate your transaction.

This fee varies depending on the complexity of your transaction and how busy the network is!`;

const VERIFIED_EXPLAINER = `Tokens with a verified badge mean they have appeared on at least 3 other outside token lists.

Always do your own research to ensure you are interacting with a token you trust.`;

const explainers = {
  gas: {
    emoji: '⛽️',
    text: GAS_EXPLAINER,
    title: 'Ethereum network fee',
  },
  verified: {
    emoji: '􀇻',
    text: VERIFIED_EXPLAINER,
    title: 'Verified Tokens',
  },
};

const SavingsSheet = () => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const insets = useSafeArea();
  const { params: { type = 'gas' } = {} } = useRoute();
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  const handleClose = useCallback(() => {
    goBack();
  }, [goBack]);

  const EmojiText = type === 'verified' ? Gradient : Emoji;
  const Title = type === 'verified' ? Gradient : SheetTitle;

  return (
    <Container
      deviceHeight={deviceHeight}
      height={ExplainSheetHeight}
      insets={insets}
    >
      {ios && <StatusBar barStyle="light-content" />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={ExplainSheetHeight}
        scrollEnabled={false}
      >
        <Centered
          direction="column"
          height={ExplainSheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          <ColumnWithMargins
            margin={15}
            style={{
              height: ExplainSheetHeight,
              paddingHorizontal: 19,
              paddingTop: 19,
              width: '100%',
            }}
          >
            <EmojiText
              align="center"
              size="h1"
              style={{ ...fontWithWidth(fonts.weight.bold) }}
            >
              {explainers[type].emoji}
            </EmojiText>
            <Title align="center" lineHeight="big" size="big" weight="heavy">
              {explainers[type].title}
            </Title>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              lineHeight="looser"
              size="large"
              style={{
                alignSelf: 'center',
                maxWidth: 376,
                paddingBottom: 15,
                paddingHorizontal: 23,
              }}
            >
              {explainers[type].text}
            </Text>
            <SheetActionButton
              androidWidth={deviceWidth - 60}
              color={colors.alpha(colors.appleBlue, 0.06)}
              isTransparent
              label="Got it"
              onPress={handleClose}
              size="big"
              textColor={colors.appleBlue}
              weight="heavy"
            />
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(SavingsSheet);
