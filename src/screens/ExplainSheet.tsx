/* eslint-disable sort-keys-fix/sort-keys-fix */
import { useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Linking, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { ChainBadge } from '../components/coin-icon';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { useNavigation } from '../navigation/Navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth, padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
export const ExplainSheetHeight = android ? 454 : 434;

const GasTrendHeader = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  size: 'lmedium',
  weight: 'heavy',
  alignItems: 'center',
  textAlign: 'center',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(9.5, 15, android ? 6 : 9, 15)}
  border-color: ${({ theme: { colors }, color }) => colors.alpha(color, 0.2)};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  border-radius: ${android ? 24 : 20};
  border-width: 2;
`;

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

const FLOOR_PRICE_EXPLAINER = `A collection's floor price is the lowest asking price across all the items currently for sale in a collection.`;

const GAS_EXPLAINER = `This is the "gas fee" used by the Ethereum blockchain to securely validate your transaction.

This fee varies depending on the complexity of your transaction and how busy the network is!`;

const BASE_CURRENT_BASE_FEE_EXPLAINER = `The base fee is set by the Ethereum network and changes depending on how busy the network is.\n\n`;

const CURRENT_BASE_FEE_EXPLAINER_STABLE = `Network traffic is stable right now. Have fun!`;

const CURRENT_BASE_FEE_EXPLAINER_FALLING = `Fees are dropping right now!`;

const CURRENT_BASE_FEE_EXPLAINER_RISING = `Fees are rising right now! It’s best to use a higher max base fee to avoid a stuck transaction.`;

const CURRENT_BASE_FEE_EXPLAINER_SURGING = `Fees are unusually high right now! Unless your transaction is urgent, it’s best to wait for fees to drop.`;

const MAX_BASE_FEE_EXPLAINER = `This is the maximum base fee you’re willing to pay for this transaction.

Setting a higher max base fee prevents your transaction from getting stuck if fees rise.`;

const MINER_TIP_EXPLAINER = `The miner tip goes directly to the miner who confirms your transaction on the network.

A higher tip makes your transaction more likely to be confirmed quickly.`;

const VERIFIED_EXPLAINER = `Tokens with a verified badge mean they have appeared on at least 3 other outside token lists.

Always do your own research to ensure you are interacting with a token you trust.`;

const OPTIMISM_EXPLAINER = `Optimism is a Layer 2 network that runs on top of Ethereum, enabling cheaper and faster transactions while still benefiting from the underlying security of Ethereum.

It bundles lots of transactions together in a "roll up" before sending them down to live permanently on Ethereum.`;

const ARBITRUM_EXPLAINER = `Arbitrum is a Layer 2 network that runs on top of Ethereum, enabling cheaper and faster transactions while still benefiting from the underlying security of Ethereum.

It bundles lots of transactions together in a "roll up" before sending them down to live permanently on Ethereum.`;

const POLYGON_EXPLAINER = `Polygon is a sidechain, a distinct network that runs alongside Ethereum and is compatible with it. 

It allows for cheaper and faster transactions, but unlike Layer 2 networks, Polygon has its own security and consensus mechanisms that differ from Ethereum.`;

export const explainers = {
  floor_price: {
    emoji: '📊',
    extraHeight: -102,
    text: FLOOR_PRICE_EXPLAINER,
    title: 'Collection floor price',
  },
  gas: {
    emoji: '⛽️',
    extraHeight: 2,
    text: GAS_EXPLAINER,
    title: 'Ethereum network fee',
  },
  currentBaseFeeStable: {
    emoji: '🌞',
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    extraHeight: android ? 80 : 40,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_STABLE,
    title: 'Current base fee',
  },
  currentBaseFeeFalling: {
    emoji: '🤑',
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    extraHeight: android ? 60 : 20,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_FALLING,
    title: 'Current base fee',
  },
  currentBaseFeeRising: {
    emoji: '🥵',
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    extraHeight: android ? 100 : 50,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_RISING,
    title: 'Current base fee',
  },
  currentBaseFeeSurging: {
    emoji: '🎢',
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    extraHeight: android ? 100 : 50,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_SURGING,
    title: 'Current base fee',
  },
  maxBaseFee: {
    emoji: '📈',
    extraHeight: 0,
    text: MAX_BASE_FEE_EXPLAINER,
    title: 'Max base fee',
  },
  minerTip: {
    emoji: '⛏',
    extraHeight: 0,
    text: MINER_TIP_EXPLAINER,
    title: 'Miner tip',
  },
  sending_funds_to_contract: {
    emoji: '✋',
    extraHeight: 80,
    text: SENDING_FUNDS_TO_CONTRACT,
    title: 'Hold your horses!',
  },
  verified: {
    emoji: '􀇻',
    text: VERIFIED_EXPLAINER,
    title: 'Verified Tokens',
  },
  optimism: {
    emoji: '⛽️',
    extraHeight: 150,
    logo: (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ChainBadge
        assetType={networkTypes.optimism}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink:
      'https://rainbow.me/learn/a-beginners-guide-to-layer-2-networks',
    text: OPTIMISM_EXPLAINER,
    title: `What's Optimism?`,
  },
  arbitrum: {
    emoji: '⛽️',
    extraHeight: 144,
    logo: (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ChainBadge
        assetType={networkTypes.arbitrum}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink:
      'https://rainbow.me/learn/a-beginners-guide-to-layer-2-networks',
    text: ARBITRUM_EXPLAINER,
    title: `What's Arbitrum?`,
  },
  polygon: {
    emoji: '⛽️',
    extraHeight: 120,
    logo: (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ChainBadge
        assetType={networkTypes.polygon}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink:
      'https://rainbow.me/learn/a-beginners-guide-to-layer-2-networks',
    text: POLYGON_EXPLAINER,
    title: `What's Polygon?`,
  },
  failed_wc_connection: {
    emoji: '😵',
    extraHeight: -50,
    text:
      'Uh oh, something went wrong! The site may be experiencing a connection outage. Please try again later or contact the site’s team for more details.',
    title: 'Connection failed',
  },
};

const ExplainSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'type' does not exist on type '{}'.
  const { params: { type = 'gas', onClose } = {}, params = {} } = useRoute();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const renderBaseFeeIndicator = useMemo(() => {
    if (!type.includes('currentBaseFee')) return null;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'currentGasTrend' does not exist on type ... Remove this comment to see the full error message
    const { currentGasTrend, currentBaseFee } = params;
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <GasTrendHeader
          align="center"
          color={gasUtils.GAS_TRENDS[currentGasTrend].color}
        >
          {`${gasUtils.GAS_TRENDS[currentGasTrend].label} • ${parseInt(
            currentBaseFee
          )} Gwei`}
        </GasTrendHeader>
      </Centered>
    );
  }, [params, type]);

  const handleClose = useCallback(() => {
    goBack();
    onClose?.();
  }, [onClose, goBack]);

  const handleReadMore = useCallback(() => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    Linking.openURL(explainers[type].readMoreLink);
  }, [type]);

  const EmojiText = type === 'verified' ? Gradient : Emoji;
  const Title = type === 'verified' ? Gradient : SheetTitle;

  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const sheetHeight = ExplainSheetHeight + (explainers[type]?.extraHeight || 0);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <StatusBar barStyle="light-content" />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered
          direction="column"
          height={sheetHeight}
          testID="add-token-sheet"
          width="100%"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ColumnWithMargins
            margin={15}
            style={{
              height: sheetHeight,
              padding: 19,
              width: '100%',
            }}
          >
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has
            an 'any' type because expre... Remove this comment to see the full
            error message
            {explainers[type]?.logo ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Centered>{explainers[type].logo}</Centered>
            ) : (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <EmojiText
                align="center"
                size="h1"
                style={{ ...fontWithWidth(fonts.weight.bold) }}
              >
                // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly
                has an 'any' type because expre... Remove this comment to see
                the full error message
                {explainers[type].emoji}
              </EmojiText>
            )}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Title align="center" lineHeight="big" size="big" weight="heavy">
              // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has
              an 'any' type because expre... Remove this comment to see the full
              error message
              {explainers[type].title}
            </Title>
            {/** base fee explainer */}
            {renderBaseFeeIndicator}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
              // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has
              an 'any' type because expre... Remove this comment to see the full
              error message
              {explainers[type].text}
            </Text>
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has
            an 'any' type because expre... Remove this comment to see the full
            error message
            {explainers[type].readMoreLink && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Column height={60}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <SheetActionButton
                  color={colors.blueGreyDarkLight}
                  isTransparent
                  label="Read More"
                  onPress={handleReadMore}
                  size="big"
                  textColor={colors.blueGreyDark60}
                  weight="heavy"
                />
              </Column>
            )}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={colors.alpha(colors.appleBlue, 0.04)}
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
