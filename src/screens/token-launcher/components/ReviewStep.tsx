import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import FastImage from 'react-native-fast-image';

import { ChainImage } from '@/components/coin-icon/ChainImage';
import { isValidURLWorklet } from '@/components/DappBrowser/utils';
import { Box, Text, TextShadow } from '@/design-system';
import { type TextSize } from '@/design-system/components/Text/Text';
import { abbreviateNumber, convertAmountToBalanceDisplay, convertAmountToNativeDisplay } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import formatURLForDisplay from '@/utils/formatURLForDisplay';

import { FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, LINK_ICON_SIZE } from '../constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { LINK_SETTINGS } from './LinksSection';
import { TOKEN_LAUNCHER_HEADER_HEIGHT, TOKEN_LAUNCHER_SCROLL_INDICATOR_INSETS } from './TokenLauncherHeader';
import { TokenLogo } from './TokenLogo';

const CARD_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.03)';
const TOTAL_COST_PILL_HEIGHT = 52;

function AboutCard() {
  const { accentColors } = useTokenLauncherContext();

  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const description = useTokenLauncherStore(state => state.description);
  const links = useTokenLauncherStore(state => state.validLinks());

  if (description === '' && links.length === 0) return null;

  return (
    <Box gap={20} backgroundColor={CARD_BACKGROUND_COLOR} padding={'20px'} borderRadius={FIELD_BORDER_RADIUS} width={'full'}>
      <Text size="17pt" weight="heavy" color={'label'}>
        {i18n.t(i18n.l.token_launcher.review.about)}
      </Text>
      {description !== '' && (
        <Text size="17pt" weight="medium" color={'labelSecondary'}>
          {description}
        </Text>
      )}
      {links.length > 0 && (
        <Box gap={4}>
          {links.map(link => {
            const linkSettings = LINK_SETTINGS[link.type as keyof typeof LINK_SETTINGS];
            const Icon =
              link.type === 'website' && imageUri
                ? // eslint-disable-next-line react/display-name
                  () => (
                    <FastImage
                      source={{ uri: imageUri }}
                      style={{ width: LINK_ICON_SIZE, height: LINK_ICON_SIZE, borderRadius: LINK_ICON_SIZE / 2 }}
                    />
                  )
                : linkSettings.Icon;

            const { displayName } = linkSettings;
            const input = isValidURLWorklet(link.input) ? formatURLForDisplay(link.input) : link.input;

            return (
              <Box
                key={link.input}
                height={36}
                backgroundColor={accentColors.opacity3}
                borderRadius={14}
                borderWidth={THICK_BORDER_WIDTH}
                paddingHorizontal={'12px'}
                borderColor={{ custom: accentColors.opacity2 }}
                flexDirection="row"
                alignItems="center"
                gap={12}
              >
                <Box width={20} height={20} justifyContent="center" alignItems="center">
                  <Icon />
                </Box>
                <Text size="17pt" weight="medium" color={'labelSecondary'}>
                  {displayName}
                </Text>
                <Box justifyContent="flex-end" flexDirection="row" style={{ flex: 1 }}>
                  <Text size="17pt" weight="medium" color={{ custom: accentColors.opacity100 }} numberOfLines={1}>
                    {input}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function NetworkCard() {
  const { accentColors } = useTokenLauncherContext();
  const { chainId } = useTokenLauncherStore();
  const networkLabel = useBackendNetworksStore.getState().getChainsLabel()[chainId];
  const tokenChainId = useTokenLauncherStore(state => state.chainId);

  return (
    <Box
      width={'full'}
      height={60}
      backgroundColor={CARD_BACKGROUND_COLOR}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={'16px'}
      paddingHorizontal={'20px'}
      borderRadius={FIELD_BORDER_RADIUS}
    >
      <Text size="17pt" weight="heavy" color={'label'}>
        {i18n.t(i18n.l.token_launcher.review.network)}
      </Text>
      <Box flexDirection="row" alignItems="center" gap={8}>
        <ChainImage position="relative" chainId={tokenChainId} size={16} />
        <Text color={{ custom: accentColors.opacity100 }} size="17pt" weight="heavy" style={{ textTransform: 'capitalize' }}>
          {networkLabel}
        </Text>
      </Box>
    </Box>
  );
}

function TotalSupplyCard() {
  const { accentColors } = useTokenLauncherContext();
  const tokenSupply = useTokenLauncherStore(state => state.totalSupply);

  return (
    <Box
      width={'full'}
      height={60}
      backgroundColor={CARD_BACKGROUND_COLOR}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingVertical={'16px'}
      paddingHorizontal={'20px'}
      borderRadius={FIELD_BORDER_RADIUS}
    >
      <Text size="17pt" weight="heavy" color={'label'}>
        {i18n.t(i18n.l.token_launcher.review.total_supply)}
      </Text>
      <Text size="17pt" weight="bold" style={{ textTransform: 'capitalize' }} color={{ custom: accentColors.opacity100 }}>
        {abbreviateNumber(tokenSupply, 2, 'long', true)}
      </Text>
    </Box>
  );
}

function TotalCostPill() {
  const { accentColors, chainNativeAsset } = useTokenLauncherContext();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const extraBuyAmount = useTokenLauncherStore(state => state.extraBuyAmount);
  const chainNativeAssetNativePrice = useTokenLauncherStore(state => state.chainNativeAssetNativePrice);

  const totalCost = extraBuyAmount * chainNativeAssetNativePrice;
  const formattedTotalCost = convertAmountToNativeDisplay(totalCost, nativeCurrency, 2, false, totalCost >= 10000);

  // TODO: This is supposed to be a blurview, but to give a shadow you need a solid color background, which defeats the purpose of the blurview
  return (
    <Box
      height={TOTAL_COST_PILL_HEIGHT}
      background={'surfacePrimary'}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      width={'full'}
      padding={'20px'}
      borderRadius={26}
      borderWidth={FIELD_BORDER_WIDTH}
      borderColor={{ custom: accentColors.opacity10 }}
      shadow={{
        custom: {
          ios: [{ x: 0, y: 20, blur: 30, color: 'shadowFar', opacity: 0.3 }],
          android: { elevation: 16, color: 'shadowFar', opacity: 0.55 },
        },
      }}
    >
      <Box style={StyleSheet.absoluteFill} backgroundColor={accentColors.opacity40} />
      <Box style={StyleSheet.absoluteFill} backgroundColor={'rgba(255, 255, 255, 0.08)'} />
      <Text size="17pt" weight="heavy" color={'label'}>
        {i18n.t(i18n.l.token_launcher.review.total_cost)}
      </Text>
      <Box flexDirection="row" alignItems="center" gap={4}>
        <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
          {convertAmountToBalanceDisplay(extraBuyAmount, chainNativeAsset)}
        </Text>
        <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity30 }}>
          {'≈'}
        </Text>
        <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
          {formattedTotalCost}
        </Text>
      </Box>
    </Box>
  );
}

// Because this review step is rendered while the info input step is renderd, we don't want to trigger whole tree re-renders when the inputs are changing
function TokenSymbolAndName() {
  const { accentColors } = useTokenLauncherContext();
  const tokenSymbol = useTokenLauncherStore(state => state.symbol);
  const tokenName = useTokenLauncherStore(state => state.name);

  const symbolFontSize: TextSize = useMemo(() => {
    if (tokenSymbol.length > 24) {
      return '11pt';
    } else if (tokenSymbol.length >= 20) {
      return '15pt';
    } else if (tokenSymbol.length >= 14) {
      return '22pt';
    } else if (tokenSymbol.length >= 8) {
      return '34pt';
    }
    return '44pt';
  }, [tokenSymbol]);

  return (
    <Box alignItems="center" paddingTop={'20px'} gap={14}>
      <TextShadow blur={12} shadowOpacity={0.24}>
        <Text size={symbolFontSize} weight="heavy" color={{ custom: accentColors.opacity100 }}>
          {`$${tokenSymbol}`}
        </Text>
      </TextShadow>
      <Text size="20pt" weight="bold" color={'labelSecondary'}>
        {tokenName}
      </Text>
    </Box>
  );
}

function TokenPriceAndMarketCap() {
  const { accentColors } = useTokenLauncherContext();
  const tokenPrice = useTokenLauncherStore(state => state.tokenPrice());
  const tokenMarketCap = useTokenLauncherStore(state => state.tokenMarketCap());

  return (
    <Box gap={12} flexDirection="row" justifyContent="space-between" paddingVertical={'20px'}>
      <Box gap={12} flexGrow={1} padding={'20px'} backgroundColor={accentColors.opacity12} borderRadius={FIELD_BORDER_RADIUS}>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {tokenPrice}
          </Text>
        </TextShadow>
        <Text size="15pt" weight="bold" color={'labelSecondary'}>
          {i18n.t(i18n.l.token_launcher.review.initial_price)}
        </Text>
      </Box>
      <Box gap={12} flexGrow={1} padding={'20px'} backgroundColor={accentColors.opacity12} borderRadius={FIELD_BORDER_RADIUS}>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {tokenMarketCap}
          </Text>
        </TextShadow>
        <Text size="15pt" weight="bold" color={'labelSecondary'}>
          {i18n.t(i18n.l.token_launcher.review.market_cap)}
        </Text>
      </Box>
    </Box>
  );
}

export function ReviewStep() {
  const step = useTokenLauncherStore(state => state.step);
  const isVisible = step === NavigationSteps.REVIEW;
  const prebuyAmount = useTokenLauncherStore(state => state.extraBuyAmount);
  const hasPrebuy = prebuyAmount > 0;

  const contentContainerStyle = useMemo(() => {
    return {
      // Without this, the scrollview will get stuck on every layout after its first
      flexGrow: 1,
      paddingTop: TOKEN_LAUNCHER_HEADER_HEIGHT,
      paddingBottom: hasPrebuy ? TOTAL_COST_PILL_HEIGHT + 24 : 24,
    };
  }, [hasPrebuy]);

  return (
    <Box style={styles.flex}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        scrollIndicatorInsets={TOKEN_LAUNCHER_SCROLL_INDICATOR_INSETS}
        showsVerticalScrollIndicator={false}
      >
        <Box width="full" paddingHorizontal={'20px'} alignItems="center">
          <TokenLogo disabled={true} />
          <TokenSymbolAndName />
          <TokenPriceAndMarketCap />
          <Box width={'full'} gap={8}>
            {/* These sections specifically we won't want re-rendering while the inputs are changing, everything else is inconsequential */}
            {isVisible && (
              <>
                <TotalSupplyCard />
                <NetworkCard />
                <AboutCard />
              </>
            )}
          </Box>
        </Box>
      </ScrollView>
      {hasPrebuy && (
        <Box position="absolute" width={'full'} paddingHorizontal={'16px'} style={{ bottom: 16 }}>
          <TotalCostPill />
        </Box>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
