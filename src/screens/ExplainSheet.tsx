import { RouteProp, useRoute, NavigationProp } from '@react-navigation/native';
import * as lang from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { Centered, Column, ColumnWithMargins, Row, RowWithMargins } from '../components/layout';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { DoubleChevron } from '@/components/icons';
import { Box, Text as DSText, Separator } from '@/design-system';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, padding, position } from '@/styles';
import { ethereumUtils, gasUtils } from '@/utils';
import { buildRainbowLearnUrl, LearnUTMCampaign } from '@/utils/buildRainbowUrl';
import { cloudPlatformAccountName } from '@/utils/platform';
import { ThemeContextProps, useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import Routes from '@/navigation/routesNames';
import { DEVICE_HEIGHT } from '@/utils/deviceUtils';

import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { openInBrowser } from '@/utils/openInBrowser';
import { ChainId } from '@/state/backendNetworks/types';
import { ExplainSheetRouteParams, RootStackParamList } from '@/navigation/types';
import { logger } from '@/logger';

const { GAS_TRENDS } = gasUtils;
export const ExplainSheetHeight = IS_ANDROID ? 454 : 434;

const l = lang.l.explain;

type WithTheme<T> = T & { theme: ThemeContextProps };

type ButtonAction = (navigate: NavigationProp<RootStackParamList>['navigate'], goBack: () => void, handleClose: () => void) => void;

type ExplainSheetStillCuriousKeyPrefix =
  | 'insufficient_liquidity'
  | 'fee_on_transfer'
  | 'obtain_l2_asset'
  | 'swap_routing.still_curious'
  | 'slippage.still_curious';

interface ExplainSheetConfig {
  emoji?: string;
  title: string;
  text?: string | React.ReactNode;
  logo?: React.ReactNode;
  extraHeight?: number;
  readMoreLink?: string;
  stillCurious?: React.ReactNode;
  button?: {
    label: string;
    bgColor?: string;
    textColor?: string;
    onPress?: ButtonAction;
  };
  secondaryButton?: {
    label: string;
    bgColor?: string;
    textColor?: string;
    onPress?: ButtonAction;
  };
}

const getBodyTextPropsWithColor = (colors?: ThemeContextProps['colors']) =>
  colors
    ? {
        align: 'center' as const,
        color: colors.blueGreyDark60,
        lineHeight: 'looser' as const,
        size: 'large' as const,
        style: {
          alignSelf: 'center',
          maxWidth: 376,
          paddingBottom: 15,
          paddingHorizontal: 23,
        },
      }
    : {};

const GasTrendHeader = styled(Text).attrs(({ theme: { colors }, color }: WithTheme<{ color: string }>) => ({
  align: 'center',
  alignItems: 'center',
  color: color ?? colors.appleBlue,
  size: 'lmedium',
  weight: 'heavy',
}))({
  ...padding.object(IS_ANDROID ? 5 : 8, 12),
  borderColor: ({ theme: { colors }, color }: WithTheme<{ color: string }>) => colors.alpha(color ?? colors.appleBlue, 0.06),
  borderRadius: 20,
  borderWidth: 2,
  height: 40,
  marginBottom: 4,
});

type ContainerProps = {
  deviceHeight: number;
  height: number;
  insets: ReturnType<typeof useSafeAreaInsets>;
};

const Container = styled(Centered).attrs({ direction: 'column' })(({ deviceHeight, height }: ContainerProps) => ({
  ...position.coverAsObject,
  ...(height ? { height: height + deviceHeight } : {}),
}));

const SENDING_FUNDS_TO_CONTRACT = lang.t(l.sending_to_contract.text);
const FLOOR_PRICE_EXPLAINER = lang.t(l.floor_price.text);
const CURRENT_BASE_FEE_TITLE = lang.t(l.base_fee.title);
const BASE_CURRENT_BASE_FEE_EXPLAINER = lang.t(l.base_fee.text_prefix);
const CURRENT_BASE_FEE_EXPLAINER_STABLE = lang.t(l.base_fee.text_stable);
const CURRENT_BASE_FEE_EXPLAINER_FALLING = lang.t(l.base_fee.text_falling);
const CURRENT_BASE_FEE_EXPLAINER_RISING = lang.t(l.base_fee.text_rising);
const CURRENT_BASE_FEE_EXPLAINER_SURGING = lang.t(l.base_fee.text_surging);
const MAX_BASE_FEE_EXPLAINER = lang.t(l.max_base_fee.text);
const MINER_TIP_EXPLAINER = lang.t(l.miner_tip.text);
const BACKUP_EXPLAINER = lang.t(lang.l.back_up.explainers.backup, {
  cloudPlatformName: cloudPlatformAccountName,
});
const ENS_PRIMARY_NAME_EXPLAINER =
  'People will be able to type your .eth name into dApps instead of your full Ethereum address when they want to send something to you, and dApps will be able to use your .eth name and profile to display information about you. This is also known as setting your ENS name to "primary."';
const ENS_ON_CHAIN_DATA_WARNING_EXPLAINER =
  'The data you provide here will be stored on the Ethereum blockchain – meaning it will be visible to everyone and accessible by anyone. Do not share any data you are uncomfortable with publicizing.';
const ENS_ON_CHAIN_DATA_WARNING_TITLE = 'Heads up!';
const ENS_PRIMARY_NAME_TITLE = 'What does it mean to set my ENS name?';
const ENS_MANAGER_TITLE = `What is the .eth manager?`;
const ENS_MANAGER_EXPLAINER = `The manager of a .eth name is able to set and update its records, create subdomains of that name or manage its configuration. The manager is set by the owner of the .eth name and is also known as the ENS name's controller.`;
const ENS_OWNER_TITLE = `What is the .eth name owner?`;
const ENS_OWNER_EXPLAINER = `The owner of a .eth name has full and ultimate control over that name. They can transfer ownership of the name and allow someone else to manage the name for them if they choose (setting records etc). The owner is also known as the ENS name's registrant.`;
const ENS_RESOLVER_TITLE = `What is a .eth resolver?`;
const ENS_RESOLVER_EXPLAINER = `A resolver is a contract that maps from name to the resource (e.g., cryptocurrency addresses, content hash, etc). Resolvers are pointed to by the resolver field of the registry.`;
const ENS_CONFIGURATION_TITLE = 'What do these options mean?';
const ENS_CONFIGURATION_EXPLAINER =
  "When sending an ENS name to someone else and making them the new ENS name owner, you may want to configure it for them in advance and save them a future transaction. Rainbow allows you to clear any profile information currently set for the name, configure the ENS name to point to the recipient's address and make the recipient address the manager of the name.";

function getGasExplainerText(networkName: string): string {
  return lang.t(l.gas.text, { networkName });
}

function getAvailableNetworksExplainerText(tokenSymbol?: string, chainIds?: ChainId[]): string {
  if (!tokenSymbol || !chainIds || chainIds.length === 0) {
    return '';
  }
  const chainsLabel = useBackendNetworksStore.getState().getChainsLabel();
  const readableNetworks = chainIds.map(chainId => chainsLabel[chainId]).join(', ');
  return lang.t(l.available_networks.text, {
    tokenSymbol: tokenSymbol,
    networks: readableNetworks,
  });
}

export function getExplainSheetConfig(params: ExplainSheetRouteParams, theme?: ThemeContextProps): ExplainSheetConfig | null {
  const colors = theme?.colors;
  const chainsLabel = useBackendNetworksStore.getState().getChainsLabel();

  const buildLearnUrl = (path: string) =>
    buildRainbowLearnUrl({
      url: `https://learn.rainbow.me/${path}`,
      query: { campaign: LearnUTMCampaign.Explain },
    });

  const createStillCuriousLink = (
    textKeyPrefix: ExplainSheetStillCuriousKeyPrefix,
    urlPath: string,
    replacements?: Record<string, string | number>
  ) => (
    <Text {...getBodyTextPropsWithColor(colors)}>
      {lang.t(`explain.${textKeyPrefix}.fragment1`, replacements)}
      <Text
        color={colors?.appleBlue}
        onPress={() => openInBrowser(buildLearnUrl(urlPath))}
        size="large"
        suppressHighlighting
        weight="semibold"
      >
        {lang.t(`explain.${textKeyPrefix}.fragment2`, replacements)}
      </Text>
      {lang.t(`explain.${textKeyPrefix}.fragment3`, replacements)}
    </Text>
  );

  switch (params.type) {
    case 'network': {
      const { chainId } = params;
      const chainName = chainsLabel[chainId];
      let title = lang.t(`explain.default_network_explainer.title`, { chainName });
      let text = lang.t(`explain.default_network_explainer.text`, { chainName });
      try {
        title = lang.t(`explain.${chainName.toLowerCase()}.title`);
        text = lang.t(`explain.${chainName.toLowerCase()}.text`);
      } catch (e) {
        /* Do nothing, use defaults */
      }
      return {
        emoji: '⛽️',
        title,
        text,
        logo: <ChainImage chainId={chainId} size={40} position="relative" />,
        extraHeight: IS_ANDROID ? 120 : 144,
        readMoreLink: buildLearnUrl('layer-2-and-layer-3-networks'),
      };
    }
    case 'op_rewards_airdrop_timing':
      return {
        emoji: '📦',
        title: lang.t(lang.l.rewards.op.airdrop_timing.title),
        text: lang.t(lang.l.rewards.op.airdrop_timing.text),
        extraHeight: IS_ANDROID ? -65 : 10,
        readMoreLink: buildLearnUrl('OP-rewards-with-Rainbow'),
      };
    case 'op_rewards_amount_distributed':
      return {
        emoji: '💰',
        title: lang.t(lang.l.rewards.op.amount_distributed.title),
        text: lang.t(lang.l.rewards.op.amount_distributed.text),
        extraHeight: IS_ANDROID ? -110 : -65,
      };
    case 'op_rewards_bridge':
      return {
        emoji: '🌉',
        title: lang.t(lang.l.rewards.op.bridge.title, { percent: params.percent || 0 }),
        text: lang.t(lang.l.rewards.op.bridge.text, { percent: params.percent || 0 }),
        extraHeight: IS_ANDROID ? -65 : 10,
      };
    case 'op_rewards_swap':
      return {
        emoji: '🔀',
        title: lang.t(lang.l.rewards.op.swap.title, { percent: params.percent || 0 }),
        text: lang.t(lang.l.rewards.op.swap.text, { percent: params.percent || 0 }),
        extraHeight: IS_ANDROID ? -65 : 10,
      };
    case 'op_rewards_position':
      return {
        emoji: '🏆',
        title: lang.t(lang.l.rewards.op.position.title),
        text: lang.t(lang.l.rewards.op.position.text),
        extraHeight: IS_ANDROID ? -110 : -65,
      };
    case 'output_disabled': {
      const fromNetwork = params.fromChainId ? chainsLabel[params.fromChainId] : '';
      const toNetwork = params.toChainId ? chainsLabel[params.toChainId] : '';
      return {
        extraHeight: -30,
        title: params.inputToken
          ? lang.t(`explain.output_disabled.${params.isCrosschainSwap ? 'title_crosschain' : 'title'}`, {
              inputToken: params.inputToken,
              fromNetwork: fromNetwork,
            })
          : lang.t('explain.output_disabled.title_empty'),
        text: params.isCrosschainSwap
          ? lang.t(`explain.output_disabled.${params.isBridgeSwap ? 'text_bridge' : 'text_crosschain'}`, {
              inputToken: params.inputToken ?? '',
              outputToken: params.outputToken ?? '',
              fromNetwork: fromNetwork ?? '',
              toNetwork: toNetwork ?? '',
            })
          : lang.t('explain.output_disabled.text', {
              fromNetwork: fromNetwork ?? '',
              inputToken: params.inputToken ?? '',
              outputToken: params.outputToken ?? '',
            }),
        logo: params.fromChainId ? <ChainImage chainId={params.fromChainId} size={40} position="relative" /> : undefined,
      };
    }
    case 'floor_price':
      return {
        emoji: '📊',
        extraHeight: -102,
        text: FLOOR_PRICE_EXPLAINER,
        title: lang.t('explain.floor_price.title'),
      };
    case 'gas': {
      const networkName = chainsLabel[params.chainId];
      return {
        logo: (
          <RainbowCoinIcon
            chainId={params.chainId}
            color={params.nativeAsset?.colors?.primary || params.nativeAsset?.colors?.fallback || undefined}
            icon={params.nativeAsset?.icon_url || params.nativeAsset?.iconURL}
            symbol={params.nativeAsset?.symbol ?? ''}
          />
        ),
        extraHeight: 2,
        text: getGasExplainerText(networkName),
        title: lang.t('explain.gas.title', { networkName }),
      };
    }
    case 'ens_primary_name':
      return { extraHeight: 50, emoji: '❓', text: ENS_PRIMARY_NAME_EXPLAINER, title: ENS_PRIMARY_NAME_TITLE };
    case 'ens_manager':
      return { extraHeight: -30, emoji: '❓', text: ENS_MANAGER_EXPLAINER, title: ENS_MANAGER_TITLE };
    case 'ens_owner':
      return { extraHeight: 0, emoji: '❓', text: ENS_OWNER_EXPLAINER, title: ENS_OWNER_TITLE };
    case 'ens_resolver':
      return { extraHeight: -60, emoji: '❓', text: ENS_RESOLVER_EXPLAINER, title: ENS_RESOLVER_TITLE };
    case 'ens_configuration':
      return { extraHeight: IS_ANDROID ? 100 : 80, emoji: '❓', text: ENS_CONFIGURATION_EXPLAINER, title: ENS_CONFIGURATION_TITLE };
    case 'ensOnChainDataWarning':
      return { extraHeight: -30, emoji: '✋', text: ENS_ON_CHAIN_DATA_WARNING_EXPLAINER, title: ENS_ON_CHAIN_DATA_WARNING_TITLE };
    case 'currentBaseFeeStable':
      return {
        emoji: '🌞',
        extraHeight: IS_ANDROID ? 42 : 28,
        text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_STABLE,
        title: CURRENT_BASE_FEE_TITLE,
      };
    case 'currentBaseFeeFalling':
      return {
        emoji: '📉',
        extraHeight: IS_ANDROID ? 22 : 2,
        text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_FALLING,
        title: CURRENT_BASE_FEE_TITLE,
      };
    case 'currentBaseFeeRising':
      return {
        emoji: '🥵',
        extraHeight: IS_ANDROID ? 62 : 54,
        text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_RISING,
        title: CURRENT_BASE_FEE_TITLE,
      };
    case 'currentBaseFeeSurging':
      return {
        emoji: '🎢',
        extraHeight: IS_ANDROID ? 102 : 54,
        text: BASE_CURRENT_BASE_FEE_EXPLAINER + CURRENT_BASE_FEE_EXPLAINER_SURGING,
        title: CURRENT_BASE_FEE_TITLE,
      };
    case 'currentBaseFeeNotrend':
      return { emoji: '⛽', extraHeight: IS_ANDROID ? -18 : -40, text: BASE_CURRENT_BASE_FEE_EXPLAINER, title: CURRENT_BASE_FEE_TITLE };
    case 'maxBaseFee':
      return { emoji: '📈', extraHeight: -31, text: MAX_BASE_FEE_EXPLAINER, title: lang.t('explain.max_base_fee.title') };
    case 'minerTip':
      return { emoji: '⛏', extraHeight: -31, text: MINER_TIP_EXPLAINER, title: lang.t('explain.miner_tip.title') };
    case 'sending_funds_to_contract':
      return { emoji: '✋', extraHeight: 80, text: SENDING_FUNDS_TO_CONTRACT, title: lang.t('explain.sending_to_contract.title') };
    case 'unverified': {
      const { asset } = params;
      const handlePress = () => {
        if ('address' in asset && asset?.address && asset?.chainId) {
          ethereumUtils.openTokenEtherscanURL({ address: asset.address, chainId: asset.chainId });
        }
      };

      const symbol = ('symbol' in asset ? asset.symbol : asset.familyName) ?? '';
      return {
        extraHeight: 120,
        emoji: '⚠️',
        button: {
          label: lang.t('button.continue'),
          bgColor: colors?.alpha(colors?.blueGreyDark80, 0.04),
          textColor: colors?.blueGreyDark80,
        },
        secondaryButton: { label: lang.t('button.go_back_lowercase'), textColor: colors?.appleBlue, bgColor: colors?.clearBlue },
        title: lang.t('explain.unverified.title', { symbol }),
        stillCurious: (
          <Text {...getBodyTextPropsWithColor(colors)}>
            {lang.t('explain.unverified.fragment1')}
            <Text color={colors?.appleBlue} onPress={handlePress} size="large" suppressHighlighting weight="semibold">
              {lang.t('explain.unverified.fragment2')}
            </Text>
            {lang.t('explain.unverified.fragment3')}
          </Text>
        ),
      };
    }
    case 'failed_wc_connection':
      return { emoji: '😵', extraHeight: -50, text: lang.t(l.failed_walletconnect.text), title: lang.t(l.failed_walletconnect.title) };
    case 'failed_wc_invalid_methods':
      return {
        emoji: '😵',
        extraHeight: -100,
        text: lang.t(l.failed_wc_invalid_methods.text),
        title: lang.t(l.failed_wc_invalid_methods.title),
      };
    case 'failed_wc_invalid_chains':
      return {
        emoji: '😵',
        extraHeight: -100,
        text: lang.t(l.failed_wc_invalid_chains.text),
        title: lang.t(l.failed_wc_invalid_chains.title),
      };
    case 'failed_wc_invalid_chain':
      return {
        emoji: '😵',
        extraHeight: -100,
        text: lang.t(l.failed_wc_invalid_chain.text),
        title: lang.t(l.failed_wc_invalid_chain.title),
      };
    case 'backup':
      return { emoji: '🔐', extraHeight: 20, text: BACKUP_EXPLAINER, title: lang.t(l.backup.title) };
    case 'rainbow_fee':
      return {
        emoji: '🌈',
        extraHeight: -100,
        text: lang.t(l.rainbow_fee.text, { feePercentage: params.feePercentage ?? 0 }),
        title: 'Rainbow Fee',
      };
    case 'f2cSemiSupportedAssetPurchased':
      return {
        emoji: '🎉',
        title: lang.t(lang.l.wallet.add_cash_v2.explain_sheet.semi_supported.title),
        text: lang.t(lang.l.wallet.add_cash_v2.explain_sheet.semi_supported.text),
        extraHeight: -80,
      };
    case 'insufficientLiquidity':
      return {
        extraHeight: -20,
        emoji: '🏦',
        title: lang.t('explain.insufficient_liquidity.title'),
        stillCurious: createStillCuriousLink('insufficient_liquidity', 'a-beginners-guide-to-liquidity-providing'),
      };
    case 'feeOnTransfer':
      return {
        extraHeight: -70,
        logo: (
          <RowWithMargins justify="center" margin={35} marginBottom={10}>
            <RainbowCoinIcon
              chainId={params.inputCurrency.chainId}
              color={params.inputCurrency?.colors?.primary || params.inputCurrency?.colors?.fallback || undefined}
              icon={params.inputCurrency?.icon_url}
              symbol={params.inputCurrency.symbol}
            />
          </RowWithMargins>
        ),
        title: lang.t('explain.fee_on_transfer.title'),
        stillCurious: createStillCuriousLink('fee_on_transfer', 'fee-on-transfer-tokens', {
          tokenName: params.inputCurrency?.symbol ?? '',
        }),
      };
    case 'noRouteFound':
      return {
        extraHeight: -90,
        emoji: '🚧',
        title: lang.t('explain.no_route_found.title'),
        stillCurious: (
          <>
            <Text {...getBodyTextPropsWithColor(colors)}>{lang.t(l.no_route_found.fragment1)}</Text>
            <Text {...getBodyTextPropsWithColor(colors)}>{lang.t(l.no_route_found.fragment2)}</Text>
          </>
        ),
      };
    case 'noQuote':
      return {
        extraHeight: -90,
        emoji: '🏦',
        title: lang.t(l.no_quote.title),
        text: lang.t(l.no_quote.text),
        logo: (
          <RowWithMargins justify="center" margin={35} marginBottom={10}>
            {params.inputCurrency && (
              <RainbowCoinIcon
                chainId={params.inputCurrency.chainId}
                color={params.inputCurrency.colors?.primary || params.inputCurrency.colors?.fallback || undefined}
                icon={params.inputCurrency.icon_url}
                symbol={params.inputCurrency.symbol}
              />
            )}
            <DoubleChevron />
            {params.outputCurrency && (
              <RainbowCoinIcon
                chainId={params.outputCurrency.chainId}
                color={params.outputCurrency.colors?.primary || params.outputCurrency.colors?.fallback || undefined}
                icon={params.outputCurrency.icon_url}
                symbol={params.outputCurrency.symbol}
              />
            )}
          </RowWithMargins>
        ),
      };
    case 'crossChainGas':
      return {
        extraHeight: 40,
        title: lang.t(l.cross_chain_swap.title),
        text: lang.t(l.cross_chain_swap.text),
        logo: (
          <RowWithMargins justify="center" margin={35} marginBottom={10}>
            {params.inputCurrency && (
              <RainbowCoinIcon
                chainId={params.inputCurrency.chainId}
                color={params.inputCurrency.colors?.primary || params.inputCurrency.colors?.fallback || undefined}
                icon={params.inputCurrency.icon_url}
                symbol={params.inputCurrency.symbol}
              />
            )}
            <DoubleChevron />
            {params.outputCurrency && (
              <RainbowCoinIcon
                chainId={params.outputCurrency.chainId}
                color={params.outputCurrency.colors?.primary || params.outputCurrency.colors?.fallback || undefined}
                icon={params.outputCurrency.icon_url}
                symbol={params.outputCurrency.symbol}
              />
            )}
          </RowWithMargins>
        ),
      };
    case 'availableNetworks': {
      const { tokenSymbol, chainIds } = params;
      const safeChainIds = chainIds ?? [];
      return {
        extraHeight: -90,
        text: getAvailableNetworksExplainerText(tokenSymbol, safeChainIds),
        title:
          safeChainIds.length > 1
            ? lang.t('explain.available_networks.title_plural', { length: safeChainIds.length })
            : lang.t('explain.available_networks.title_singular', { network: safeChainIds.length > 0 ? chainsLabel[safeChainIds[0]] : '' }),
        logo: (
          <Row justify="center" marginBottom={10}>
            {safeChainIds.map((id, index) => (
              <Box
                height={{ custom: 40 }}
                key={`chainId-${id}`}
                marginLeft={{ custom: index > 0 ? -12 : safeChainIds.length % 2 === 0 ? -2 : -30 }}
                style={{ borderColor: colors?.transparent, borderRadius: 0, borderWidth: 1, zIndex: index }}
                width={{ custom: 40 }}
                zIndex={safeChainIds.length - index}
              >
                <ChainImage chainId={id} size={40} position="relative" />
              </Box>
            ))}
          </Row>
        ),
      };
    }
    case 'obtainL2Assets': {
      const networkName = params.networkName ?? '';
      return {
        extraHeight: 40,
        button: {
          label: lang.t('explain.go_to_hop_with_icon.text'),
          bgColor: colors?.alpha(colors?.blueGreyDark80, 0.04),
          textColor: colors?.blueGreyDark80,
        },
        secondaryButton: {
          label: lang.t('button.go_back_lowercase'),
          textColor: colors?.appleBlue,
          bgColor: colors?.clearBlue,
        },
        stillCurious: createStillCuriousLink('obtain_l2_asset', 'layer-2-and-layer-3-networks', {
          networkName,
          tokenName: params.assetName ?? '',
        }),
        logo: <ChainImage chainId={params.chainId} size={40} position="relative" />,
        title: lang.t(l.obtain_l2_asset.title, { networkName }),
      };
    }
    case 'routeSwaps':
      return {
        extraHeight: IS_ANDROID ? 20 : 0,
        emoji: '🔀',
        stillCurious: createStillCuriousLink('swap_routing.still_curious', 'swap-with-confidence-with-rainbow'),
        text: lang.t(l.swap_routing.text),
        title: lang.t(l.swap_routing.title),
      };
    case 'slippage':
      return {
        extraHeight: 126,
        emoji: '🌊',
        stillCurious: (
          <Text {...getBodyTextPropsWithColor(colors)}>
            {lang.t(l.slippage.still_curious.fragment1)}
            <Text
              color={colors?.appleBlue}
              onPress={() => openInBrowser('https://academy.shrimpy.io/post/what-is-slippage-how-to-avoid-slippage-on-defi-exchanges')}
              size="large"
              suppressHighlighting
              weight="semibold"
            >
              {lang.t(l.slippage.still_curious.fragment2)}
            </Text>
            {lang.t(l.slippage.still_curious.fragment3)}
          </Text>
        ),
        text: lang.t(l.slippage.text),
        title: lang.t(l.slippage.title),
      };
    case 'token_allocation': {
      const { sections } = params;
      return {
        extraHeight: 144,
        emoji: '💸',
        title: lang.t(lang.l.token_launcher.titles.token_allocation_breakdown),
        button: {
          label: lang.t(lang.l.token_launcher.buttons.got_it),
          bgColor: 'rgba(38, 143, 255, 0.06)',
          textColor: '#268FFF',
        },
        stillCurious: (
          <Box paddingVertical="24px" paddingHorizontal="20px" gap={24} justifyContent="center" alignItems="center" style={{ flex: 1 }}>
            {sections?.map((section, index) => (
              <React.Fragment key={section.title}>
                <Box alignItems="center" justifyContent="center" gap={12} style={{ marginBottom: 8 }}>
                  <Box flexDirection="row" alignItems="center" gap={2}>
                    <DSText color="label" size="17pt" weight="semibold">
                      {section.title}
                    </DSText>
                    <DSText color="labelQuaternary" size="15pt" weight="medium">
                      ·
                    </DSText>
                    <DSText color="label" size="17pt" weight="semibold">
                      {section.value}
                    </DSText>
                  </Box>
                  <DSText color="labelQuaternary" size="17pt" weight="medium">
                    {section.description}
                  </DSText>
                </Box>
                {index < sections.length - 1 && (
                  <Box width="full">
                    <Separator color="separatorSecondary" />
                  </Box>
                )}
              </React.Fragment>
            ))}
          </Box>
        ),
      };
    }
    default:
      logger.warn(`[ExplainSheet]: Unhandled type "${params.type}"`);
      return null;
  }
}

const ExplainSheet = () => {
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.EXPLAIN_SHEET>>();

  const theme = useTheme();
  const { goBack, navigate } = useNavigation();

  const explainSheetConfig = useMemo(() => {
    return getExplainSheetConfig(params, theme);
  }, [params, theme]);

  const renderBaseFeeIndicator = useMemo(() => {
    if (
      params.type === 'currentBaseFeeStable' ||
      params.type === 'currentBaseFeeFalling' ||
      params.type === 'currentBaseFeeRising' ||
      params.type === 'currentBaseFeeSurging' ||
      params.type === 'currentBaseFeeNotrend'
    ) {
      const { currentGasTrend, currentBaseFee } = params;
      const trendInfo = GAS_TRENDS[currentGasTrend];
      if (!trendInfo) return null;
      const { color, label } = trendInfo;
      const baseFeeLabel = label ? `${label} ·` : '';
      return (
        <Centered>
          <GasTrendHeader color={color}>{`${baseFeeLabel} ${currentBaseFee}`}</GasTrendHeader>
        </Centered>
      );
    }
    return null;
  }, [params]);

  const handleClose = useCallback(() => {
    goBack();
    params.onClose?.();
  }, [goBack, params]);

  const handleReadMore = useCallback(() => {
    if (explainSheetConfig?.readMoreLink) {
      openInBrowser(explainSheetConfig.readMoreLink);
    }
  }, [explainSheetConfig?.readMoreLink]);

  const sheetHeight = ExplainSheetHeight + (explainSheetConfig?.extraHeight || 0);

  const buttons = useMemo(() => {
    const reverseButtons = params.type === 'obtainL2Assets' || params.type === 'unverified';

    const onSecondaryPress = () => {
      if (explainSheetConfig?.secondaryButton?.onPress) {
        return explainSheetConfig.secondaryButton.onPress(navigate, goBack, handleClose);
      }
      if (explainSheetConfig?.readMoreLink) {
        return handleReadMore();
      }
      return goBack();
    };

    const onPrimaryPress = () => {
      if (explainSheetConfig?.button?.onPress) {
        return explainSheetConfig.button.onPress(navigate, goBack, handleClose);
      }
      handleClose();
    };

    const secondaryButtonLabel =
      explainSheetConfig?.secondaryButton?.label || (explainSheetConfig?.readMoreLink ? lang.t('explain.read_more') : undefined);

    const secondaryButton = secondaryButtonLabel && (
      <Column height={60} style={IS_ANDROID && reverseButtons ? { marginTop: 16 } : undefined}>
        <SheetActionButton
          color={explainSheetConfig?.secondaryButton?.bgColor ?? theme.colors.blueGreyDarkLight}
          isTransparent
          label={secondaryButtonLabel}
          onPress={onSecondaryPress}
          size="big"
          textColor={explainSheetConfig?.secondaryButton?.textColor ?? theme.colors.blueGreyDark80}
          weight="heavy"
        />
      </Column>
    );

    const accentCta = (
      <SheetActionButton
        color={explainSheetConfig?.button?.bgColor || theme.colors.alpha(theme.colors.appleBlue, 0.04)}
        isTransparent
        label={explainSheetConfig?.button?.label || lang.t('button.got_it')}
        onPress={onPrimaryPress}
        size="big"
        textColor={explainSheetConfig?.button?.textColor ?? theme.colors.appleBlue}
        weight="heavy"
        testID={'explainer-sheet-accent'}
        marginBottom={params.type === 'token_allocation' ? insets.bottom : 0}
      />
    );

    const buttonArray = [secondaryButton, accentCta].filter(Boolean);
    if (reverseButtons) {
      buttonArray.reverse();
    }
    return buttonArray;
  }, [theme.colors, explainSheetConfig, params.type, goBack, handleClose, handleReadMore, navigate, insets.bottom]);

  if (!explainSheetConfig) {
    return null;
  }

  return (
    <Container deviceHeight={DEVICE_HEIGHT} height={sheetHeight} insets={insets}>
      <SlackSheet additionalTopPadding={IS_ANDROID} contentHeight={sheetHeight} scrollEnabled={false}>
        <Centered direction="column" height={sheetHeight} testID={`explain-sheet-${params.type}`} width="100%">
          <ColumnWithMargins
            margin={15}
            style={{
              height: sheetHeight,
              padding: 19,
              width: '100%',
            }}
          >
            {explainSheetConfig.logo ? (
              <Centered>{explainSheetConfig.logo}</Centered>
            ) : explainSheetConfig.emoji ? (
              typeof explainSheetConfig.emoji === 'string' ? (
                <Emoji
                  align="center"
                  size="h1"
                  style={{
                    ...fontWithWidth(fonts.weight.bold),
                    height: IS_ANDROID ? 62 : 47,
                  }}
                >
                  {explainSheetConfig.emoji}
                </Emoji>
              ) : (
                <Emoji
                  align="center"
                  size="h1"
                  style={{
                    ...fontWithWidth(fonts.weight.bold),
                    height: IS_ANDROID ? 62 : 47,
                  }}
                >
                  {lang.t('explain.verified.title')}
                </Emoji>
              )
            ) : null}

            <SheetTitle align="center" lineHeight="big" size={fonts.size.big} weight="heavy">
              {explainSheetConfig.title}
            </SheetTitle>

            {renderBaseFeeIndicator}

            {explainSheetConfig.text && typeof explainSheetConfig.text === 'string' ? (
              <Text {...getBodyTextPropsWithColor(theme.colors)}>{explainSheetConfig.text}</Text>
            ) : (
              explainSheetConfig.text
            )}

            {explainSheetConfig.stillCurious}

            {buttons}
          </ColumnWithMargins>
        </Centered>
      </SlackSheet>
    </Container>
  );
};

export default React.memo(ExplainSheet);
