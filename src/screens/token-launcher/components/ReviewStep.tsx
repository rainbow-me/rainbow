import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ContactAvatar } from '@/components/contacts';
import { isValidURLWorklet } from '@/components/DappBrowser/utils';
import { Box, Text, TextShadow } from '@/design-system';
import { TextSize } from '@/design-system/components/Text/Text';
import { abbreviateNumber, convertAmountToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { isENSAddressFormat } from '@/helpers/validators';
import * as i18n from '@/languages';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { colors } from '@/styles';
import { formatURLForDisplay } from '@/utils';
import { address as abbreviateAddress } from '@/utils/abbreviations';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { isAddress } from 'viem';
import { FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH, LINK_ICON_SIZE } from '../constants';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { LINK_SETTINGS } from './LinksSection';
import { TOKEN_LAUNCHER_HEADER_HEIGHT, TOKEN_LAUNCHER_SCROLL_INDICATOR_INSETS } from './TokenLauncherHeader';
import { TokenLogo } from './TokenLogo';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const CARD_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.03)';
const TOTAL_COST_PILL_HEIGHT = 52;

function TokenAllocationCard() {
  const { accentColors } = useTokenLauncherContext();
  const { accountColor, accountImage } = useAccountProfileInfo();
  const accountAddress = useAccountAddress();

  const allocationBips = useTokenLauncherStore(state => state.allocationBips());
  const airdropRecipients = useTokenLauncherStore(state => state.validAirdropRecipients());
  const totalAirdropAddresses = airdropRecipients.reduce((acc, recipient) => {
    return acc + recipient.count;
  }, 0);
  const bipsPerAirdropAddress = allocationBips.airdrop / totalAirdropAddresses;

  return (
    <Box gap={20} backgroundColor={CARD_BACKGROUND_COLOR} padding={'20px'} borderRadius={FIELD_BORDER_RADIUS} width={'full'}>
      <Text size="17pt" weight="heavy" color={'label'}>
        {i18n.t(i18n.l.token_launcher.review.token_allocation)}
      </Text>
      <Box gap={4}>
        <Box
          flexDirection="row"
          alignItems="center"
          height={44}
          paddingHorizontal={'16px'}
          borderRadius={16}
          borderWidth={FIELD_BORDER_WIDTH}
          borderColor={{ custom: accentColors.opacity4 }}
        >
          <Box flexGrow={1} flexDirection="row" alignItems="center" gap={10}>
            <AddressAvatar url={accountImage} address={accountAddress} label={accountAddress} color={accountColor} size={20} />
            <Text size="17pt" weight="medium" color={'labelSecondary'}>
              {i18n.t(i18n.l.token_launcher.review.your_share)}
            </Text>
          </Box>
          <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
            {`${convertAmountToPercentageDisplay(allocationBips.creator / 100, 2, 2, false)}`}
          </Text>
        </Box>
        {airdropRecipients.map(recipient => {
          const isEnsOrCohort = isENSAddressFormat(recipient.label) || recipient.type === 'group';
          const label = isEnsOrCohort
            ? recipient.label
            : isAddress(recipient.label)
              ? abbreviateAddress(recipient.value, 4, 4)
              : recipient.label;

          return (
            <Box
              key={recipient.id}
              height={44}
              gap={32}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingHorizontal={'16px'}
              backgroundColor={accentColors.opacity3}
              borderRadius={16}
              borderWidth={FIELD_BORDER_WIDTH}
              borderColor={{ custom: accentColors.opacity2 }}
            >
              <Box flexDirection="row" alignItems="center" gap={8} style={{ flex: 1 }}>
                {recipient.type === 'address' &&
                  (recipient.imageUrl ? (
                    <AddressAvatar
                      address={recipient.value}
                      url={recipient.imageUrl}
                      size={20}
                      color={accentColors.opacity100}
                      label={''}
                    />
                  ) : (
                    <ContactAvatar
                      hideShadow
                      color={colors.avatarBackgrounds[addressHashedColorIndex(recipient.label) ?? 0]}
                      size="smaller"
                      value={addressHashedEmoji(recipient.label)}
                    />
                  ))}
                {recipient.type === 'group' && (
                  <FastImage
                    source={{ uri: recipient.imageUrl ?? '' }}
                    style={{ width: 20, height: 20, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                )}
                <Box flexDirection="row" alignItems="center" gap={8} style={{ flex: 1 }}>
                  <Text size="17pt" weight="medium" color={'labelSecondary'} numberOfLines={1}>
                    {label}
                  </Text>
                  {recipient.type === 'group' && (
                    <Box
                      height={18}
                      borderRadius={7}
                      borderWidth={1.667}
                      paddingHorizontal={'4px'}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text size="11pt" weight="heavy" color={'labelSecondary'}>
                        {abbreviateNumber(recipient.count, 1)}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
              <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
                {`${convertAmountToPercentageDisplay((bipsPerAirdropAddress * recipient.count) / 100, 0, undefined, false)}`}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

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
          {`${extraBuyAmount} ${chainNativeAsset.symbol}`}
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
                <TokenAllocationCard />
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
