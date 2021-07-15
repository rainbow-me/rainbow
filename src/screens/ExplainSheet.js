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

const SENDING_FUNDS_TO_CONTRACT = `The address you entered is for a smart contract. 

Except for rare situations, you probably shouldn't do this. You could lose your assets or they might go to the wrong place.

Double check the address, verify it with the recipient, or contact support first.`;

const GAS_EXPLAINER = `This is the "gas fee" used by the Ethereum blockchain to securely validate your transaction.

This fee varies depending on the complexity of your transaction and how busy the network is!`;

const VERIFIED_EXPLAINER = `Tokens with a verified badge mean they have appeared on at least 3 other outside token lists.

Always do your own research to ensure you are interacting with a token you trust.`;

const OPTIMISM_EXPLAINER = `Optimism is a Layer 2 network that runs on top of Ethereum, enabling cheaper and faster transactions while still benefiting from the underlying security of Layer 1.

It bundles lots of transactions together in a "roll up" before sending them down to live permanently on Layer 1.`;

const ARBITRUM_EXPLAINER = `Arbitrum is a Layer 2 network that runs on top of Ethereum, enabling cheaper and faster transactions while still benefiting from the underlying security of Layer 1.

It bundles lots of transactions together in a "roll up" before sending them down to live permanently on Layer 1.`;

const POLYGON_EXPLAINER = `Polygon is a sidechain, a distinct network that runs alongside Ethereum and is compatible with it. 

It allows for cheaper and faster transactions, but unlike Layer 2 networks, Polygon has its own security and consensus mechanisms that differ from Ethereum.`;

export const explainers = {
  gas: {
    emoji: '⛽️',
    text: GAS_EXPLAINER,
    title: 'Ethereum network fee',
  },
  sending_funds_to_contract: {
    emoji: '✋',
    text: SENDING_FUNDS_TO_CONTRACT,
    title: 'Hold your horses!',
    extraHeight: 80,
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
    readMoreLink: 'https://optimism.io/',
    extraHeight: 120,
  },
  arbitrum: {
    emoji: '⛽️',
    logo: (
      <ChainLogo marginBottom={10} network={networkTypes.arbitrum} size={100} />
    ),
    text: ARBITRUM_EXPLAINER,
    title: `What's Arbitrum?`,
    readMoreLink: 'https://arbitrum.io/',
    extraHeight: 120,
  },
  polygon: {
    emoji: '⛽️',
    logo: (
      <ChainLogo marginBottom={10} network={networkTypes.polygon} size={100} />
    ),
    text: POLYGON_EXPLAINER,
    title: `What's Polygon?`,
    readMoreLink: 'https://polygon.technology/',
    extraHeight: 120,
  },
};

const ExplainSheet = () => {
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

export default React.memo(ExplainSheet);
