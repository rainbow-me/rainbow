import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChainBadge, CoinIcon, DashedWrapper } from '../components/coin-icon';
import {
  Centered,
  Column,
  ColumnWithMargins,
  Row,
  RowWithMargins,
} from '../components/layout';
import Routes from '@/navigation/routesNames';
import { SheetActionButton, SheetTitle, SlackSheet } from '../components/sheet';
import { Emoji, GradientText, Text } from '../components/text';
import { useNavigation } from '../navigation/Navigation';
import { DoubleChevron } from '@/components/icons';
import { AccentColorProvider, Box } from '@/design-system';
import AppIconGoldDoge from '@/assets/appIconGoldDoge.png';
import AppIconRainDoge from '@/assets/appIconRainDoge.png';
import AppIconOptimism from '@/assets/appIconOptimism.png';
import AppIconPooly from '@/assets/appIconPooly.png';
import AppIconFiniliar from '@/assets/appIconFiniliar.png';
import AppIconSmol from '@/assets/appIconSmol.png';
import AppIconZora from '@/assets/appIconZora.png';
import AppIconZorb from '@/assets/appIconZorb.png';
import AppIconPoolboy from '@/assets/appIconPoolboy.png';
import TheMergePng from '@/assets/theMerge.png';
import networkTypes from '@/helpers/networkTypes';
import { delay, toFixedDecimals } from '@/helpers/utilities';
import { useDimensions } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import styled from '@/styled-thing';
import { fonts, fontWithWidth, padding, position } from '@/styles';
import { ethereumUtils, gasUtils, getTokenMetadata } from '@/utils';
import { buildRainbowLearnUrl } from '@/utils/buildRainbowUrl';
import { cloudPlatformAccountName } from '@/utils/platform';
import { useTheme } from '@/theme';
import { isL2Network } from '@/handlers/web3';
import { IS_ANDROID } from '@/env';
import * as i18n from '@/languages';
import { getNetworkObj } from '@/networks';

const { GAS_TRENDS } = gasUtils;
const APP_ICON_SIZE = 64;
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
  color: color ?? colors.appleBlue,
  size: 'lmedium',
  weight: 'heavy',
}))({
  ...padding.object(IS_ANDROID ? 5 : 8, 12),
  borderColor: ({ theme: { colors }, color }) =>
    colors.alpha(color ?? colors.appleBlue, 0.06),
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
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.optimismRed}>
      <Box
        as={ImgixImage}
        source={AppIconOptimism}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const FiniliarAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.finiliarPink}>
      <Box
        as={ImgixImage}
        source={AppIconFiniliar}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const GoldDogeAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.dogeGold}>
      <Box
        as={ImgixImage}
        source={AppIconGoldDoge}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const RainDogeAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.dogeGold}>
      <Box
        as={ImgixImage}
        source={AppIconRainDoge}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const PoolyAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.poolyPurple}>
      <Box
        as={ImgixImage}
        source={AppIconPooly}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const SmolAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.smolPurple}>
      <Box
        as={ImgixImage}
        source={AppIconSmol}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const ZoraAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.rainbowBlue}>
      <Box
        as={ImgixImage}
        source={AppIconZora}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
      />
    </AccentColorProvider>
  );
};

const ZorbAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.zorbPink}>
      <Box
        as={ImgixImage}
        source={AppIconZorb}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
        borderRadius={14}
      />
    </AccentColorProvider>
  );
};

const PoolboyAppIcon = () => {
  const { colors } = useTheme();
  return (
    <AccentColorProvider color={colors.poolboyPink}>
      <Box
        as={ImgixImage}
        source={AppIconPoolboy}
        size={APP_ICON_SIZE}
        width={{ custom: APP_ICON_SIZE }}
        height={{ custom: APP_ICON_SIZE }}
        shadow="18px accent"
        borderRadius={14}
      />
    </AccentColorProvider>
  );
};

const TheMergeIcon = () => {
  return (
    <Box
      style={{
        marginVertical: 10,
      }}
    >
      <ImgixImage
        size={50}
        source={TheMergePng}
        style={{
          width: 53,
          height: 50,
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
    ?.map(network => getNetworkObj(network).name)
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

const BSC_EXPLAINER = lang.t('explain.bsc.text');

const BASE_EXPLAINER = lang.t('explain.base.text');

const ZORA_EXPLAINER = lang.t('explain.zora.text');

const SWAP_RESET_EXPLAINER = `Rainbow doesn’t have the ability to swap across networks yet, but we’re on it. For now, Rainbow will match networks between selected tokens.`;

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

const ENS_RESOLVER_TITLE = `What is a .eth resolver?`;

const ENS_RESOLVER_EXPLAINER = `A resolver is a contract that maps from name to the resource (e.g., cryptocurrency addresses, content hash, etc). Resolvers are pointed to by the resolver field of the registry.`;

const ENS_CONFIGURATION_TITLE = 'What do these options mean?';

const ENS_CONFIGURATION_EXPLAINER =
  'When sending an ENS name to someone else and making them the new ENS name owner, you may want to configure it for them in advance and save them a future transaction. Rainbow allows you to clear any profile information currently set for the name, configure the ENS name to point to the recipient’s address and make the recipient address the manager of the name.';

const OPTIMISM_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.optimism_text');

const GOLDDOGE_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.golddoge_text');

const RAINDOGE_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.raindoge_text');

const SMOL_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.smol_text');

const ZORA_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.zora_text');

const POOLY_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.pooly_text');

const POOLY_APP_ICON_TITLE = lang.t('explain.icon_unlock.pooly_title');

const FINILIAR_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.finiliar_text');

const FINILIAR_APP_ICON_TITLE = lang.t('explain.icon_unlock.finiliar_title');

const ZORB_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.zorb_text');

const ZORB_APP_ICON_TITLE = lang.t('explain.icon_unlock.zorb_title');

const POOLBOY_APP_ICON_EXPLAINER = lang.t('explain.icon_unlock.poolboy_text');

const POOLBOY_APP_ICON_TITLE = lang.t('explain.icon_unlock.poolboy_title');

const navigateToAppIconSettings = async (navigate, goBack) => {
  goBack();
  navigate(Routes.SETTINGS_SHEET);
  await delay(500);
  navigate(Routes.SETTINGS_SHEET, { screen: 'AppIconSection' });
};

export const explainers = (params, colors) => ({
  op_rewards_airdrop_timing: {
    emoji: '📦',
    title: i18n.t(i18n.l.rewards.op.airdrop_timing.title),
    text: i18n.t(i18n.l.rewards.op.airdrop_timing.text),
    extraHeight: IS_ANDROID ? -65 : 10,
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/OP-rewards-with-Rainbow',
      query: {
        campaign: 'explain',
      },
    }),
  },
  op_rewards_amount_distributed: {
    emoji: '💰',
    title: i18n.t(i18n.l.rewards.op.amount_distributed.title),
    text: i18n.t(i18n.l.rewards.op.amount_distributed.text),
    extraHeight: IS_ANDROID ? -110 : -65,
  },
  op_rewards_bridge: {
    emoji: '🌉',
    title: i18n.t(i18n.l.rewards.op.bridge.title),
    text: i18n.t(i18n.l.rewards.op.bridge.text),
    extraHeight: IS_ANDROID ? -65 : 10,
  },
  op_rewards_swap: {
    emoji: '🔀',
    title: i18n.t(i18n.l.rewards.op.swap.title),
    text: i18n.t(i18n.l.rewards.op.swap.text),
    extraHeight: IS_ANDROID ? -65 : 10,
  },
  op_rewards_position: {
    emoji: '🏆',
    title: i18n.t(i18n.l.rewards.op.position.title),
    text: i18n.t(i18n.l.rewards.op.position.text),
    extraHeight: IS_ANDROID ? -110 : -65,
  },
  optimism_app_icon: {
    logo: <OptimismAppIcon />,
    extraHeight: -35,
    text: OPTIMISM_APP_ICON_EXPLAINER,
    title: lang.t('explain.icon_unlock.title', { partner: 'Optimism' }),
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.optimismRed,
      bgColor: colors?.optimismRed06,
    },
  },
  finiliar_app_icon: {
    logo: <FiniliarAppIcon />,
    extraHeight: -90,
    text: FINILIAR_APP_ICON_EXPLAINER,
    title: FINILIAR_APP_ICON_TITLE,
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.finiliarPink,
      bgColor: colors?.finiliarPink06,
    },
  },
  golddoge_app_icon: {
    logo: <GoldDogeAppIcon />,
    extraHeight: -65,
    text: GOLDDOGE_APP_ICON_EXPLAINER,
    title: lang.t('explain.icon_unlock.title', { partner: 'DOGE' }),
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.dogeGold,
      bgColor: colors?.dogeGold06,
    },
  },
  raindoge_app_icon: {
    logo: <RainDogeAppIcon />,
    extraHeight: -65,
    text: RAINDOGE_APP_ICON_EXPLAINER,
    title: lang.t('explain.icon_unlock.title', { partner: 'The Doge NFT' }),
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.dogeGold,
      bgColor: colors?.dogeGold06,
    },
  },
  pooly_app_icon: {
    logo: <PoolyAppIcon />,
    extraHeight: -90,
    text: POOLY_APP_ICON_EXPLAINER,
    title: POOLY_APP_ICON_TITLE,
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.poolyPurple,
      bgColor: colors?.poolyPurple06,
    },
  },
  smol_app_icon: {
    logo: <SmolAppIcon />,
    extraHeight: -65,
    text: SMOL_APP_ICON_EXPLAINER,
    title: lang.t('explain.icon_unlock.title', { partner: 'SMOL' }),
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.smolPurple,
      bgColor: colors?.smolPurple06,
    },
  },
  zora_app_icon: {
    logo: <ZoraAppIcon />,
    extraHeight: -90,
    text: ZORA_APP_ICON_EXPLAINER,
    title: lang.t('explain.icon_unlock.title', { partner: 'Zora' }),
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.appleBlue,
      bgColor: colors?.appleBlue06,
    },
  },
  zorb_app_icon: {
    logo: <ZorbAppIcon />,
    extraHeight: -65,
    text: ZORB_APP_ICON_EXPLAINER,
    title: ZORB_APP_ICON_TITLE,
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.zorbPink,
      bgColor: colors?.zorbPink06,
    },
  },
  poolboy_app_icon: {
    logo: <PoolboyAppIcon />,
    extraHeight: -90,
    text: POOLBOY_APP_ICON_EXPLAINER,
    title: POOLBOY_APP_ICON_TITLE,
    button: {
      onPress: navigateToAppIconSettings,
      label: lang.t('explain.icon_unlock.button'),
      textColor: colors?.poolboyPink,
      bgColor: colors?.poolboyPink06,
    },
  },
  output_disabled: {
    extraHeight: -30,
    title: params?.inputToken
      ? lang.t(
          `explain.output_disabled.${
            params?.isCrosschainSwap ? 'title_crosschain' : 'title'
          }`,
          {
            inputToken: params?.inputToken,
            fromNetwork: getNetworkObj(params?.fromNetwork).name,
          }
        )
      : lang.t('explain.output_disabled.title_empty'),

    text: params?.isCrosschainSwap
      ? lang.t(
          `explain.output_disabled.${
            params?.isBridgeSwap ? 'text_bridge' : 'text_crosschain'
          }`,
          {
            inputToken: params?.inputToken,
            outputToken: params?.outputToken,
            fromNetwork: getNetworkObj(params?.fromNetwork).name,
            toNetwork: getNetworkObj(params?.toNetwork).name,
          }
        )
      : lang.t('explain.output_disabled.text', {
          fromNetwork: getNetworkObj(params?.fromNetwork)?.name,
          inputToken: params?.inputToken,
          outputToken: params?.outputToken,
        }),
    logo: !isL2Network(params?.fromNetwork) ? (
      <CoinIcon address={ETH_ADDRESS} size={40} symbol={ETH_SYMBOL} />
    ) : (
      <ChainBadge
        assetType={params?.fromNetwork}
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
  ens_resolver: {
    extraHeight: -60,
    emoji: '❓',
    text: ENS_RESOLVER_EXPLAINER,
    title: ENS_RESOLVER_TITLE,
  },
  ens_configuration: {
    extraHeight: android ? 100 : 80,
    emoji: '❓',
    text: ENS_CONFIGURATION_EXPLAINER,
    title: ENS_CONFIGURATION_TITLE,
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
      bgColor: colors?.alpha(colors?.blueGreyDark80, 0.04),
      textColor: colors?.blueGreyDark80,
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
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
      query: {
        campaign: 'explain',
      },
    }),
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
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
      query: {
        campaign: 'explain',
      },
    }),
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
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
      query: {
        campaign: 'explain',
      },
    }),
    text: POLYGON_EXPLAINER,
    title: lang.t('explain.polygon.title'),
  },
  bsc: {
    emoji: '⛽️',
    extraHeight: IS_ANDROID ? 120 : 160,
    logo: (
      <ChainBadge
        assetType={networkTypes.bsc}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
      query: {
        campaign: 'explain',
      },
    }),
    text: BSC_EXPLAINER,
    title: lang.t('explain.bsc.title'),
  },
  zora: {
    emoji: '⛽️',
    extraHeight: 144,
    logo: (
      <ChainBadge
        assetType={networkTypes.zora}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
      query: {
        campaign: 'explain',
      },
    }),
    text: ZORA_EXPLAINER,
    title: lang.t('explain.zora.title'),
  },
  base: {
    emoji: '⛽️',
    extraHeight: 144,
    logo: (
      <ChainBadge
        assetType={networkTypes.base}
        marginBottom={8}
        position="relative"
        size="large"
      />
    ),
    readMoreLink: buildRainbowLearnUrl({
      url: 'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
      query: {
        campaign: 'explain',
      },
    }),
    text: BASE_EXPLAINER,
    title: lang.t('explain.base.title'),
  },
  failed_wc_connection: {
    emoji: '😵',
    extraHeight: -50,
    text: lang.t('explain.failed_walletconnect.text'),
    title: lang.t('explain.failed_walletconnect.title'),
  },
  failed_wc_invalid_methods: {
    emoji: '😵',
    extraHeight: -100,
    text: lang.t('explain.failed_wc_invalid_methods.text'),
    title: lang.t('explain.failed_wc_invalid_methods.title'),
  },
  failed_wc_invalid_chains: {
    emoji: '😵',
    extraHeight: -100,
    text: lang.t('explain.failed_wc_invalid_chains.text'),
    title: lang.t('explain.failed_wc_invalid_chains.title'),
  },
  failed_wc_invalid_chain: {
    emoji: '😵',
    extraHeight: -100,
    text: lang.t('explain.failed_wc_invalid_chain.text'),
    title: lang.t('explain.failed_wc_invalid_chain.title'),
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
      label: `Continue with ${getNetworkObj(params?.network)?.name}`,
      bgColor:
        colors?.networkColors[params?.network] &&
        colors?.alpha(colors?.networkColors[params?.network], 0.06),
      textColor:
        colors?.networkColors[params?.network] &&
        colors?.networkColors?.[params?.network],
    },
    emoji: '🔐',
    extraHeight: -90,
    text: SWAP_RESET_EXPLAINER,
    title: `Switching to ${getNetworkObj(params?.network)?.name}`,
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
  f2cSemiSupportedAssetPurchased: {
    emoji: '🎉',
    title: i18n.t(i18n.l.wallet.add_cash_v2.explain_sheet.semi_supported.title),
    text: i18n.t(i18n.l.wallet.add_cash_v2.explain_sheet.semi_supported.title),
    extraHeight: -80,
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
              buildRainbowLearnUrl({
                url:
                  'https://learn.rainbow.me/a-beginners-guide-to-liquidity-providing',
                query: {
                  campaign: 'explain',
                },
              })
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
  noRouteFound: {
    extraHeight: -90,
    emoji: '🚧',
    title: lang.t('explain.no_route_found.title'),
    stillCurious: (
      <>
        <Text {...getBodyTextPropsWithColor(colors)}>
          {lang.t('explain.no_route_found.fragment1')}
        </Text>
        <Text {...getBodyTextPropsWithColor(colors)}>
          {lang.t('explain.no_route_found.fragment2')}
        </Text>
      </>
    ),
  },
  noQuote: {
    extraHeight: -90,
    emoji: '🏦',
    title: lang.t('explain.no_quote.title'),
    text: lang.t('explain.no_quote.text'),
    logo: (
      <RowWithMargins justify="center" margin={35} marginBottom={10}>
        <CoinIcon size={40} {...params?.inputCurrency} />
        <DoubleChevron />
        <CoinIcon size={40} {...params?.outputCurrency} />
      </RowWithMargins>
    ),
  },
  crossChainGas: {
    extraHeight: 40,
    title: lang.t('explain.cross_chain_swap.title'),
    text: lang.t('explain.cross_chain_swap.text'),
    logo: (
      <RowWithMargins justify="center" margin={35} marginBottom={10}>
        <CoinIcon size={40} {...params?.inputCurrency} />
        <DoubleChevron />
        <CoinIcon size={40} {...params?.outputCurrency} />
      </RowWithMargins>
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
      bgColor: colors?.alpha(colors?.blueGreyDark80, 0.04),
      textColor: colors?.blueGreyDark80,
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
              buildRainbowLearnUrl({
                url:
                  'https://learn.rainbow.me/a-beginners-guide-to-layer-2-networks',
                query: {
                  campaign: 'explain',
                },
              })
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
              buildRainbowLearnUrl({
                url:
                  'https://learn.rainbow.me/protecting-transactions-with-flashbots',
                query: {
                  campaign: 'explain',
                },
              })
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
              buildRainbowLearnUrl({
                url:
                  'https://learn.rainbow.me/swap-with-confidence-with-rainbow',
                query: {
                  campaign: 'explain',
                },
              })
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
  swap_refuel_add: {
    logo: (
      <DashedWrapper
        size={50}
        childXPosition={10}
        colors={[
          colors?.networkColors[params?.network],
          getTokenMetadata(params?.nativeAsset?.mainnet_address)?.color ??
            colors?.appleBlue,
        ]}
      >
        <CoinIcon
          mainnet_address={params?.nativeAsset?.mainnet_address}
          address={params?.nativeAsset?.address}
          symbol={params?.nativeAsset?.symbol}
          type={params?.nativeAsset?.type}
          size={30}
          badgeSize="tiny"
          badgeXPosition={-4}
          badgeYPosition={1}
        />
      </DashedWrapper>
    ),
    title: lang.t('explain.swap_refuel.title', {
      networkName: params?.networkName,
      gasToken: params?.gasToken,
    }),
    text: lang.t('explain.swap_refuel.text', {
      networkName: params?.networkName,
      gasToken: params?.gasToken,
    }),
    button: {
      label: lang.t('button.no_thanks'),
      textColor: 'blueGreyDark60',
      bgColor: colors?.transparent,
      onPress: params?.onContinue,
    },
    secondaryButton: {
      label: lang.t('explain.swap_refuel.button', {
        networkName: params?.networkName,
        gasToken: params?.gasToken,
      }),
      textColor: colors?.networkColors[params?.network],
      bgColor:
        colors?.networkColors[params?.network] &&
        colors?.alpha(colors?.networkColors[params?.network], 0.05),
      onPress: params?.onRefuel,
    },
  },
  swap_refuel_deduct: {
    logo: (
      <DashedWrapper
        size={50}
        childXPosition={10}
        colors={[
          colors?.networkColors[params?.network],
          getTokenMetadata(params?.nativeAsset?.mainnet_address)?.color ??
            colors?.appleBlue,
        ]}
      >
        <CoinIcon
          address={params?.nativeAsset?.mainnet_address}
          symbol={params?.nativeAsset?.symbol}
          type={params?.nativeAsset?.type}
          size={30}
          badgeSize="tiny"
          badgeXPosition={-4}
          badgeYPosition={1}
        />
      </DashedWrapper>
    ),
    title: lang.t('explain.swap_refuel_deduct.title', {
      networkName: params?.networkName,
      gasToken: params?.gasToken,
    }),
    text: lang.t('explain.swap_refuel_deduct.text', {
      networkName: params?.networkName,
      gasToken: params?.gasToken,
    }),
    button: {
      label: lang.t('button.no_thanks'),
      textColor: 'blueGreyDark60',
      bgColor: colors?.transparent,
      onPress: params?.onContinue,
    },
    secondaryButton: {
      label: lang.t('explain.swap_refuel_deduct.button', {
        networkName: params?.networkName,
        gasToken: params?.gasToken,
      }),
      textColor: colors?.networkColors[params?.network],
      bgColor:
        colors?.networkColors[params?.network] &&
        colors?.alpha(colors?.networkColors[params?.network], 0.05),
      onPress: params?.onRefuel,
    },
  },
  swap_refuel_notice: {
    extraHeight: 50,
    logo: (
      <DashedWrapper
        size={50}
        childXPosition={10}
        colors={[
          colors?.networkColors[params?.network],
          getTokenMetadata(params?.nativeAsset?.mainnet_address)?.color ??
            colors?.appleBlue,
        ]}
      >
        <CoinIcon
          address={params?.nativeAsset?.mainnet_address}
          symbol={params?.nativeAsset?.symbol}
          type={params?.nativeAsset?.type}
          size={30}
          badgeSize="tiny"
          badgeXPosition={-4}
          badgeYPosition={1}
        />
      </DashedWrapper>
    ),
    title: lang.t('explain.swap_refuel_notice.title', {
      networkName: params?.networkName,
      gasToken: params?.gasToken,
    }),
    text: lang.t('explain.swap_refuel_notice.text', {
      networkName: params?.networkName,
      gasToken: params?.gasToken,
    }),
    button: {
      label: lang.t('button.go_back'),
      textColor: 'blueGreyDark60',
      bgColor: colors?.transparent,
      onPress: params?.onContinue,
    },
    secondaryButton: {
      label: lang.t('button.proceed_anyway'),
      textColor: colors?.appleBlue,
      bgColor: colors?.alpha(colors?.appleBlue, 0.05),
      onPress: params?.onProceed,
    },
  },
});

const ExplainSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const insets = useSafeAreaInsets();
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
    const onSecondaryPress = e => {
      if (explainSheetConfig?.readMoreLink) {
        return handleReadMore(e);
      }
      if (explainSheetConfig.secondaryButton?.onPress) {
        return explainSheetConfig.secondaryButton.onPress(
          navigate,
          goBack,
          handleClose
        );
      }

      return goBack(e);
    };

    const onPrimaryPress = e => {
      if (explainSheetConfig.button?.onPress) {
        return explainSheetConfig.button.onPress(navigate, goBack, handleClose);
      }

      handleClose(e);
    };

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
          onPress={onSecondaryPress}
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
          explainSheetConfig.button?.bgColor ||
          colors.alpha(colors.appleBlue, 0.04)
        }
        isTransparent
        label={explainSheetConfig.button?.label || lang.t('button.got_it')}
        onPress={onPrimaryPress}
        size="big"
        textColor={explainSheetConfig.button?.textColor ?? colors.appleBlue}
        weight="heavy"
        testID={'explainer-sheet-accent'}
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
    explainSheetConfig.secondaryButton,
    explainSheetConfig?.readMoreLink,
    goBack,
    handleClose,
    handleReadMore,
    navigate,
    type,
  ]);

  return (
    <Container deviceHeight={deviceHeight} height={sheetHeight} insets={insets}>
      <SlackSheet
        additionalTopPadding={android}
        contentHeight={sheetHeight}
        scrollEnabled={false}
      >
        <Centered
          direction="column"
          height={sheetHeight}
          testID={`explain-sheet-${type}`}
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
