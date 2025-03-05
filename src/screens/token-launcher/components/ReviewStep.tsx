import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text, TextShadow } from '@/design-system';
import { TokenLogo } from './TokenLogo';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH } from '../constants';
import { abbreviateNumber, convertAmountToNativeDisplay, convertAmountToPercentageDisplay } from '@/helpers/utilities';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { useAccountProfile, useAccountSettings } from '@/hooks';
import { LINK_SETTINGS } from './LinksSection';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { TOKEN_LAUNCHER_HEADER_HEIGHT } from './TokenLauncherHeader';
import FastImage from 'react-native-fast-image';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { isAddress } from '@ethersproject/address';
import { address as abbreviateAddress } from '@/utils/abbreviations';

const CARD_BACKGROUND_COLOR = 'rgba(255, 255, 255, 0.03)';
const TOTAL_COST_PILL_HEIGHT = 52;

function TokenAllocationCard() {
  const { accentColors } = useTokenLauncherContext();
  const { accountColor, accountImage, accountAddress } = useAccountProfile();

  const allocationBips = useTokenLauncherStore(state => state.allocationBips());
  const airdropRecipients = useTokenLauncherStore(state => state.validAirdropRecipients());
  const totalAirdropAddresses = airdropRecipients.reduce((acc, recipient) => {
    return acc + recipient.count;
  }, 0);
  const bipsPerAirdropAddress = allocationBips.airdrop / totalAirdropAddresses;

  return (
    <Box gap={20} backgroundColor={CARD_BACKGROUND_COLOR} padding={'20px'} borderRadius={FIELD_BORDER_RADIUS} width={'full'}>
      <Text size="17pt" weight="heavy" color={'label'}>
        {'Token allocation'}
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
              {'Your share'}
            </Text>
          </Box>
          <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
            {`${convertAmountToPercentageDisplay(allocationBips.creator / 100, 2, 2, false)}`}
          </Text>
        </Box>
        {airdropRecipients.map(recipient => {
          const label = isAddress(recipient.value) ? abbreviateAddress(recipient.value, 4, 4) : recipient.label;

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
                {recipient.type === 'address' && (
                  <AddressAvatar address={recipient.value} url={recipient.imageUrl} size={20} color={accentColors.opacity100} label={''} />
                )}
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
                {`${convertAmountToPercentageDisplay((bipsPerAirdropAddress * recipient.count) / 100, 0, 1, false)}`}
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

  const description = useTokenLauncherStore(state => state.description);
  // Emtpy links do not prevent you from continuing, but they are not valid so they are not shown
  const links = useTokenLauncherStore(state => state.links.filter(link => link.input !== ''));

  if (description === '' && links.length === 0) return null;

  return (
    <Box gap={20} backgroundColor={CARD_BACKGROUND_COLOR} padding={'20px'} borderRadius={FIELD_BORDER_RADIUS} width={'full'}>
      <Text size="17pt" weight="heavy" color={'label'}>
        {'About'}
      </Text>
      {description !== '' && (
        <Text size="17pt" weight="medium" color={'labelSecondary'}>
          {description}
        </Text>
      )}
      {links.length > 0 && (
        <Box gap={4}>
          {links.map(link => {
            const { Icon, displayName } = LINK_SETTINGS[link.type as keyof typeof LINK_SETTINGS];
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
                <Text style={{ flex: 1 }} size="17pt" weight="medium" color={'labelSecondary'}>
                  {displayName}
                </Text>
                <Text size="17pt" weight="medium" color={{ custom: accentColors.opacity100 }}>
                  {link.input}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function TotalCostPill() {
  const { accentColors } = useTokenLauncherContext();
  const { nativeCurrency } = useAccountSettings();

  const creatorBuyInEth = useTokenLauncherStore(state => state.creatorBuyInEth);
  const ethPriceNative = useTokenLauncherStore(state => state.ethPriceNative);

  const totalCost = creatorBuyInEth * ethPriceNative;
  const formattedTotalCost = convertAmountToNativeDisplay(totalCost, nativeCurrency, 2, false, totalCost >= 10000);

  return (
    <Box
      as={BlurView}
      height={TOTAL_COST_PILL_HEIGHT}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      width={'full'}
      padding={'20px'}
      borderRadius={26}
      borderWidth={FIELD_BORDER_WIDTH}
      borderColor={{ custom: accentColors.opacity10 }}
      blurAmount={24}
      blurType="ultraThinMaterial"
      // TODO: to give this a dark shadow you need a dark background color which messes with the blurview
      // shadow={'30px'}
    >
      <LinearGradient colors={[accentColors.opacity12, 'rgba(255, 255, 255, 0.08)']} style={StyleSheet.absoluteFill} />
      <Text size="17pt" weight="heavy" color={'label'}>
        {'Total cost'}
      </Text>
      <Box flexDirection="row" alignItems="center" gap={4}>
        <Text size="17pt" weight="bold" color={{ custom: accentColors.opacity100 }}>
          {`${creatorBuyInEth} ETH`}
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

export function ReviewStep() {
  const { accentColors } = useTokenLauncherContext();
  const tokenSymbol = useTokenLauncherStore(state => state.symbol);
  const tokenName = useTokenLauncherStore(state => state.name);
  const tokenPrice = useTokenLauncherStore(state => state.tokenPrice());
  const tokenMarketCap = useTokenLauncherStore(state => state.tokenMarketCap());
  const tokenSupply = useTokenLauncherStore(state => state.totalSupply);
  const tokenChainId = useTokenLauncherStore(state => state.chainId);
  const prebuyAmount = useTokenLauncherStore(state => state.creatorBuyInEth);
  const hasPrebuy = prebuyAmount > 0;
  const networkLabel = useBackendNetworksStore.getState().getChainsLabel()[tokenChainId];

  return (
    <>
      <ScrollView
        contentOffset={{ x: 0, y: -TOKEN_LAUNCHER_HEADER_HEIGHT }}
        contentInset={{ top: TOKEN_LAUNCHER_HEADER_HEIGHT }}
        contentContainerStyle={{
          paddingBottom: 24 + (hasPrebuy ? TOTAL_COST_PILL_HEIGHT : 0),
        }}
      >
        <Box width="full" paddingHorizontal={'20px'} alignItems="center">
          <TokenLogo />
          <Box alignItems="center" paddingTop={'20px'} gap={14}>
            <TextShadow blur={12} shadowOpacity={0.24}>
              <Text size="44pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
                {`$${tokenSymbol}`}
              </Text>
            </TextShadow>
            <Text size="20pt" weight="bold" color={'labelSecondary'}>
              {tokenName}
            </Text>
          </Box>
          <Box gap={12} flexDirection="row" justifyContent="space-between" paddingVertical={'20px'}>
            <Box gap={12} flexGrow={1} padding={'20px'} backgroundColor={accentColors.opacity12} borderRadius={FIELD_BORDER_RADIUS}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
                  {tokenPrice}
                </Text>
              </TextShadow>
              <Text size="15pt" weight="bold" color={'labelSecondary'}>
                {'Initial price'}
              </Text>
            </Box>
            <Box gap={12} flexGrow={1} padding={'20px'} backgroundColor={accentColors.opacity12} borderRadius={FIELD_BORDER_RADIUS}>
              <TextShadow blur={12} shadowOpacity={0.24}>
                <Text size="20pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
                  {tokenMarketCap}
                </Text>
              </TextShadow>
              <Text size="15pt" weight="bold" color={'labelSecondary'}>
                {'Market cap'}
              </Text>
            </Box>
          </Box>
          <Box width={'full'} gap={8}>
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
                {'Total Supply'}
              </Text>
              <Text size="17pt" weight="bold" style={{ textTransform: 'capitalize' }} color={{ custom: accentColors.opacity100 }}>
                {abbreviateNumber(tokenSupply, 2, 'long', true)}
              </Text>
            </Box>
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
                {'Network'}
              </Text>
              <Box flexDirection="row" alignItems="center" gap={8}>
                <ChainImage position="relative" chainId={tokenChainId} size={16} />
                <Text color={{ custom: accentColors.opacity100 }} size="17pt" weight="heavy" style={{ textTransform: 'capitalize' }}>
                  {networkLabel}
                </Text>
              </Box>
            </Box>
            <TokenAllocationCard />
            <AboutCard />
          </Box>
        </Box>
      </ScrollView>
      {hasPrebuy && (
        <Box position="absolute" width={'full'} paddingHorizontal={'16px'} style={{ bottom: 16 }}>
          <TotalCostPill />
        </Box>
      )}
    </>
  );
}
