/* eslint-disable sort-keys-fix/sort-keys-fix */
import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Linking, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { ChainBadge } from '../components/coin-icon';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { toFixedDecimals } from '@rainbow-me/helpers/utilities';
import { useDimensions } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
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
}))({
  ...padding.object(android ? 5 : 8, 12),
  borderColor: ({ theme: { colors }, color }) => colors.alpha(color, 0.06),
  borderRadius: 20,
  borderWidth: 2,
  height: 40,
  marginBottom: 4,
});

const Container = styled(Centered).attrs({ direction: 'column' })(
  ({ deviceHeight, height }) => ({
    ...position.coverAsObject,
    ...(height ? { height: height + deviceHeight } : {}),
  })
);

const Gradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  steps: [0, 0.5, 1],
  weight: 'heavy',
})({});

const SENDING_FUNDS_TO_CONTRACT = lang.t('explain.sending_to_contract.text');

const FLOOR_PRICE_EXPLAINER = lang.t('explain.floor_price.text');

const gasExplainer = network =>
  lang.t('explain.gas.text', { networkName: network });

const CURRENT_BASE_FEE_TITLE = lang.t('explain.base_fee.title');

const BASE_CURRENT_BASE_FEE_EXPLAINER = lang.t('explain.base_fee.text_prefix');

const CURRENT_BASE_FEE_EXPLAINER_STABLE = lang.t(
  'explain.base_fee.text_stable'
);

const CURRENT_BASE_FEE_EXPLAINER_FALLING = lang.t(
  'explain.base_fee.text_falling'
);

const CURRENT_BASE_FEE_EXPLAINER_RISING = lang.t(
  'explain.base_fee.text_rising'
);

const CURRENT_BASE_FEE_EXPLAINER_SURGING = lang.t(
  'explain.base_fee.text_surging'
);

const MAX_BASE_FEE_EXPLAINER = lang.t('explain.max_base_fee.text');

const MINER_TIP_EXPLAINER = lang.t('explain.miner_tip.text');

const VERIFIED_EXPLAINER = lang.t('explain.verified.text');

const OPTIMISM_EXPLAINER = lang.t('explain.optimism.text');

const ARBITRUM_EXPLAINER = lang.t('explain.arbitrum.text');

const POLYGON_EXPLAINER = lang.t('explain.polygon.text');

const BACKUP_EXPLAINER = lang.t('back_up.explainers.backup', {
  cloudPlatformName: cloudPlatformAccountName,
});

export const explainers = network => ({
  floor_price: {
    emoji: '📊',
    extraHeight: -102,
    text: FLOOR_PRICE_EXPLAINER,
    title: lang.t('explain.floor_price.title'),
  },
  gas: {
    emoji: '⛽️',
    extraHeight: 2,
    text: gasExplainer(network),
    title: lang.t('explain.gas.title'),
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
    title: lang.t('explain.max_base_fee.title'),
  },
  minerTip: {
    emoji: '⛏',
    extraHeight: -31,
    text: MINER_TIP_EXPLAINER,
    title: lang.t('explain.miner_tip.title'),
  },
  sending_funds_to_contract: {
    emoji: '✋',
    extraHeight: 80,
    text: SENDING_FUNDS_TO_CONTRACT,
    title: lang.t('explain.sending_to_contract.title'),
  },
  verified: {
    emoji: '􀇻',
    text: VERIFIED_EXPLAINER,
    title: lang.t('explain.verified.title'),
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
    title: lang.t('explain.optimism.title'),
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
    title: lang.t('explain.arbitrum.title'),
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
    title: lang.t('explain.polygon.title'),
  },
  failed_wc_connection: {
    emoji: '😵',
    extraHeight: -50,
    text: lang.t('explain.failed_walletconnect.text'),
    title: lang.t('explain.failed_walletconnect.title'),
  },
  backup: {
    emoji: '🔐',
    extraHeight: 20,
    text: BACKUP_EXPLAINER,
    title: lang.t('explain.backup.title'),
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
                  label={lang.t('explain.read_more')}
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
              label={lang.t('button.got_it')}
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
