/* eslint-disable sort-keys */
import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Linking, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import ChainLogo from '../components/ChainLogo';
import { Centered, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import networkTypes from '@rainbow-me/helpers/networkTypes';
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

const SENDING_FUNDS_TO_CONTRACT = `You're trying to send funds to a smart contract.

Except for some very rare exceptions, you are not supposed to this and it's very likely that your funds will get lost.

Please check the recipient address and try again or reach out to our support.
`;

const GAS_EXPLAINER = `This is the "gas fee" used by the Ethereum blockchain to securely validate your transaction.

This fee varies depending on the complexity of your transaction and how busy the network is!`;

const VERIFIED_EXPLAINER = `Tokens with a verified badge mean they have appeared on at least 3 other outside token lists.

Always do your own research to ensure you are interacting with a token you trust.`;

const OPTIMISM_EXPLAINER = `Optimism is a layer 2 network that sits on top of Ethereum, allowing cheaper and faster transactions!

Still curious? Read more about the pros and cons of the different networks you can use in Rainbow!`;

const ARBITRUM_EXPLAINER = `Arbitrum is a layer 2 network that sits on top of Ethereum, allowing cheaper and faster transactions!

You can move assets into and out of different layer 2 networks by swapping in Rainbow!`;

const POLYGON_EXPLAINER = `Polygon combines the best of Ethereum and sovereign blockchains into a full-fledged multi-chain system.

Polygon solves pain points associated with Blockchains, like high gas fees and slow speeds, without sacrificing on security.`;

export const explainers = {
  gas: {
    emoji: '⛽️',
    text: GAS_EXPLAINER,
    title: 'Ethereum network fee',
  },
  sending_funds_to_contract: {
    emoji: '✋',
    text: SENDING_FUNDS_TO_CONTRACT,
    title: 'Stop right there!',
    extraHeight: 70,
  },
  verified: {
    emoji: '􀇻',
    text: VERIFIED_EXPLAINER,
    title: 'Verified Tokens',
  },
  optimism: {
    emoji: '⛽️',
    logo: (
      <ChainLogo marginBottom={10} network={networkTypes.optimism} size={100} />
    ),
    text: OPTIMISM_EXPLAINER,
    title: `What's Optimism?`,
    readMoreLink: 'https://rainbow.me',
    extraHeight: 70,
  },
  arbitrum: {
    emoji: '⛽️',
    logo: (
      <ChainLogo marginBottom={10} network={networkTypes.arbitrum} size={100} />
    ),
    text: ARBITRUM_EXPLAINER,
    title: `What's Arbitrum?`,
    readMoreLink: 'https://rainbow.me',
    extraHeight: 60,
  },
  polygon: {
    emoji: '⛽️',
    logo: (
      <ChainLogo marginBottom={10} network={networkTypes.polygon} size={100} />
    ),
    text: POLYGON_EXPLAINER,
    title: `What's Polygon?`,
    readMoreLink: 'https://rainbow.me',
    extraHeight: 90,
  },
};

const SavingsSheet = () => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const insets = useSafeArea();
  const { params: { type = 'gas', onClose } = {} } = useRoute();
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  const handleClose = useCallback(() => {
    goBack();
    onClose?.();
  }, [onClose, goBack]);

  const handleReadMore = useCallback(() => {
    Linking.openURL(explainers[type].readMoreLink);
  }, [type]);

  const EmojiText = type === 'verified' ? Gradient : Emoji;
  const Title = type === 'verified' ? Gradient : SheetTitle;

  const sheetHeight = ExplainSheetHeight + (explainers[type]?.extraHeight || 0);

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      {ios && <StatusBar barStyle="light-content" />}

      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <Centered
          direction="column"
          height={sheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          <ColumnWithMargins
            margin={15}
            style={{
              height: sheetHeight,
              paddingHorizontal: 19,
              paddingTop: 19,
              width: '100%',
            }}
          >
            {explainers[type]?.logo ? (
              <Centered marginBottom={10} marginTop={20}>
                {explainers[type].logo}
              </Centered>
            ) : (
              <EmojiText
                align="center"
                size="h1"
                style={{ ...fontWithWidth(fonts.weight.bold) }}
              >
                {explainers[type].emoji}
              </EmojiText>
            )}
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
            {explainers[type].readMoreLink && (
              <SheetActionButton
                androidWidth={deviceWidth - 60}
                color={colors.blueGreyDarkLight}
                isTransparent
                label="Read More"
                onPress={handleReadMore}
                size="big"
                textColor={colors.blueGreyDark60}
                weight="heavy"
              />
            )}
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
