/* eslint-disable sort-keys-fix/sort-keys-fix */
import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Linking, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { ChainBadge } from '../components/coin-icon';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { toFixedDecimals } from '@rainbow-me/helpers/utilities';
import { useDimensions } from '@rainbow-me/hooks';
import { fonts, fontWithWidth, padding, position } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';
import { cloudPlatformAccountName } from '@rainbow-me/utils/platform';

const { GAS_TRENDS } = gasUtils;
export const ExplainSheetHeight = android ? 454 : 434;

const GasTrendHeader = styled(Text).attrs(({ theme: { colors }, color }) => ({
  align: 'center',
  alignItems: 'center',
  color: color || colors.appleBlue,
  size: 'lmedium',
  weight: 'heavy',
}))`
  ${padding(android ? 5 : 8, 12)}
  border-color: ${({ theme: { colors }, color }) => colors.alpha(color, 0.06)};
  border-radius: 20;
  border-width: 2;
  height: 40;
  margin-bottom: 4;
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

const gasExplainer = network => `This is the "gas fee" used by the ${network} blockchain to securely validate your transaction.

This fee varies depending on the complexity of your transaction and how busy the network is!`;

const CURRENT_BASE_FEE_TITLE = `Current base fee`;

const BASE_CURRENT_BASE_FEE_EXPLAINER = `The base fee is set by the Ethereum network and changes depending on how busy the network is.`;

const CURRENT_BASE_FEE_EXPLAINER_STABLE = `\n\nNetwork traffic is stable right now. Have fun!`;

const CURRENT_BASE_FEE_EXPLAINER_FALLING = `\n\nFees are dropping right now!`;

const CURRENT_BASE_FEE_EXPLAINER_RISING = `\n\nFees are rising right now! It’s best to use a higher max base fee to avoid a stuck transaction.`;

const CURRENT_BASE_FEE_EXPLAINER_SURGING = `\n\nFees are unusually high right now! Unless your transaction is urgent, it’s best to wait for fees to drop.`;

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

const BACKUP_EXPLAINER = lang.t('back_up.explainers.backup', {
  cloudPlatformName: cloudPlatformAccountName,
});

export const explainers = network => ({
  floor_price: {
    emoji: '📊',
    extraHeight: -102,
    text: FLOOR_PRICE_EXPLAINER,
    title: 'Collection floor price',
  },
  gas: {
    emoji: '⛽️',
    extraHeight: 2,
    text: gasExplainer(network),
    title: `${network} network fee`,
  },
  currentBaseFeeStable: {
    emoji: '🌞',
    extraHeight: android ? 40 : 28,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_STABLE,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeFalling: {
    emoji: '📉',
    extraHeight: android ? 20 : 2,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_FALLING,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeRising: {
    emoji: '🥵',
    extraHeight: android ? 60 : 54,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_RISING,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeSurging: {
    emoji: '🎢',
    extraHeight: android ? 100 : 54,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_SURGING,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeNotrend: {
    emoji: '⛽',
    extraHeight: android ? -20 : -40,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER,
    title: CURRENT_BASE_FEE_TITLE,
  },
  maxBaseFee: {
    emoji: '📈',
    extraHeight: -31,
    text: MAX_BASE_FEE_EXPLAINER,
    title: 'Max base fee',
  },
  minerTip: {
    emoji: '⛏',
    extraHeight: -31,
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
      <ChainBadge
        assetType={networkTypes.optimism}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink:
      'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
    text: OPTIMISM_EXPLAINER,
    title: `What's Optimism?`,
  },
  arbitrum: {
    emoji: '⛽️',
    extraHeight: 144,
    logo: (
      <ChainBadge
        assetType={networkTypes.arbitrum}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink:
      'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
    text: ARBITRUM_EXPLAINER,
    title: `What's Arbitrum?`,
  },
  polygon: {
    emoji: '⛽️',
    extraHeight: 120,
    logo: (
      <ChainBadge
        assetType={networkTypes.polygon}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink:
      'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
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
  backup: {
    emoji: '🔐',
    extraHeight: 20,
    text: BACKUP_EXPLAINER,
    title: 'Important',
  },
});

const ExplainSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const {
    params: { type = 'gas', network = networkTypes.mainnet, onClose } = {},
    params = {},
  } = useRoute();
  const { colors } = useTheme();
  const { goBack } = useNavigation();
  const renderBaseFeeIndicator = useMemo(() => {
    if (!type.includes('currentBaseFee')) return null;
    const { currentGasTrend, currentBaseFee } = params;
    const { color, label } = GAS_TRENDS[currentGasTrend];
    const baseFeeLabel = label ? `${label} ·` : '';
    return (
      <Centered>
        <GasTrendHeader color={color}>
          {`${baseFeeLabel} ${toFixedDecimals(currentBaseFee, 0)} Gwei`}
        </GasTrendHeader>
      </Centered>
    );
  }, [params, type]);

  const explainSheetConfig = useMemo(() => {
    return explainers(network)[type];
  }, [network, type]);

  const handleClose = useCallback(() => {
    goBack();
    onClose?.();
  }, [onClose, goBack]);

  const handleReadMore = useCallback(() => {
    Linking.openURL(explainSheetConfig.readMoreLink);
  }, [explainSheetConfig.readMoreLink]);

  const EmojiText = type === 'verified' ? Gradient : Emoji;
  const Title = type === 'verified' ? Gradient : SheetTitle;

  const sheetHeight =
    ExplainSheetHeight + (explainSheetConfig?.extraHeight || 0);

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
              padding: 19,
              width: '100%',
            }}
          >
            {explainSheetConfig?.logo ? (
              <Centered>{explainSheetConfig.logo}</Centered>
            ) : (
              <EmojiText
                align="center"
                size="h1"
                style={{
                  ...fontWithWidth(fonts.weight.bold),
                  height: android ? 60 : 47,
                }}
              >
                {explainSheetConfig.emoji}
              </EmojiText>
            )}
            <Title align="center" lineHeight="big" size="big" weight="heavy">
              {explainSheetConfig.title}
            </Title>

            {/** base fee explainer */}
            {renderBaseFeeIndicator}

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
              {explainSheetConfig.text}
            </Text>
            {explainSheetConfig.readMoreLink && (
              <Column height={60}>
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
