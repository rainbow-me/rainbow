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
import { Box } from '@/design-system';
import AppIconOptimism from '@rainbow-me/assets/appIconOptimism.png';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { toFixedDecimals } from '@rainbow-me/helpers/utilities';
import { useDimensions } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import Routes from '@rainbow-me/routes';
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

const OptimismAppIcon = () => {
  const { colors, isDarkMode } = useTheme();
  return (
    <Box
      style={{
        shadowColor: isDarkMode ? colors.shadowBlack : colors.optimismRed,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        marginVertical: 10,
      }}
    >
      <ImgixImage
        source={AppIconOptimism}
        style={{
          width: 64,
          height: 64,
        }}
      />
    </Box>
  );
};

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

const ENS_PRIMARY_NAME_EXPLAINER =
  'People will be able to type your .eth name into dApps instead of your full Ethereum address when they want to send something to you, and dApps will be able to use your .eth name and profile to display information about you. This is also known as setting your ENS name to “primary.”';

const ENS_ON_CHAIN_DATA_WARNING_EXPLAINER =
  'The data you provide here will be stored on the Ethereum blockchain – meaning it will be visible to everyone and accessible by anyone. Do not share any data you are uncomfortable with publicizing.';

const ENS_ON_CHAIN_DATA_WARNING_TITLE = 'Heads up!';

const ENS_PRIMARY_NAME_TITLE = 'What does it mean to set my ENS name?';

const ENS_MANAGER_TITLE = `What is the .eth manager?`;

const ENS_MANAGER_EXPLAINER = `The manager of a .eth name is able to set and update its records, create subdomains of that name or manage its configuration. The manager is set by the owner of the .eth name and is also known as the ENS name’s controller.`;

const ENS_OWNER_TITLE = `What is the .eth name owner?`;

const ENS_OWNER_EXPLAINER = `The owner of a .eth name has full and ultimate control over that name. They can transfer ownership of the name and allow someone else to manage the name for them if they choose (setting records etc). The owner is also known as the ENS name’s registrant.`;

const OPTIMISM_APP_ICON_EXPLAINER = lang.t('explain.optimism_app_icon.text');

export const explainers = network => ({
  optimism_app_icon: {
    logo: <OptimismAppIcon />,
    extraHeight: -25,
    text: OPTIMISM_APP_ICON_EXPLAINER,
    title: lang.t('explain.optimism_app_icon.title'),
    button: {
      label: lang.t('explain.optimism_app_icon.button'),
      textColor: 'optimismRed',
      bgColor: 'optimismRed06',
      onPress: (navigate, goBack, handleClose) => () => {
        if (handleClose) handleClose();
        if (goBack) goBack();
        setTimeout(() => {
          navigate(Routes.SETTINGS_SHEET);
          setTimeout(() => {
            navigate(Routes.SETTINGS_SHEET, {
              screen: 'AppIconSection',
            });
          }, 300);
        }, 300);
      },
    },
  },
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
    title: lang.t('explain.gas.title', {
      networkName: network,
    }),
  },
  ens_primary_name: {
    extraHeight: 50,
    emoji: '❓',
    text: ENS_PRIMARY_NAME_EXPLAINER,
    title: ENS_PRIMARY_NAME_TITLE,
  },
  ens_manager: {
    extraHeight: -30,
    emoji: '❓',
    text: ENS_MANAGER_EXPLAINER,
    title: ENS_MANAGER_TITLE,
  },
  ens_owner: {
    extraHeight: 0,
    emoji: '❓',
    text: ENS_OWNER_EXPLAINER,
    title: ENS_OWNER_TITLE,
  },
  ensOnChainDataWarning: {
    extraHeight: -30,
    emoji: '✋',
    text: ENS_ON_CHAIN_DATA_WARNING_EXPLAINER,
    title: ENS_ON_CHAIN_DATA_WARNING_TITLE,
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
  const { goBack, navigate } = useNavigation();
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
              color={
                colors[explainSheetConfig.button?.bgColor] ||
                colors.alpha(colors.appleBlue, 0.04)
              }
              isTransparent
              label={
                explainSheetConfig.button?.label || lang.t('button.got_it')
              }
              onPress={
                explainSheetConfig.button?.onPress
                  ? explainSheetConfig.button.onPress(
                      navigate,
                      goBack,
                      handleClose
                    )
                  : handleClose
              }
              size="big"
              textColor={
                colors[explainSheetConfig.button?.textColor] || colors.appleBlue
              }
              weight="heavy"
            />
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(ExplainSheet);
2;
