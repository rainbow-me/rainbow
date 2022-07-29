/* eslint-disable sort-keys-fix/sort-keys-fix */
import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Linking, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { ChainBadge, CoinIcon } from '../components/coin-icon';
import { Centered, Column, ColumnWithMargins, Row } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { Box } from '@/design-system';
import AppIconOptimism from '@rainbow-me/assets/appIconOptimism.png';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import { toFixedDecimals } from '@rainbow-me/helpers/utilities';
import { useDimensions } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { ETH_ADDRESS, ETH_SYMBOL } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { fonts, fontWithWidth, padding, position } from '@rainbow-me/styles';
import { ethereumUtils, gasUtils } from '@rainbow-me/utils';
import { cloudPlatformAccountName } from '@rainbow-me/utils/platform';

const { GAS_TRENDS } = gasUtils;
export const ExplainSheetHeight = android ? 454 : 434;

const getBodyTextPropsWithColor = colors =>
  colors
    ? {
        align: 'center',
        color: colors.blueGreyDark60,
        lineHeight: 'looser',
        size: 'large',
        style: {
          alignSelf: 'center',
          maxWidth: 376,
          paddingBottom: 15,
          paddingHorizontal: 23,
        },
      }
    : {};

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

const availableNetworksExplainer = (tokenSymbol, networks) => {
  const readableNetworks = networks
    ?.map(network => networkInfo[network].name)
    ?.join(', ');

  return lang.t('explain.available_networks.text', {
    tokenSymbol: tokenSymbol,
    networks: readableNetworks,
  });
};

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

const SWAP_RESET_EXPLAINER = `Rainbow doesn’t have the ability to swap across networks yet, but we’re on it. For now, Rainbow will match networks between selected tokens.`;

const BACKUP_EXPLAINER = lang.t('back_up.explainers.backup', {
  cloudPlatformName: cloudPlatformAccountName,
});

const ENS_PRIMARY_NAME_EXPLAINER =
  'Setting a primary ENS name makes your Ethereum address point to your .eth name, enabling dapps to find and display it when you connect your wallet.';

const ENS_ON_CHAIN_DATA_WARNING_EXPLAINER =
  'The data you provide here will be stored on the Ethereum blockchain – meaning it will be visible to everyone and accessible by anyone. Do not share any data you are uncomfortable with publicizing.';

const ENS_ON_CHAIN_DATA_WARNING_TITLE = 'Heads up!';

const ENS_PRIMARY_NAME_TITLE = 'What is a primary ENS name?';

const ENS_MANAGER_TITLE = `Who is the .eth manager?`;

const ENS_MANAGER_EXPLAINER = `The manager of a .eth name registration. The manager may transfer ownership, set a resolver or TTL, as well as create or reassign subdomains`;

const ENS_OWNER_TITLE = `Who is the .eth owner?`;

const ENS_OWNER_EXPLAINER = `The owner of a .eth name registration. The owner may transfer the registration or reclaim ownership of the name in the registry if required.`;

const ENS_RESOLVER_TITLE = `What is a .eth resolver?`;

const ENS_RESOLVER_EXPLAINER = `A resolver is a contract that maps from name to the resource (e.g., cryptocurrency addresses, content hash, etc). Resolvers are pointed to by the resolver field of the registry.`;

const OPTIMISM_APP_ICON_EXPLAINER = lang.t('explain.optimism_app_icon.text');

export const explainers = (params, colors) => ({
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
  output_disabled: {
    extraHeight: -30,
    title: params?.inputToken
      ? lang.t('explain.output_disabled.title', {
          inputToken: params?.inputToken,
        })
      : lang.t('explain.output_disabled.title_empty'),
    text: lang.t('explain.output_disabled.text', {
      network: networkInfo[params?.network]?.name,
      inputToken: params?.inputToken,
      outputToken: params?.outputToken,
    }),
    logo: (
      <ChainBadge
        assetType={params?.network}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
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
    text: gasExplainer(params?.network),
    title: lang.t('explain.gas.title', {
      networkName: params?.network,
    }),
  },
  ens_primary_name: {
    extraHeight: -70,
    emoji: '❓',
    text: ENS_PRIMARY_NAME_EXPLAINER,
    title: ENS_PRIMARY_NAME_TITLE,
  },
  ens_manager: {
    extraHeight: -80,
    emoji: '❓',
    text: ENS_MANAGER_EXPLAINER,
    title: ENS_MANAGER_TITLE,
  },
  ens_owner: {
    extraHeight: -80,
    emoji: '❓',
    text: ENS_OWNER_EXPLAINER,
    title: ENS_OWNER_TITLE,
  },
  ens_resolver: {
    extraHeight: -60,
    emoji: '❓',
    text: ENS_RESOLVER_EXPLAINER,
    title: ENS_RESOLVER_TITLE,
  },
  ensOnChainDataWarning: {
    extraHeight: -30,
    emoji: '✋',
    text: ENS_ON_CHAIN_DATA_WARNING_EXPLAINER,
    title: ENS_ON_CHAIN_DATA_WARNING_TITLE,
  },
  currentBaseFeeStable: {
    emoji: '🌞',
    extraHeight: android ? 42 : 28,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_STABLE,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeFalling: {
    emoji: '📉',
    extraHeight: android ? 22 : 2,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_FALLING,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeRising: {
    emoji: '🥵',
    extraHeight: android ? 62 : 54,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_RISING,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeSurging: {
    emoji: '🎢',
    extraHeight: android ? 102 : 54,
    text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_SURGING,
    title: CURRENT_BASE_FEE_TITLE,
  },
  currentBaseFeeNotrend: {
    emoji: '⛽',
    extraHeight: android ? -18 : -40,
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
  unverified: {
    extraHeight: 120,
    emoji: '⚠️',
    button: {
      label: lang.t('button.continue'),
      bgColor: colors?.blueGreyDark80,
    },
    secondaryButton: {
      label: lang.t('button.go_back_lowercase'),
      textColor: colors?.appleBlue,
      bgColor: colors?.clearBlue,
    },
    title: lang.t('explain.unverified.title', {
      symbol: params?.asset?.symbol,
    }),
    stillCurious: (
      <Text {...getBodyTextPropsWithColor(colors)}>
        {lang.t('explain.unverified.fragment1')}
        <Text
          color={colors?.appleBlue}
          onPress={() =>
            ethereumUtils.openTokenEtherscanURL(
              params?.asset.address,
              ethereumUtils.getNetworkFromType(params?.asset?.type)
            )
          }
          size="large"
          suppressHighlighting
          weight="semibold"
        >
          {lang.t('explain.unverified.fragment2')}
        </Text>
        {lang.t('explain.unverified.fragment3')}
      </Text>
    ),
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
  rainbow_fee: {
    emoji: '🌈',
    extraHeight: -100,
    text: lang.t('explain.rainbow_fee.text', {
      feePercentage: params?.feePercentage,
    }),
    title: 'Rainbow Fee',
  },
  swapResetInputs: {
    button: {
      label: `Continue with ${networkInfo[params?.network]?.name}`,
      bgColor: colors?.networkColors[params?.network],
    },
    emoji: '🔐',
    extraHeight: -90,
    text: SWAP_RESET_EXPLAINER,
    title: `Switching to ${networkInfo[params?.network]?.name}`,
    logo:
      params?.network !== 'mainnet' ? (
        <ChainBadge
          assetType={networkTypes[params?.network]}
          marginBottom={8}
          position="relative"
          size="large"
        />
      ) : (
        <CoinIcon address={ETH_ADDRESS} size={40} symbol={ETH_ADDRESS} />
      ),
  },
  insufficientLiquidity: {
    extraHeight: -20,
    emoji: '🏦',
    title: lang.t('explain.insufficient_liquidity.title'),
    stillCurious: (
      <Text {...getBodyTextPropsWithColor(colors)}>
        {lang.t('explain.insufficient_liquidity.fragment1')}
        <Text
          color={colors?.appleBlue}
          onPress={() =>
            Linking.openURL(
              'https://learn.rainbow.me/a-beginners-guide-to-liquidity-providing'
            )
          }
          size="large"
          suppressHighlighting
          weight="semibold"
        >
          {lang.t('explain.insufficient_liquidity.fragment2')}
        </Text>
        {lang.t('explain.insufficient_liquidity.fragment3')}
      </Text>
    ),
  },
  availableNetworks: {
    buttonText: `Go to Hop`,
    extraHeight: -90,
    text: availableNetworksExplainer(params?.tokenSymbol, params?.networks),
    title:
      params?.networks?.length > 1
        ? lang.t('explain.available_networks.title_plural', {
            length: params?.networks?.length,
          })
        : lang.t('explain.available_networks.title_singular', {
            network: params?.networks?.[0],
          }),
    logo: (
      <Row justify="center" marginBottom={10}>
        {params?.networks?.map((network, index) => {
          return (
            <Box
              height={{ custom: 40 }}
              key={`networks-${network}`}
              marginLeft={{
                custom:
                  index > 0
                    ? -12
                    : params?.networks?.length % 2 === 0
                    ? -2
                    : -30,
              }}
              style={{
                borderColor: colors.transparent,
                borderRadius: 0,
                borderWidth: 1,
                zIndex: index,
              }}
              width={{ custom: 40 }}
              zIndex={params?.networks?.length - index}
            >
              {network !== 'mainnet' ? (
                <ChainBadge
                  assetType={network}
                  position="relative"
                  size="large"
                />
              ) : (
                <CoinIcon
                  address={ETH_ADDRESS}
                  size={40}
                  style={{ marginTop: 4 }}
                  symbol={ETH_SYMBOL}
                />
              )}
            </Box>
          );
        })}
      </Row>
    ),
  },
  obtainL2Assets: {
    extraHeight: 40,
    button: {
      label: lang.t('explain.go_to_hop_with_icon.text'),
      bgColor: colors?.blueGreyDark80,
    },
    secondaryButton: {
      label: lang.t('button.go_back_lowercase'),
      textColor: colors?.appleBlue,
      bgColor: colors?.clearBlue,
    },
    stillCurious: (
      <Text {...getBodyTextPropsWithColor(colors)}>
        {lang.t('explain.obtain_l2_asset.fragment1', {
          networkName: params?.networkName,
          tokenName: params?.assetName,
        })}
        <Text
          color={colors?.appleBlue}
          onPress={() =>
            Linking.openURL(
              'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks'
            )
          }
          size="large"
          suppressHighlighting
          weight="semibold"
        >
          {lang.t('explain.obtain_l2_asset.fragment2', {
            networkName: params?.networkName,
          })}
        </Text>
        {lang.t('explain.obtain_l2_asset.fragment3')}
      </Text>
    ),
    logo: (
      <ChainBadge
        assetType={params?.network}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    title: lang.t('explain.obtain_l2_asset.title', {
      networkName: params?.networkName,
    }),
  },
  flashbots: {
    extraHeight: android ? 20 : 0,
    emoji: '🤖',
    stillCurious: (
      <Text {...getBodyTextPropsWithColor(colors)}>
        {lang.t('explain.flashbots.still_curious.fragment1')}
        <Text
          color={colors?.appleBlue}
          onPress={() =>
            Linking.openURL(
              'https://learn.rainbow.me/protecting-transactions-with-flashbots'
            )
          }
          size="large"
          suppressHighlighting
          weight="semibold"
        >
          {lang.t('explain.flashbots.still_curious.fragment2')}
        </Text>
        {lang.t('explain.flashbots.still_curious.fragment3')}
      </Text>
    ),
    text: lang.t('explain.flashbots.text'),
    title: lang.t('explain.flashbots.title'),
  },
  routeSwaps: {
    extraHeight: android ? 20 : 0,
    emoji: '🔀',
    stillCurious: (
      <Text {...getBodyTextPropsWithColor(colors)}>
        {lang.t('explain.swap_routing.still_curious.fragment1')}
        <Text
          color={colors?.appleBlue}
          onPress={() =>
            Linking.openURL(
              'https://learn.rainbow.me/swap-with-confidence-with-rainbow'
            )
          }
          size="large"
          suppressHighlighting
          weight="semibold"
        >
          {lang.t('explain.swap_routing.still_curious.fragment2')}
        </Text>
        {lang.t('explain.swap_routing.still_curious.fragment3')}
      </Text>
    ),
    text: lang.t('explain.swap_routing.text'),
    title: lang.t('explain.swap_routing.title'),
  },
  slippage: {
    extraHeight: 126,
    emoji: '🌊',
    stillCurious: (
      <Text {...getBodyTextPropsWithColor(colors)}>
        {lang.t('explain.slippage.still_curious.fragment1')}
        <Text
          color={colors?.appleBlue}
          onPress={() =>
            Linking.openURL(
              'https://academy.shrimpy.io/post/what-is-slippage-how-to-avoid-slippage-on-defi-exchanges'
            )
          }
          size="large"
          suppressHighlighting
          weight="semibold"
        >
          {lang.t('explain.slippage.still_curious.fragment2')}
        </Text>
        {lang.t('explain.slippage.still_curious.fragment3')}
      </Text>
    ),
    text: lang.t('explain.slippage.text'),
    title: lang.t('explain.slippage.title'),
  },
});

const ExplainSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeArea();
  const { params } = useRoute();
  const type = params.type;

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
    return explainers(params, colors)[type];
  }, [colors, params, type]);
  const handleClose = useCallback(() => {
    goBack();
    params?.onClose?.();
  }, [goBack, params]);

  const handleReadMore = useCallback(() => {
    Linking.openURL(explainSheetConfig.readMoreLink);
  }, [explainSheetConfig.readMoreLink]);

  const EmojiText = type === 'verified' ? Gradient : Emoji;
  const Title = type === 'verified' ? Gradient : SheetTitle;

  const sheetHeight =
    ExplainSheetHeight + (explainSheetConfig?.extraHeight || 0);

  const buttons = useMemo(() => {
    const reverseButtons = type === 'obtainL2Assets' || type === 'unverified';
    const secondaryButton = (explainSheetConfig?.readMoreLink ||
      explainSheetConfig?.secondaryButton?.label) && (
      <Column
        height={60}
        style={android && reverseButtons && { marginTop: 16 }}
      >
        <SheetActionButton
          color={
            explainSheetConfig?.secondaryButton?.bgColor ??
            colors.blueGreyDarkLight
          }
          isTransparent
          label={
            explainSheetConfig.secondaryButton?.label ||
            lang.t('explain.read_more')
          }
          onPress={explainSheetConfig?.readMoreLink ? handleReadMore : goBack}
          size="big"
          textColor={
            explainSheetConfig.secondaryButton?.textColor ??
            colors.blueGreyDark80
          }
          weight="heavy"
        />
      </Column>
    );
    const accentCta = (
      <SheetActionButton
        color={
          colors[explainSheetConfig.button?.bgColor] ||
          colors.alpha(colors.appleBlue, 0.04)
        }
        isTransparent
        label={explainSheetConfig.button?.label || lang.t('button.got_it')}
        onPress={
          explainSheetConfig.button?.onPress
            ? explainSheetConfig.button.onPress(navigate, goBack, handleClose)
            : handleClose
        }
        size="big"
        textColor={
          colors[explainSheetConfig.button?.textColor] || colors.appleBlue
        }
        weight="heavy"
      />
    );
    const buttonArray = [secondaryButton, accentCta];
    if (reverseButtons) {
      buttonArray.reverse();
    }
    return buttonArray;
  }, [
    colors,
    explainSheetConfig.button,
    explainSheetConfig?.readMoreLink,
    explainSheetConfig.secondaryButton?.bgColor,
    explainSheetConfig.secondaryButton?.label,
    explainSheetConfig.secondaryButton?.textColor,
    goBack,
    handleClose,
    handleReadMore,
    navigate,
    type,
  ]);

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
                  height: android ? 62 : 47,
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

            {explainSheetConfig.text && (
              <Text {...getBodyTextPropsWithColor(colors)}>
                {explainSheetConfig.text}
              </Text>
            )}

            {explainSheetConfig?.stillCurious &&
              explainSheetConfig.stillCurious}
            {buttons}
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(ExplainSheet);
